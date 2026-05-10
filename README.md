# Personal Engineering OS

A single-pane command center for engineering work and college life — calendar, tasks, notes, pull requests, and a daily recap, unified behind one priority engine.

Built as a personal tool, designed like a product.

> **Live demo:** _coming soon_

---

## Why this exists

I bounce between an internship, classes, side projects, and clubs. Linear, Notion, Google Calendar, GitHub, and a notebook each held a slice of my day, and the cost of context-switching was higher than the cost of building a tool.

So I built one. Everything I look at in a morning lives on one page, and the things that matter today are surfaced by a scoring function — not by my mood.

---

## Features

- **Today** — hero task chosen by a priority engine, today's meetings, PRs needing review, deadlines in the next 7 days, quick-capture note.
- **Tasks** — workspaces (`internship` / `school` / `personal` / `club`), priorities, statuses, optimistic editing, drawer-based detail view.
- **Notes** — free-form or a structured daily-log template (Key Learnings, Mistakes & Lessons, Next Steps, Questions, What I Built).
- **Meetings** — month calendar synced from Google Calendar, per-event workspace reclassification, agenda + attendee detail page.
- **Pull requests** — bucketed view (Needs Your Review, Authored, Assigned, Stale) synced from the GitHub GraphQL API with CI rollup and stale-after-7d auto-rebucketing.
- **Recap** — end-of-day reflection (shipped, blockers, top 3 tomorrow, carry-over) with yesterday's recap visible alongside.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, Server Actions) |
| Language | TypeScript |
| DB | Postgres (Neon) via Prisma |
| Auth | Auth.js v5 (next-auth) — Google + GitHub |
| UI | Tailwind, Radix primitives, lucide-react |
| Tests | Vitest |
| Hosting | Vercel (incl. cron) |

---

## Architectural decisions worth reading the code for

A few things in here are non-obvious and were shaped by real friction. Pointers:

### 1. Cross-provider account linking with merge-on-link
[`auth.ts`](./auth.ts)

Signing in via GitHub while already signed in via Google would normally create a *second* user row. The `jwt` callback detects this case (by reading the existing session cookie before NextAuth replaces it), then either refreshes the existing `Account` row or moves the new one onto the existing user — and deletes the duplicate. The result: one user, two providers, no email-collision footgun.

### 2. Edge-safe middleware split from the Node-runtime auth config
[`auth.config.ts`](./auth.config.ts) · [`middleware.ts`](./middleware.ts) · [`auth.ts`](./auth.ts)

The Prisma adapter is Node-only, but middleware runs on the Edge runtime. A base config (no adapter, no providers) is what middleware imports; the full config extends it with the adapter + OAuth providers and lives in `auth.ts`. Without this split, middleware fails to bundle.

### 3. OAuth token refresh with a safety window
[`lib/auth/tokens.ts`](./lib/auth/tokens.ts)

`getValidAccessToken()` checks expiry against `now + 60s` so tokens about to expire mid-request are refreshed proactively. Refresh failures return `null` rather than throwing, so callers degrade gracefully ("re-link account") instead of 500-ing.

### 4. Optimistic UI with temp-id tolerance
[`lib/store.tsx`](./lib/store.tsx) · [`app/actions/tasks.ts`](./app/actions/tasks.ts) · [`app/actions/notes.ts`](./app/actions/notes.ts)

Creates render an optimistic row with a `_temp_xxx` id while the server call is in flight. If the user edits or deletes that row before the server responds, the store skips the round-trip (no real id to hit). On the server, update/delete actions use `updateMany`/`deleteMany` so saves against a deleted row no-op instead of throwing — debounced editors don't crash when the underlying note has been removed.

### 5. Priority engine
[`lib/priority/scoreTasks.ts`](./lib/priority/scoreTasks.ts) · [tests](./lib/priority/scoreTasks.test.ts)

Tasks are scored from priority weight, due-date proximity (overdue gets a heavy bonus), in-progress bias, and meeting-linkage proximity. The "hero" card on Today is `argmax(score)`, and each card explains *why* it scored ("overdue 2d", "due today", "linked to standup in 30m").

