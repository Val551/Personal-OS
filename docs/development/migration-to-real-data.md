# Migration to Real Data — V1 → V2

Roadmap to transform the current prototype (in-memory mock data, no auth) into a real, production-grade app with persistent storage, authenticated users, and live integrations with Google Calendar and GitHub.

---

## 0. Current state (where we are)

**Phases 1–6 are shipped.** Phase 7 (deployment) is next.

What's running:

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind. 8 routes live: `/`, `/tasks`, `/meetings`, `/meetings/[id]`, `/notes`, `/github`, `/recap`, `/settings`, plus `/login`. (`/search` was deleted — `⌘K` palette in the topbar covers that.)
- **Design system**: shadcn/ui. Reskinned from the original terminal/serif aesthetic. Light + dark theme via `next-themes`, toggle in topbar (no "system" option — just light/dark).
- **Database**: Postgres on Neon, accessed via Prisma. Schema covers `User` (with `timezone`, `lastCalendarSyncAt`, `lastPRSyncAt`), `Account`, `Session`, `Task`, `Meeting`, `Note`, `PullRequest`, `Recap`, plus NextAuth's `VerificationToken`. No mock data anywhere; all seed/fixture files removed.
- **Auth**: NextAuth.js v5 with Google (OIDC) + GitHub (OAuth). JWT session strategy. `lib/auth/tokens.ts` refreshes Google tokens when expired.
- **Account linking**: `/login` is Google-only. GitHub is connected from `/settings` after sign-in. Custom `jwt` callback in `auth.ts` reads the existing JWT cookie inside the callback and force-merges the new provider's account onto the original user — works regardless of email match. Stale-cookie escape hatch at `/api/clear-session` (a route handler, since server components can't clear cookies). Note: the callback fires for both `account.type === "oauth"` and `"oidc"`; gating on `"oauth"` only would silently skip Google sign-ins.
- **State**: `lib/store.tsx` is hydrated server-side from Prisma in `app/(app)/layout.tsx`. Server actions in `app/actions/*.ts` mutate; the store updates optimistically. Editors that get keystrokes (notes body, task drawer) debounce server saves at 500ms with flush-on-close so typing isn't laggy.
- **Notes**: 2 types — `worklog` and `general`. The "+ new note" button opens a dropdown: **Blank note** creates a `general`, **Daily log** creates a `worklog` with a templated body (Date + Key Learnings / Mistakes & Lessons / Next Steps / Questions to Answer / What I Built Today). When a note's body parses as that template, the editor renders a structured form per section; otherwise it's a plain auto-grow textarea.
- **Meetings**: `/meetings` is a Sun→Sat month grid (calendar view) with prev/next month nav and a "Today" jump. Click an event chip → `/meetings/[id]`. The detail page lets you reclassify the workspace (internship / school / personal / club) via a dropdown. Workspace edits survive future syncs because the upsert's `update` clause omits `workspace`.
- **Calendar sync**: `lib/integrations/google.ts` pulls `[today-30d, today+180d]` events via the Calendar API, upserts to `Meeting` keyed by `(userId, externalId)`, soft-deletes cancellations. Triggered manually from `/meetings` and on cron (every 30 min).
- **PR sync**: `lib/integrations/github.ts` runs one GraphQL request fetching authored / review-requested / assigned buckets (50 each), buckets stale (>7d) post-fetch, replaces the user's PR rows. Triggered manually from `/github` and on cron (hourly).
- **Cron**: `app/api/cron/{sync-calendars,sync-prs,mark-stale-prs}/route.ts`. Bearer-auth gated by `CRON_SECRET`. `vercel.json` declares the schedules. Middleware excludes `/api/cron` so the bearer check is the only gate.
- **Recap reminder**: server-rendered banner above the layout shows after 5pm user-local if no recap exists for today. User-local timezone captured on first dashboard load via `Intl.DateTimeFormat().resolvedOptions().timeZone` and stored on `User.timezone`.
- **Priority engine**: `lib/priority/scoreTasks.ts` unchanged from V1. Numeric score is no longer rendered in the UI — it still drives task ordering.

