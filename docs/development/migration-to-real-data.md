# Migration to Real Data — V1 → V2

Roadmap to transform the current prototype (in-memory mock data, no auth) into a real, production-grade app with persistent storage, authenticated users, and live integrations with Microsoft Calendar and GitHub.

---

## 0. Current state (where we are)

What's built today:

- **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind. All 7 PRD routes live (`/`, `/tasks`, `/meetings`, `/meetings/[id]`, `/notes`, `/github`, `/recap`, `/search`).
- **State**: in-memory React Context store at `lib/store.tsx`, hydrated from `lib/mock/seed.ts` on every page load. No persistence.
- **Types**: full domain model in `lib/types.ts` (`Workspace`, `Task`, `Meeting`, `Note`, `PullRequest`, `Recap`).
- **Priority engine**: pure function in `lib/priority/scoreTasks.ts` with 7 unit tests passing — already production-ready, no rewrite needed.
- **No auth**, no API routes, no database, no real integrations.

Everything below is what needs to change to get real.

---

## 1. Phase 1 — Database (Prisma + Postgres)

**Goal**: replace the seed file with a real Postgres database, accessed via Prisma.

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

## 2. Phase 2 — Authentication (NextAuth + Microsoft + GitHub)

**Goal**: gate the app behind sign-in. Microsoft for the primary identity (per PRD §7), GitHub linked secondarily for PR data.

### 2.1 Set up NextAuth (Auth.js v5)

```bash
npm install next-auth@beta
```

Create `auth.ts` at the repo root with the Auth.js v5 setup. Configure two providers:

- **Microsoft (Azure AD)** — for sign-in and Calendar API tokens.
- **GitHub** — for PR API tokens (linked, not primary).

### 2.2 Microsoft Azure AD app

1. Register an app in the Azure portal → Microsoft Entra ID.
2. Add redirect URI `https://<host>/api/auth/callback/microsoft-entra-id` (and `localhost` for dev).
3. Add API permissions: `User.Read`, `Calendars.Read`, `offline_access`.
4. Generate a client secret. Store `AZURE_AD_CLIENT_ID`, `AZURE_AD_CLIENT_SECRET`, `AZURE_AD_TENANT_ID` in env.

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

## 3. Phase 3 — Replace the in-memory store with server data

**Goal**: every read/write hits Postgres. Optimistic updates keep the UI snappy.

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

## 4. Phase 4 — Microsoft Calendar sync

**Goal**: meetings on the dashboard are real Outlook/Teams events, not seed data.

### 4.1 Graph API basics

- Endpoint: `https://graph.microsoft.com/v1.0/me/calendarView?startDateTime=…&endDateTime=…`
- Auth: bearer token from the user's Microsoft account (Phase 2.4 helper).
- Returns events with `subject`, `start`, `end`, `location`, `attendees`, `bodyPreview`.

### 4.2 Sync strategy

**V1 — manual + on-load**:
- On dashboard load, kick off a background sync if last successful sync > 5 min ago.
- Pull `calendarView` for `[today - 1d, today + 7d]`.
- Upsert to `Meeting` table keyed by `(userId, externalId)`.

**V2 — delta sync**:
- Use the `?$deltaToken=` endpoint to fetch only changes since last sync.
- Store `deltaLink` per user.

**V3 — webhooks (subscriptions)**:
- Microsoft Graph supports change notifications. Higher complexity, deferrable.

### 4.3 Mapping Outlook events → our `Meeting` model

The PRD's `workspace` field has no Microsoft equivalent — derive heuristically:
- Default to `"internship"` for events on the user's primary work calendar.
- Allow manual override stored on the local `Meeting` row.
- Long-term: let users set per-calendar workspace defaults in settings.

### 4.4 Edge cases to plan for

- Recurring events: Graph returns instances inside `calendarView` — handle each instance, don't dedupe on series id.
- Cancelled events: soft-delete locally so attached notes/tasks aren't lost.
- Time zones: Graph returns UTC; convert at render only.
- Rate limits: 10,000 requests / 10 min / app — should never hit this for personal use, but handle 429 with exponential backoff.

### 4.5 Files to add

| Path | Change |
|---|---|
| `lib/integrations/microsoft.ts` | Graph client + `syncCalendar(userId)` |
| `app/api/sync/calendar/route.ts` | POST endpoint that triggers sync |
| `prisma/schema.prisma` | Add `Meeting.externalId`, `Meeting.calendarSyncToken` |