### 6. Vercel cron with bearer auth
[`lib/cron/auth.ts`](./lib/cron/auth.ts) · [`app/api/cron/`](./app/api/cron/)

Three scheduled jobs: calendar sync (every ~30m), PR sync (hourly), stale-PR rebucket (daily). Each batches users (`take: 50`, oldest-stale-first) so a single run stays under Vercel's 60s budget. All three are gated by a shared `CRON_SECRET` bearer.

### 7. Per-user ownership checks on every action
[`app/actions/_helpers.ts`](./app/actions/_helpers.ts)

Every server action calls `requireUserId()` and scopes its Prisma query with `where: { id, userId }`. There is no codepath that touches a row without filtering by the calling user. The pattern is boring on purpose.

### 8. Prisma singleton + Neon noise filter
[`lib/db.ts`](./lib/db.ts)

Standard hot-reload guard so `next dev` doesn't exhaust the connection pool. Plus an event-emitter logger that silences Postgres `57P01` ("terminating connection due to administrator command") — Neon's pooler closes idle connections on its own schedule, Prisma reconnects transparently, and the noise was crowding out real errors.

---

## Data model

```
User ─┬─ Account[]        (Auth.js — one per linked provider)
      ├─ Session[]        (Auth.js)
      ├─ Task[] ──────────────── linkedNotes[]  (M:N)
      │                          linkedMeeting? (FK)
      ├─ Meeting[] ─────────── notes[], tasks[] (back-refs)
      ├─ Note[] ──────────────── linkedTasks[]  (M:N)
      │                          linkedMeeting? (FK)
      ├─ PullRequest[]    (replace-strategy on sync)
      └─ Recap[]          (one per user per day, upserted)
```

See [`prisma/schema.prisma`](./prisma/schema.prisma) for the full schema.

---

## Running locally

```bash
# 1. Install
npm install

# 2. Add the env vars below to .env.local

# 3. DB
npx prisma migrate dev

# 4. Dev server
npm run dev
```

### Required env vars

| Var | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (Neon works out of the box) |
| `AUTH_SECRET` | Auth.js JWT secret (`openssl rand -base64 32`) |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth credentials |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth app |
| `CRON_SECRET` | Bearer token Vercel Cron sends to `/api/cron/*` |

Google OAuth must request the `calendar.readonly` scope; GitHub must request `repo` (for private PRs). Both are configured in [`auth.ts`](./auth.ts).

### Useful scripts

```bash
npm run dev          # Next.js dev server
npm run build        # Production build
npm test             # Vitest (priority engine)
npm run lint         # next lint
npm run db:migrate   # prisma migrate dev
npm run db:studio    # prisma studio
```

---

## Deploying

The app is built for Vercel. After connecting the repo:

1. Set every env var from the table above in the Vercel project settings.
2. Add a `vercel.json` cron schedule (already in repo) — three jobs hitting the `/api/cron/*` routes.
3. Run `prisma migrate deploy` against the prod DB (Neon's connection-pooled URL is fine).
4. Update each OAuth app's redirect URI to `https://<your-domain>/api/auth/callback/<provider>`.

---

## Repo layout

```
app/
  (app)/                authed routes — today, tasks, notes, meetings, recap, github, settings
  actions/              server actions, all guarded by requireUserId()
  api/
    auth/[...nextauth]/ Auth.js handlers
    cron/               Vercel Cron endpoints
components/             UI (shell, primitives, notes editor)
lib/
  auth/                 token refresh
  cron/                 cron bearer auth
  integrations/         google calendar + github graphql
  notes/                daily-log template parse/serialize
  priority/             task scoring + tests
  store.tsx             client store with optimistic updates
  db.ts                 Prisma singleton
prisma/
  schema.prisma
  migrations/
```

---

## Roadmap

- Per-calendar workspace mapping (today every Google event lands in `internship` by default).
- All-day events on the calendar.
- Search across tasks + notes.
- A weekly recap that aggregates the daily ones.

---

Built by [Fabio Campos](mailto:fabiocam@andrew.cmu.edu).