What's NOT yet built (Phase 7+): deployment, full-text search indexing, push-notification delivery.

---

## 1. Phase 1 — Database (Prisma + Postgres) ✅ shipped

**Goal**: replace the seed file with a real Postgres database, accessed via Prisma.

**As built**: schema lives in `prisma/schema.prisma`. Hosted on Neon. `lib/db.ts` exports the singleton client. The seed script (`prisma/seed.ts`) and mock fixtures (`lib/mock/seed.ts`) were later deleted — there's no demo data path anymore; sign in to populate.

### 1.1 Set up

```bash
npm install -D prisma
npm install @prisma/client
npx prisma init --datasource-provider postgresql
```

Provision a Postgres instance — recommendation: **Neon** (serverless, Vercel-friendly, generous free tier) or **Supabase**. Set `DATABASE_URL` in `.env.local`.

### 1.2 Translate `lib/types.ts` → `prisma/schema.prisma`

The TypeScript types map almost 1:1 to Prisma models. Key additions:

- A `User` model (no concept of user today — the seed assumes a single user).
- All entity tables get a `userId` foreign key + index.
- Account/Session tables for NextAuth (Phase 2).

Sketch:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  createdAt     DateTime  @default(now())

  tasks         Task[]
  meetings      Meeting[]
  notes         Note[]
  pullRequests  PullRequest[]
  recaps        Recap[]
  accounts      Account[] // NextAuth
  sessions      Session[] // NextAuth
}

model Task {
  id              String     @id @default(cuid())
  userId          String
  title           String
  notes           String?
  workspace       Workspace
  priority        Priority
  status          TaskStatus
  dueAt           DateTime?
  completedAt     DateTime?
  createdAt       DateTime   @default(now())
  updatedAt       DateTime   @updatedAt
  linkedMeetingId String?

  user            User       @relation(fields: [userId], references: [id], onDelete: Cascade)
  linkedMeeting   Meeting?   @relation(fields: [linkedMeetingId], references: [id])
  linkedNotes     Note[]     @relation("TaskNotes")

  @@index([userId, status])
  @@index([userId, dueAt])
}

enum Workspace { internship school personal club }
enum Priority  { low med high urgent }
enum TaskStatus { todo doing blocked done }
// …Meeting, Note, PullRequest, Recap, NoteType enum, etc.
```

### 1.3 Migration plan

- `npx prisma migrate dev --name init` — generates the SQL.
- Convert `lib/mock/seed.ts` into a `prisma/seed.ts` script that inserts the same fixtures into the DB for dev/demo. Wire it via `prisma.seed` in `package.json`.
- Keep the existing seed file around for tests.

### 1.4 Files to add / change

| Path | Change |
|---|---|
| `prisma/schema.prisma` | New |
| `prisma/seed.ts` | New — converted from `lib/mock/seed.ts` |
| `lib/db.ts` | New — singleton `PrismaClient` with hot-reload guard |
| `.env.local` | Add `DATABASE_URL` |

---

## 2. Phase 2 — Authentication (NextAuth + Google + GitHub) ✅ shipped

**Goal**: gate the app behind sign-in. Google for the primary identity (CMU is on Google Workspace) and Calendar API tokens. GitHub linked secondarily for PR data.

> **Deviation from the PRD**: the PRD called for Microsoft Entra ID. We're using Google instead because the user's primary calendar lives in Google Calendar, not Outlook. Same NextAuth structure, different provider.

**As built — additions to the original plan**:

- **Login is Google-only.** The `/login` page only shows the Google provider; GitHub is connected from the `/settings` page after sign-in. This avoids the "second provider replaces my session" trap that account-linking by email-match has.
- **In-app account linking via custom `jwt` callback.** When a signed-in user OAuths into a second provider, `auth.ts` reads the existing JWT cookie inside the `jwt` callback, finds the user, and re-points the just-created `Account` row at them — deleting the duplicate user that PrismaAdapter spawned. Cross-email linking works (your school Google + personal GitHub end up on one user).
- **Important gotcha — provider type matters.** Google's account type is `"oidc"`, not `"oauth"`. An early version of the callback gated on `account.type === "oauth"`, which meant Google sign-ins skipped the logic and `token.uid` was never set → infinite redirect loop on `/`. The fix: don't gate on type, fire whenever `user && account` are both present.
- **Stale-cookie escape hatch at `/api/clear-session`.** Server components can't modify cookies in Next.js 14. When the layout detects a JWT pointing to a deleted user, it redirects to this route handler (excluded from middleware) which calls `cookies().delete()` and bounces to `/login`.
- **Session callback falls back to `token.sub`.** NextAuth auto-sets `sub` on the JWT; our custom callback adds `uid`. Falling back from `uid` → `sub` keeps any pre-existing cookies working through code changes.

### 2.1 Set up NextAuth (Auth.js v5)

```bash
npm install next-auth@beta
```

Create `auth.ts` at the repo root with the Auth.js v5 setup. Configure two providers:

- **Google** — for sign-in and Calendar API tokens.
- **GitHub** — for PR API tokens (linked, not primary).

### 2.2 Google OAuth client

1. Open https://console.cloud.google.com → create or pick a project.
2. **APIs & Services** → **Library** → enable **Google Calendar API**.
3. **APIs & Services** → **OAuth consent screen** → **External** (unless on a Google Workspace) → fill in the basics.
4. On the consent screen, add scopes: `openid`, `.../auth/userinfo.email`, `.../auth/userinfo.profile`, `.../auth/calendar.readonly`.
5. Add yourself as a test user (only matters if the app is in "testing" mode).
6. **APIs & Services** → **Credentials** → **+ Create credentials** → **OAuth client ID** → **Web application**.
7. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google` (and your prod host when you deploy).
8. Store `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` in env.

