# PRD: Personal Engineering OS (V1)

## 1. Introduction / Overview

**Project Name:** Personal Engineering OS

**Goal:** A personal command center for software engineering work and college life that unifies meetings, tasks, notes, GitHub pull requests, and daily planning in one place.

**Problem:** Daily work is spread across too many tools. The user has to switch between calendar, notes, task lists, GitHub, and personal reminders just to understand what matters today. This creates friction, missed follow-ups, and wasted time deciding what to do next.

**Primary Outcome:** The user should be able to open one app in the morning, understand the day in seconds, stay organized during meetings and coding work, and end the day with a useful recap.

---

## 2. Goals

1. Give the user a single dashboard for daily engineering and school work.
2. Reduce context switching across calendar, tasks, notes, and GitHub.
3. Make it easy to prepare for meetings and capture follow-up actions.
4. Surface the most urgent and relevant work through a simple priority engine.
5. Provide an end-of-day recap flow that helps plan tomorrow.
6. Build a product that is genuinely useful every day and strong enough to showcase in interviews.

---

## 3. User Stories

- As a user, I want to open one dashboard and immediately understand what matters today.
- As a user, I want to see today's meetings so I can prepare before they start.
- As a user, I want to create, edit, and organize tasks across internship, school, and personal work.
- As a user, I want to attach notes and tasks to meetings so I do not lose follow-up work.
- As a user, I want to see pull requests that need my attention so I can stay on top of code review.
- As a user, I want the system to recommend what I should work on next.
- As a user, I want to end the day with a recap so I can reflect on progress and plan tomorrow.

---

## 4. Functional Requirements

### 4.1 Dashboard

1. The system must display today's meetings.
2. The system must display the user's highest priority tasks.
3. The system must display deadlines within the next 7 days.
4. The system must display pull requests that need user attention.
5. The system must include a quick note area on the dashboard.
6. The system must display a recommended next action based on the priority engine.

### 4.2 Tasks

7. The system must allow the user to create tasks.
8. The system must allow the user to edit tasks.
9. The system must allow the user to delete tasks.
10. The system must allow the user to mark tasks as complete.
11. The system must allow the user to assign priority to a task.
12. The system must allow the user to assign a due date to a task.
13. The system must allow the user to assign each task to a workspace such as internship, school, personal, or club.
14. The system must allow filtering tasks by status, workspace, and due date.
15. The system must allow tasks to link to meetings and notes.

### 4.3 Meetings

16. The system must allow the user to sign in with Microsoft.
17. The system must sync calendar events from the user's account.
18. The system must display a list of today's meetings.
19. The system must provide a detail page for each meeting.
20. The system must allow the user to attach notes to a meeting.
21. The system must allow the user to create follow-up tasks from a meeting.

### 4.4 Notes

22. The system must allow the user to create notes.
23. The system must allow the user to edit notes.
24. The system must allow the user to delete notes.
25. The system must allow notes to link to meetings.
26. The system must allow notes to link to tasks.
27. The system must support note types such as meeting, worklog, general, and journal.

### 4.5 GitHub PR Tracker

28. The system must allow the user to connect GitHub.
29. The system must fetch pull request metadata for the user.
30. The system must display pull requests created by the user.
31. The system must display pull requests assigned to the user.
32. The system must display pull requests needing review from the user.
33. The system must display stale pull requests based on recent inactivity.
34. The system must provide direct links to the original pull request pages on GitHub.

### 4.6 Daily Recap

35. The system must provide one daily recap entry per day.
36. The system must allow the user to record accomplishments.
37. The system must allow the user to record blockers.
38. The system must allow the user to record the top 3 priorities for tomorrow.
39. The system must allow the user to record carry-over work.

### 4.7 Search

40. The system must allow the user to search across tasks, notes, meetings, and pull request titles.

### 4.8 Priority Engine

41. The system must calculate a rule-based priority score for tasks.
42. The system must consider due date, manual priority, meeting linkage, blocked status, and task staleness.
43. The system must surface top recommended tasks on the dashboard.

---

## 5. Non-Goals (Out of Scope)

The first version will not include:

- Teams chat integration
- Email integration
- File and document syncing
- Mobile app support
- Browser extension support
- Team collaboration or shared workspaces
- AI-generated summaries across the whole app
- Advanced analytics dashboards
- Vector search
- Voice input or voice notes
- Offline mode

---

## 6. Design Considerations

- The product should be desktop-first.
- The visual style should feel clean, minimal, and productivity-focused.
- Primary navigation should include: Today, Tasks, Meetings, Notes, GitHub, Recap, Search.
- Creating a task or note should take only a few seconds.
- Meeting detail pages should make follow-up actions easy and obvious.
- The dashboard should use strong visual hierarchy so the most important items stand out first.

---

## 7. Technical Considerations

- Recommended stack: Next.js, TypeScript, Tailwind CSS, shadcn/ui, Prisma, PostgreSQL.
- Microsoft authentication should be used for primary sign-in.
- GitHub authentication should be used for pull request integration.
- Calendar sync should start with basic event data only.
- Pull request integration should focus on metadata first, not deep diff analysis.
- The priority engine should be rule-based in V1 so it stays easy to understand and adjust.
- The architecture should leave room for future integrations without major rewrites.

---

## 8. Success Metrics

1. The user opens the app at least once per day.
2. The dashboard becomes the primary place the user checks to plan the day.
3. The user creates and manages tasks regularly inside the app.
4. The user links notes to meetings at least once per week.
5. The user completes a daily recap at least 3 times per week.
6. The task creation flow takes less than 10 seconds.
7. The app feels fast and reliable enough for daily use.

---

## 9. Open Questions

1. Should GitHub data refresh automatically in V1 or only on manual sync?
2. Should workspace assignment be required for every task?
3. Should tasks created from notes automatically link back to the originating note?
4. Should the daily recap be optional or nudged more aggressively later?
5. Should meeting notes and general notes share the same editor and schema long term?
