## Relevant Files

- `app/(dashboard)/page.tsx` - Main Today dashboard surface for meetings, top tasks, and recommended actions.
- `app/tasks/page.tsx` - Task management page.
- `app/meetings/page.tsx` - Meetings list page.
- `app/meetings/[id]/page.tsx` - Meeting detail page with linked notes and tasks.
- `app/notes/page.tsx` - Notes management page.
- `app/github/page.tsx` - Pull request tracking page.
- `app/recap/page.tsx` - Daily recap page.
- `app/search/page.tsx` - Search page across tasks, notes, meetings, and PRs.
- `app/api/dashboard/today/route.ts` - Aggregates dashboard data.
- `app/api/tasks/route.ts` - Task CRUD API handler.
- `app/api/meetings/sync/route.ts` - Syncs calendar events from Microsoft.
- `app/api/github/sync/route.ts` - Syncs pull request metadata from GitHub.
- `lib/priority/scoreTasks.ts` - Rule-based task scoring logic.
- `lib/integrations/microsoft.ts` - Microsoft auth and calendar integration helpers.
- `lib/integrations/github.ts` - GitHub auth and PR integration helpers.
- `prisma/schema.prisma` - Database models for users, workspaces, tasks, meetings, notes, PRs, and recaps.

### Notes

- Unit tests should typically be placed alongside the files they test.
- Use `npx jest [optional/path/to/test/file]` to run tests. Running without a path executes all tests found by the Jest configuration.

## Instructions for Completing Tasks

**Important:** As you complete each task, update this markdown file by changing `- [ ]` to `- [x]`.

Example:
- `- [ ] 1.1 Read file` becomes `- [x] 1.1 Read file` after completing it.

Update the file after completing each sub-task, not only after an entire parent task.

## Tasks

- [ ] 0.0 Create feature branch
- [ ] 1.0 Set up the project foundation
- [ ] 2.0 Build the core data model and persistence layer
- [ ] 3.0 Implement task, note, and daily recap workflows
- [ ] 4.0 Implement Microsoft authentication and meetings sync
- [ ] 5.0 Implement GitHub authentication and PR tracking
- [ ] 6.0 Build the Today dashboard and priority engine
- [ ] 7.0 Implement search, polish the UI, and prepare the MVP demo

I have generated the high-level tasks based on the requirements. Ready to generate the sub-tasks? Respond with `Go` to proceed.