### 2.3 GitHub OAuth app

1. Settings → Developer settings → OAuth Apps → New.
2. Scopes: `read:user`, `repo` (for private PR access — use `public_repo` for public-only).
3. Store `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET`.

### 2.4 Token storage

NextAuth's Prisma adapter stores `access_token`, `refresh_token`, and `expires_at` per provider on the `Account` model. The sync jobs (Phases 4 & 5) read from there. Implement a `getValidAccessToken(userId, provider)` helper in `lib/auth/tokens.ts` that refreshes when expired.

### 2.5 Protect the app

- Add `middleware.ts` redirecting unauthenticated users to `/login`.
- Replace the hardcoded "Fabio Campos" sidebar chip with `session.user`.
- The `StoreProvider` in `app/layout.tsx` becomes a thin server component that fetches the user's data; the client store hooks become React Query hooks (Phase 3).

### 2.6 Files to add / change

| Path | Change |
|---|---|
| `auth.ts` | New |
| `app/api/auth/[...nextauth]/route.ts` | New |
| `middleware.ts` | New |
| `app/login/page.tsx` | New — sign-in screen |
| `lib/auth/tokens.ts` | New — token refresh helper |
| `components/shell/Sidebar.tsx` | Wire to `session.user` |

---

## 3. Phase 3 — Replace the in-memory store with server data ✅ shipped

**Goal**: every read/write hits Postgres. Optimistic updates keep the UI snappy.

**Deviation from the original plan**: skipped React Query. `lib/store.tsx` is still a React Context store, but it's now hydrated from Prisma in `app/(app)/layout.tsx` (server component) and mutations call server actions directly with optimistic updates handled in the store itself. Simpler than React Query for this app's size; revisit if the cache invalidation story gets messy.

### 3.1 Server actions (recommended over API routes)

Next.js 14 server actions are ergonomic and type-safe. Create `app/actions/` with one file per entity:

- `tasks.ts` — `createTask`, `updateTask`, `deleteTask`, `toggleTaskComplete`, `setTaskStatus`
- `notes.ts` — `createNote`, `updateNote`, `deleteNote`
- `meetings.ts` — `attachNoteToMeeting`, `createFollowUpTask`
- `recap.ts` — `saveRecap`
- `prs.ts` — `resyncPRs` (triggers Phase 5 sync job)

Each action is a thin Prisma call gated by the authenticated `userId` from `auth()`.