---

## 5. Phase 5 — GitHub PR sync

**Goal**: PRs on the GitHub page are real, bucketed correctly, and refresh on a sensible cadence.

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

## 6. Phase 6 — Background jobs & cron

**Goal**: things that should happen automatically (PR refresh, recap reminder).

Recommendation: **Inngest** (free tier, great DX) or **Vercel Cron** (simpler if you're already on Vercel).

| Job | Cadence | What it does |
|---|---|---|
| `sync-calendars` | every 30 min | Pull deltas for every active user's calendar |
| `sync-prs` | every hour | Refresh PR buckets for each user |
| `recap-reminder` | daily at 5pm user-local | Optional — push notification or email if no recap yet today |
| `mark-stale-prs` | daily | Re-bucket stale PRs based on `updatedAt < now - 7d` |

User-local timing requires storing each user's timezone (capturable on first sign-in via `Intl.DateTimeFormat().resolvedOptions().timeZone`).

---

## 7. Phase 7 — Deployment

### 7.1 Hosting

- **App**: Vercel (Next.js 14 native, server actions just work).
- **Database**: Neon (Postgres serverless) or Supabase. Both have generous free tiers.
- **Background jobs**: Inngest (no infra to manage) or Vercel Cron (zero-config but capped at 60s execution).

### 7.2 Env vars to wire up

```
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
AZURE_AD_CLIENT_ID=
AZURE_AD_CLIENT_SECRET=
AZURE_AD_TENANT_ID=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=
INNGEST_EVENT_KEY=    # if using Inngest
INNGEST_SIGNING_KEY=
```

### 7.3 Pre-launch checklist

- [ ] DB migrations run cleanly on a fresh Postgres
- [ ] OAuth redirect URIs include the production host
- [ ] Rate-limit-aware sync jobs (don't hammer Microsoft / GitHub)
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

1. **Calendar sync cadence**: does the user want real-time-ish (webhooks) or "good enough" (10-min polling)? Default: polling.
2. **GitHub repo scope**: read all repos the user can access, or maintain an explicit allow-list per workspace? Default: all.
3. **Workspace assignment for synced events**: heuristic vs. manual. Default: heuristic + override.
4. **Recap nudging**: silent, in-app, or push notification? Default: silent in V2, escalate later if usage drops off.
5. **Multi-device session**: are we expecting concurrent sessions? Affects optimistic-update conflict handling.

---

## 10. Risks & considerations

- **OAuth token refresh failures**: the user gets a stale calendar/PR list silently. Surface a "Re-link account" banner with a clear CTA.
- **Microsoft Graph quirks**: recurring events are notoriously fiddly. Budget time for testing edge cases.
- **GitHub API rate limits**: 5,000 requests/hr authenticated. Per-user it's plenty, but a careless `for-each-PR refresh` loop will burn through it fast.
- **Data sensitivity**: meeting subjects and PR titles can contain confidential information. At a minimum: HTTPS-only, encrypted DB-at-rest, no third-party analytics on entity content. Consider field-level encryption for note bodies if storing on shared infra.
- **Compliance**: if this ever becomes more than personal use, the Microsoft Graph scope `Calendars.Read` requires admin consent in many tenants — plan for that approval flow.

---

## 11. Suggested sequencing (8-week plan)

| Week | Focus |
|---|---|
| 1 | Phase 1 — Prisma schema + migrations. Convert seed to DB. App still uses `useStore`, but reads come from Prisma via a thin adapter. |
| 2 | Phase 2 — NextAuth with Microsoft + GitHub. Sign-in works, but no integrations yet. |
| 3 | Phase 3 — server actions + React Query. Replace `useStore` everywhere. |
| 4 | Phase 4 — calendar sync (polling, no webhooks). Live meeting data. |
| 5 | Phase 5 — GitHub PR sync. Live PR data. |
| 6 | Phase 6 — background jobs. Cadence + recap reminders. |
| 7 | Phase 7 — deploy to Vercel + Neon. Real env. |
| 8 | Polish, error boundaries, observability, edge cases. Ship. |

The frontend, design system, and priority engine **don't change** through any of this — they're already in their final form.