### 3.2 Client data layer with React Query

```bash
npm install @tanstack/react-query
```

Replace `lib/store.tsx` with hooks per entity:

- `lib/queries/useTasks.ts` — `useQuery` against a server action / API route
- `lib/queries/useMeetings.ts`, `useNotes.ts`, `usePRs.ts`, `useRecap.ts`
- Each mutation hook (`useCreateTask`) wraps the server action + invalidates the query cache + does optimistic updates.

The pages themselves change minimally — `useStore()` calls become `useTasks()`, `useCreateTask()`, etc.

### 3.3 Risks

- **Hydration**: server-rendered task list must match client. Easiest path: render pages with `await prisma.task.findMany()` in server components, then hydrate React Query cache client-side.
- **Optimistic updates**: required for the snappy "create task" feel. Use `onMutate` / `onError` rollback in React Query.
- **Cmd+K palette**: currently iterates the full client store. With server data, debounce and either query the DB or load a slim full-text index into client memory.

### 3.4 Files to change

| Path | Change |
|---|---|
| `lib/store.tsx` | **Delete** — replaced by `lib/queries/*` |
| `app/actions/*.ts` | New — server actions |
| `lib/queries/*.ts` | New — React Query hooks |
| All `app/**/page.tsx` | Replace `useStore()` with the new hooks |
| `app/layout.tsx` | Add `QueryClientProvider` |

---

## 4. Phase 4 — Google Calendar sync ✅ shipped (V1)

**Goal**: meetings on the dashboard are real Google Calendar events, not seed data.

**As built**: V1 (manual sync button on `/meetings`). V2 incremental sync via `nextSyncToken` and V3 push notifications are deferred. All-day events are skipped. Workspace defaults to `"internship"` for every event — per-calendar mapping is V2.

### 4.1 Google Calendar API basics

- Endpoint: `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=…&timeMax=…&singleEvents=true&orderBy=startTime`
- Auth: bearer token from the user's Google account (Phase 2.4 helper).
- Returns events with `summary`, `start.dateTime`, `end.dateTime`, `location`, `attendees`, `description`, plus `recurringEventId` for series instances.
- Recommended client: `googleapis` npm package (`new google.calendar({ version: 'v3', auth })`).

### 4.2 Sync strategy

**V1 — manual + on-load**:
- On dashboard load, kick off a background sync if last successful sync > 5 min ago.
- Pull events for `[today - 1d, today + 7d]` with `singleEvents=true` (expands recurring series).
- Upsert to `Meeting` table keyed by `(userId, externalId)` where `externalId = event.id`.

**V2 — incremental sync via `syncToken`**:
- First sync: don't pass `syncToken`, store the `nextSyncToken` returned in the last page.
- Subsequent syncs: pass that token to get only changed events.
- If Google returns 410 Gone, fall back to a full re-sync.
- Store the token in `Meeting.calendarSyncToken` (or a dedicated `UserCalendarSync` table).

**V3 — push notifications (channels)**:
- Google Calendar supports `events.watch` for change notifications. Requires a public HTTPS callback URL — easier post-deployment.

### 4.3 Mapping Google events → our `Meeting` model

The PRD's `workspace` field has no Google equivalent — derive heuristically:
- Default to `"internship"` for events on the user's primary calendar.
- If the user has multiple calendars (work / school / personal), let them map calendars → workspaces in settings.
- Allow per-event manual override stored on the local `Meeting` row.

### 4.4 Edge cases to plan for

- **Recurring events**: with `singleEvents=true`, Google expands the series. Each instance has a unique `id` AND a `recurringEventId` pointing to the series. Use the instance `id` as `externalId`.
- **Cancelled events**: Google marks them with `status: "cancelled"` in delta sync. Soft-delete locally so attached notes/tasks aren't lost.
- **All-day events**: `start.date` (no time) instead of `start.dateTime`. Skip these from "today's schedule" or render differently.
- **Time zones**: Google returns events with `start.timeZone`. Convert at render time only — store UTC.
- **Rate limits**: 1,000,000 queries/day project-wide, 600 queries/min/user. Personal use won't come close.

### 4.5 Files to add

| Path | Change |
|---|---|
| `lib/integrations/google.ts` | Calendar client + `syncCalendar(userId)` |
| `app/api/sync/calendar/route.ts` | POST endpoint that triggers sync |
| `prisma/schema.prisma` | Already has `Meeting.externalId` and `Meeting.calendarSyncToken` from Phase 1. ✅ |

---

## 5. Phase 5 — GitHub PR sync ✅ shipped (V1)

**Goal**: PRs on the GitHub page are real, bucketed correctly, and refresh on a sensible cadence.

**As built**: V1 with a "replace strategy" — each sync deletes the user's PR rows and re-inserts from the GraphQL response. Capped at 50 PRs per bucket. Manual trigger only (the "Sync" button on `/github`). Webhooks deferred. Used a hand-rolled `fetch` to `api.github.com/graphql` instead of `@octokit/graphql` — one less dep, the query is small enough.

### 5.1 API choice

- **GraphQL** (`api.github.com/graphql`) is dramatically more efficient for this use case — one query returns authored, review-requested, assigned, and stale buckets in a single round trip.
- Octokit's `@octokit/graphql` is the cleanest client.

### 5.2 Bucket queries

Use `search` queries with the user's login:

| Bucket | Query |
|---|---|
| Authored | `is:pr author:@me state:open` |
| Review-requested | `is:pr review-requested:@me state:open` |
| Assigned | `is:pr assignee:@me state:open` |
| Stale | filter authored where `updatedAt < now - 7d` (post-fetch) |

### 5.3 Sync strategy

- **Initial**: pull all four buckets on first sign-in or first dashboard load.
- **Cadence**: every 10 min while the dashboard tab is active (visibility-aware), or 1×/hour if backgrounded.
- **Manual**: the existing "Sync" button on `/github` triggers `resyncPRs()`.
- **Webhooks (V2)**: subscribe to PR events for repos the user authors in. Hard to scope cleanly — defer.

### 5.4 Storage

Persist PR metadata so the dashboard doesn't block on a network call. Mark with `lastSyncedAt`. Refresh in the background.

### 5.5 Files to add

| Path | Change |
|---|---|
| `lib/integrations/github.ts` | GraphQL client + `syncPRs(userId)` |
| `app/api/sync/github/route.ts` | POST endpoint |

---

## 6. Phase 6 — Background jobs & cron ✅ shipped

**Goal**: keep calendar + PRs fresh without manual Sync clicks, and nudge for recap entry.

### 6.1 Runtime

**Vercel Cron** + route handlers under `app/api/cron/*`. Each endpoint validates `Authorization: Bearer $CRON_SECRET` before doing anything. The middleware excludes `/api/cron` (alongside `/api/auth` and `/api/clear-session`), so the bearer check is the only gate. Inngest deferred — Vercel Cron's 60s budget is plenty at personal scale.

### 6.2 Jobs (all implemented as `GET` handlers)

| Job | Endpoint | Cadence (`vercel.json`) | What it does |
|---|---|---|---|
| `sync-calendars` | `/api/cron/sync-calendars` | `*/30 * * * *` | Picks users with a Google account whose `lastCalendarSyncAt` is null or older than 25 min, runs `syncGoogleCalendar(userId)` for each, updates the timestamp. Caps at 50 users per run. Per-user failures (e.g. insufficient OAuth scopes) get logged in the response payload and skipped — they don't fail the whole run. |
| `sync-prs` | `/api/cron/sync-prs` | `0 * * * *` | Same pattern with `lastPRSyncAt` (55-min staleness threshold) |
| `mark-stale-prs` | `/api/cron/mark-stale-prs` | `0 3 * * *` | Single SQL `updateMany` re-bucketing `authored` PRs older than 7d into `stale`. Returns count. |

Recap reminder is implemented in-app, not as a cron — see §6.5.

### 6.3 User timezones

Captured on first dashboard load (not at sign-in time, since the OAuth callback can't see the browser's `Intl`). The layout passes `userRow.timezone` to a `<TimezoneSync>` client component which detects via `Intl.DateTimeFormat().resolvedOptions().timeZone` and posts to `updateTimezoneAction` only if missing. Stored in `User.timezone` as an IANA string.

### 6.4 Sync window note

`syncGoogleCalendar()` originally pulled an 8-day window (`-1d / +7d`), which left the calendar's month grid mostly empty. Widened to **30d past / 180d future** so navigating any reasonable month shows real data.

### 6.5 Recap reminder — chose option #1 (in-app banner)

Lives at `components/recap-reminder-banner.tsx`. Server-rendered above the layout on every authed page. Shows when:

1. User has a `timezone` captured (otherwise hidden — no way to determine "5pm local")
2. Current user-local hour ≥ 17
3. No `Recap` row exists for `today` user-local

The banner has a "Recap now" button → `/recap`. Disappears once a recap is submitted. No email/push delivery wired up — option #2/#3 from the original plan are deferred (defer until on a real domain).

### 6.6 Idempotency + concurrency

- Calendar sync: `upsert` keyed on `(userId, externalId)`, so re-runs are no-ops. Cancelled events soft-deleted.
- PR sync: `delete-then-insert` in a single transaction.
- Workspace edits on meetings survive future calendar syncs because the upsert's `update` clause omits `workspace`.
- Per-user failures don't break the run — the route handler accumulates `{ userId, ok, error }` in the response.

### 6.7 Files added

| Path | Change |
|---|---|
| `app/api/cron/sync-calendars/route.ts` | Fan-out + bearer-auth gate |
| `app/api/cron/sync-prs/route.ts` | Fan-out + bearer-auth gate |
| `app/api/cron/mark-stale-prs/route.ts` | One-shot SQL update |
| `vercel.json` | Cron schedule declarations |
| `lib/cron/auth.ts` | `assertCronCaller(req)` shared helper |
| `prisma/schema.prisma` | Added `User.lastCalendarSyncAt`, `User.lastPRSyncAt`. Migration `20260508172622_phase6_cron_tracking`. |
| `app/actions/profile.ts` | `updateTimezoneAction(timezone)` |
| `components/timezone-sync.tsx` | Client-side IANA timezone detect + persist on first load |
| `components/recap-reminder-banner.tsx` | Server-rendered nudge above the layout |
| `app/(app)/layout.tsx` | Wired `TimezoneSync` + `RecapReminderBanner`, expanded user query to include `timezone` |
| `middleware.ts` | Marked `/api/cron` public so bearer auth is the only gate |
| `.env.example` + `.env` | Added `CRON_SECRET` |

### 6.8 Local cron testing

```bash
SECRET=$(grep ^CRON_SECRET .env | sed -E 's/CRON_SECRET="(.+)"/\1/')
curl -H "Authorization: Bearer $SECRET" http://localhost:3000/api/cron/sync-calendars
curl -H "Authorization: Bearer $SECRET" http://localhost:3000/api/cron/sync-prs
curl -H "Authorization: Bearer $SECRET" http://localhost:3000/api/cron/mark-stale-prs
```

Vercel Cron only fires once deployed — locally hit endpoints with curl above when testing.

---

## 6.5. UX cleanup pass ✅ shipped

After Phase 6, did a focused pass to strip the prototype's "look at me" decoration:

- **Sidebar**: dropped the fake "system status" panel (calendar/github/priority indicators), the `WORKSPACE` section label, the `v0.1 · personal` brand subtext. Removed the `/search` nav item.
- **Topbar**: dropped the live clock and breadcrumb prefix. Just shows current page name.
- **Dashboard**: removed the `uptime XXm` counter (state, ref, useEffect — all gone), `on track` badge, `yyyy-MM-dd · HH:mm` timestamp label, decorative `.` after the day name, the `priority engine · top recommendation` heading, the `hero-glow scanlines` decorative effects, the raw priority `score` integer (engine still drives ordering, the number just isn't displayed).
- **All page headers**: removed the orange `.` after `Notes`, `Tasks`, `Meetings`, `Recap`, `Pull requests`.
- **Empty states + placeholders**: every `// xxx` terminal-comment string rewritten in plain English.
- **Notes**: collapsed 4 types (`meeting / worklog / general / journal`) to 2 (`worklog / general`). Migration `20260508150059_simplify_note_types` renamed the enum and reassigned existing rows. Removed `meeting` as the default note type from the meeting detail page (now `general`). Notes still link to meetings via `linkedMeetingId`, no functionality lost.
- **Theme toggle**: removed "System" item — just Light/Dark.
- **Settings**: removed scope display for Google + GitHub. Cards just show provider name, short description, connection status, Connect/Disconnect.
- **`/search` route**: deleted entirely. `⌘K` palette in topbar covers it.
- **Mock data**: `lib/mock/seed.ts` and `prisma/seed.ts` deleted, `prisma.seed` config removed from `package.json`.

---

## 6.6. Editor performance + structured daily logs ✅ shipped

Prototype had inline `onChange={(e) => updateXxx(...)}` on every text input → a Prisma write + Next.js round-trip per keystroke → notes were unusable to type into. Two fixes:

- **Debounced server saves**: notes editor and tasks drawer now keep `titleDraft` / `bodyDraft` / `notesDraft` local state. A `useEffect` 500ms after the last keystroke pushes the diff up. `flushAndSelect()` flushes pending edits before switching to another note/task so the last <500ms of typing isn't lost.
- **`AutoGrowTextarea` component**: `components/notes/auto-grow-textarea.tsx`. Resizes via `scrollHeight` on each value change so the page (not the textarea) is what scrolls. Replaced the prototype's `flex-1` textarea inside a `min-h-[560px]` Surface, which was causing internal trapped scrollbars.

Daily-log structured editor: `components/notes/daily-log-editor.tsx`. When a note is `worklog`-typed and its body parses as the daily-log template, the editor renders 5 labeled sections (Key Learnings / Mistakes & Lessons / Next Steps / Questions to Answer / What I Built Today) instead of one big textarea. Round-trips to and from markdown via `parseDailyLog` / `serializeDailyLog` in `lib/notes/templates.ts`. Falls back to plain auto-grow textarea if the template structure is broken.

---

## 6.7. Calendar UI + meeting reclassification ✅ shipped

`/meetings` redesigned from a list view into a Sun→Sat **month grid**:

- Header with prev/next chevrons + "Today" jump button
- Weekday header row, 6-row day grid
- Each day cell: day number top-right (today is a filled circle), up to 3 event chips with workspace-color dots, "+N more" overflow
- Click an event chip → `/meetings/[id]`
- Workspace legend at the bottom
- Sync calendar button preserved in the header

Meeting reclassification: detail page's static workspace badge is now a `DropdownMenu` with all four workspaces. `app/actions/meetings.ts#updateMeetingAction` ownership-checks via `updateMany` then `findUniqueOrThrow`. Store has an optimistic `updateMeeting()` method. Workspace edits persist across syncs because `lib/integrations/google.ts` only sets `workspace` on `create`, never on `update`.

---

## 7. Phase 7 — Deployment

### 7.1 Hosting

- **App**: Vercel (Next.js 14 native, server actions just work).
- **Database**: Neon (Postgres serverless) or Supabase. Both have generous free tiers.
- **Background jobs**: Inngest (no infra to manage) or Vercel Cron (zero-config but capped at 60s execution).

### 7.2 Env vars to wire up

```
DATABASE_URL=
AUTH_SECRET=
AUTH_GOOGLE_ID=
AUTH_GOOGLE_SECRET=
AUTH_GITHUB_ID=
AUTH_GITHUB_SECRET=
INNGEST_EVENT_KEY=    # if using Inngest
INNGEST_SIGNING_KEY=
```

### 7.3 Pre-launch checklist

- [ ] DB migrations run cleanly on a fresh Postgres
- [ ] OAuth redirect URIs include the production host
- [ ] Rate-limit-aware sync jobs (don't hammer Google / GitHub)
- [ ] Server-action error boundaries (no white-screening on a Prisma error)
- [ ] Logging/observability — at minimum capture sync failures
- [ ] Backups on the database

---

## 8. Migrations to schema after V2 ships

Things the PRD already hints at but should be deferred:

- **Cross-meeting/note/task linking**: today the schema is sparse on M2M relations. If you add full bidirectional linking, plan a `Link` join table or use Prisma's implicit M2M.
- **Workspace settings**: per-workspace color, default priority, default calendar. Add a `Workspace` table when you need configurability beyond the four fixed enums.
- **Search**: today's `includes()` filter won't scale. Add Postgres full-text indexes (`tsvector` + `tsquery`) on titles + bodies; or move to a dedicated index (Typesense / Meilisearch) if you cross ~10k records.
- **Vector search / AI summaries**: explicitly out of scope per PRD §5. Reconsider for V3.

---

## 9. Open questions to resolve before building

These map to PRD §9 — answers shape Phase 4–6:

1. **Calendar sync cadence**: does the user want real-time-ish (push notifications) or "good enough" (10-min polling)? Default: polling.
2. **GitHub repo scope**: read all repos the user can access, or maintain an explicit allow-list per workspace? Default: all.
3. **Workspace assignment for synced events**: heuristic vs. manual. Default: heuristic + override.
4. **Recap nudging**: silent, in-app, or push notification? Default: silent in V2, escalate later if usage drops off.
5. **Multi-device session**: are we expecting concurrent sessions? Affects optimistic-update conflict handling.

---

## 10. Risks & considerations

- **OAuth token refresh failures**: the user gets a stale calendar/PR list silently. Surface a "Re-link account" banner with a clear CTA.
- **Google `refresh_token` is one-shot**: it's only returned on the *first* consent. If the user re-consents without `prompt=consent`, no new refresh_token comes back and the app silently breaks once the access_token expires. Fix: always request `prompt=consent` + `access_type=offline` (already wired).
- **Recurring events**: notoriously fiddly. Budget time for testing edge cases.
- **GitHub API rate limits**: 5,000 requests/hr authenticated. Per-user it's plenty, but a careless `for-each-PR refresh` loop will burn through it fast.
- **Data sensitivity**: meeting subjects and PR titles can contain confidential information. At a minimum: HTTPS-only, encrypted DB-at-rest, no third-party analytics on entity content. Consider field-level encryption for note bodies if storing on shared infra.
- **Compliance**: if this ever becomes more than personal use, Google requires app verification before non-test users can grant `calendar.readonly` — plan for the verification submission.

---

## 11. Suggested sequencing (8-week plan)

| Week | Focus | Status |
|---|---|---|
| 1 | Phase 1 — Prisma schema + migrations. Convert seed to DB. | ✅ shipped |
| 2 | Phase 2 — NextAuth with Google + GitHub. Sign-in works. | ✅ shipped (Google primary; GitHub linked from `/settings`) |
| 3 | Phase 3 — server actions + replace `useStore` reads with server-hydrated data. | ✅ shipped (skipped React Query — context store + server actions instead) |
| 4 | Phase 4 — calendar sync (polling, no webhooks). | ✅ shipped (window: 30d past / 180d future) |
| 5 | Phase 5 — GitHub PR sync. | ✅ shipped (replace strategy, GraphQL one-shot) |
| 6 | Phase 6 — background jobs + recap reminder. | ✅ shipped (Vercel Cron + in-app banner) |
| 7 | Phase 7 — deploy to Vercel + Neon. Real env. | 🔄 next |
| 8 | Polish, error boundaries, observability, edge cases. Ship. |  |

In addition to the original plan, three unscheduled passes happened during V2:

- **shadcn/ui reskin** — replaced the prototype's terminal-style design system with shadcn primitives + CSS variables, light/dark theme, neutral palette
- **UX cleanup pass** — stripped decorative `// xxx` placeholders, `score` integers, fake status panels, decorative periods, etc. (§6.5)
- **Editor performance fix + daily-log structured editor** — debounced server saves on note/task editors, auto-grow textareas, structured daily-log template (§6.6)
- **Calendar UI rewrite + meeting reclassification** — month grid view replacing the list view; per-meeting workspace dropdown that survives sync (§6.7)

The priority engine **didn't change** — already in its final form.
