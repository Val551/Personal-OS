import type { Meeting, Note, PullRequest, Recap, Task } from "../types";

// All timestamps are anchored to "now" so the demo always feels current.
// Resolved at load time in the store provider.

export interface SeedData {
  tasks: Task[];
  meetings: Meeting[];
  notes: Note[];
  prs: PullRequest[];
  recaps: Recap[];
}

function iso(offsetMinutes: number, now = Date.now()): string {
  return new Date(now + offsetMinutes * 60 * 1000).toISOString();
}

function dayKey(offsetDays: number, now = Date.now()): string {
  const d = new Date(now + offsetDays * 24 * 60 * 60 * 1000);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function startOfTodayMorning(): number {
  // Anchor "today" to 09:00 local time so meeting offsets stay within the
  // current day regardless of when the demo runs. Times that should feel
  // "this morning" / "this afternoon" stay on the right calendar day.
  const d = new Date();
  d.setHours(9, 0, 0, 0);
  return d.getTime();
}

export function buildSeed(): SeedData {
  // Use real "now" for things measuring back from current time (e.g.,
  // recently-edited PRs), but anchor calendar events to today @ 09:00 so
  // meeting offsets are stable across the day.
  const now = Date.now();
  const todayStart = startOfTodayMorning();

  // Anchor meeting offsets to today @ 09:00 local so the schedule stays
  // populated regardless of what time the user opens the demo.
  const meetings: Meeting[] = [
    {
      id: "m_standup",
      title: "Stratus team — daily standup",
      startAt: iso(30, todayStart), // 09:30
      endAt: iso(45, todayStart),
      location: "Teams · #stratus-eng",
      attendees: ["Priya Rao", "Marc Doyle", "Yuki Chen", "You"],
      description:
        "Round-robin updates. Yesterday/today/blockers. Marc demo'ing the new ingest queue.",
      workspace: "internship",
      noteIds: ["n_standup"],
      taskIds: ["t_followup_standup"],
    },
    {
      id: "m_1on1",
      title: "1:1 — Yuki (mentor)",
      startAt: iso(60 * 2, todayStart), // 11:00
      endAt: iso(60 * 2 + 30, todayStart),
      location: "Hatchery — booth 3",
      attendees: ["Yuki Chen", "You"],
      description: "Career arc, ramp-up feedback, what to push on next half.",
      workspace: "internship",
      noteIds: [],
      taskIds: [],
    },
    {
      id: "m_ingest_review",
      title: "Ingest pipeline — design review",
      startAt: iso(60 * 5, todayStart), // 14:00
      endAt: iso(60 * 6, todayStart),
      location: "Conf room 4N · Hybrid",
      attendees: ["Yuki Chen", "Sam Patel", "Director Aleksandr", "You"],
      description: "Walk Aleksandr through the failover plan and the new shard layout.",
      workspace: "internship",
      noteIds: [],
      taskIds: [],
    },
    {
      id: "m_15745",
      title: "15-745 — compiler optimization lecture",
      startAt: iso(60 * 7 + 30, todayStart), // 16:30
      endAt: iso(60 * 9, todayStart),
      location: "GHC 4401",
      attendees: ["Prof. Nelson", "TAs", "You"],
      description: "Loop invariant code motion + dead-store elimination.",
      workspace: "school",
      noteIds: ["n_15745_notes"],
      taskIds: [],
    },
    {
      id: "m_office_hours",
      title: "Office hours — 15-440",
      startAt: iso(60 * 24 + 60, todayStart), // tomorrow 10:00
      endAt: iso(60 * 24 + 120, todayStart),
      location: "Wean 5419",
      attendees: ["TA Greta", "You"],
      description: "Debug the partial Paxos lab — leader election deadlock.",
      workspace: "school",
      noteIds: [],
      taskIds: [],
    },
  ];

  const tasks: Task[] = [
    {
      id: "t_followup_standup",
      title: "Spec the dead-letter queue retry policy",
      notes: "Marc raised it in standup — needs a doc + numbers before Friday.",
      workspace: "internship",
      priority: "high",
      status: "todo",
      dueAt: iso(60 * 24 * 2, now),
      createdAt: iso(-60, now),
      updatedAt: iso(-60, now),
      linkedMeetingId: "m_standup",
      linkedNoteIds: [],
    },
    {
      id: "t_ingest_diagram",
      title: "Update ingest topology diagram for design review",
      workspace: "internship",
      priority: "urgent",
      status: "doing",
      dueAt: iso(60 * 5 - 30, todayStart), // 30 min before the 14:00 review
      createdAt: iso(-60 * 24, now),
      updatedAt: iso(-30, now),
      linkedMeetingId: "m_ingest_review",
      linkedNoteIds: [],
    },
    {
      id: "t_15745_pset",
      title: "15-745 PS3 — implement LICM pass",
      notes: "LLVM pass framework. Tests in /support.",
      workspace: "school",
      priority: "high",
      status: "todo",
      dueAt: iso(60 * 24 * 4, now),
      createdAt: iso(-60 * 24 * 5, now),
      updatedAt: iso(-60 * 24, now),
      linkedNoteIds: [],
    },
    {
      id: "t_440_paxos",
      title: "15-440 lab — fix leader election deadlock",
      workspace: "school",
      priority: "med",
      status: "blocked",
      dueAt: iso(60 * 24 * 6, now),
      createdAt: iso(-60 * 24 * 8, now),
      updatedAt: iso(-60 * 24 * 3, now),
      linkedMeetingId: "m_office_hours",
      linkedNoteIds: [],
    },
    {
      id: "t_resume",
      title: "Update resume with Stratus internship metrics",
      workspace: "personal",
      priority: "med",
      status: "todo",
      dueAt: iso(60 * 24 * 5, now),
      createdAt: iso(-60 * 24 * 10, now),
      updatedAt: iso(-60 * 24 * 9, now),
      linkedNoteIds: [],
    },
    {
      id: "t_acm_speaker",
      title: "Confirm ACM speaker for Thursday — send venue details",
      workspace: "club",
      priority: "high",
      status: "todo",
      dueAt: iso(60 * 24, now),
      createdAt: iso(-60 * 24 * 2, now),
      updatedAt: iso(-60 * 30, now),
      linkedNoteIds: [],
    },
    {
      id: "t_pr_followup",
      title: "Address review comments on PR #4821 (retry-budget)",
      workspace: "internship",
      priority: "high",
      status: "doing",
      dueAt: iso(60 * 6, now),
      createdAt: iso(-60 * 24, now),
      updatedAt: iso(-15, now),
      linkedNoteIds: [],
    },
    {
      id: "t_doctor",
      title: "Reschedule dental cleaning",
      workspace: "personal",
      priority: "low",
      status: "todo",
      createdAt: iso(-60 * 24 * 12, now),
      updatedAt: iso(-60 * 24 * 12, now),
      linkedNoteIds: [],
    },
    {
      id: "t_groceries",
      title: "Order groceries — out of coffee",
      workspace: "personal",
      priority: "low",
      status: "todo",
      dueAt: iso(60 * 24, now),
      createdAt: iso(-60 * 6, now),
      updatedAt: iso(-60 * 6, now),
      linkedNoteIds: [],
    },
    {
      id: "t_done_1",
      title: "Backfill metrics for Q1 retry budget rollout",
      workspace: "internship",
      priority: "med",
      status: "done",
      createdAt: iso(-60 * 24 * 4, now),
      updatedAt: iso(-60 * 24, now),
      completedAt: iso(-60 * 24, now),
      linkedNoteIds: [],
    },
    {
      id: "t_15640_essay",
      title: "Distributed systems essay — outline draft",
      workspace: "school",
      priority: "low",
      status: "todo",
      dueAt: iso(60 * 24 * 9, now),
      createdAt: iso(-60 * 24 * 14, now),
      updatedAt: iso(-60 * 24 * 14, now),
      linkedNoteIds: [],
    },
    {
      id: "t_review_grant",
      title: "Review ACM hackathon grant proposal — sign off by Friday",
      workspace: "club",
      priority: "med",
      status: "todo",
      dueAt: iso(60 * 24 * 3, now),
      createdAt: iso(-60 * 24 * 2, now),
      updatedAt: iso(-60 * 12, now),
      linkedNoteIds: [],
    },
  ];

  const notes: Note[] = [
    {
      id: "n_standup",
      title: "Standup — Tue",
      body: "Marc: ingest queue demo land tomorrow.\nPriya: blocked on shard rebalance, waiting on infra.\nMine: kicking off DLQ retry-policy spec, est. 1d.\n— follow-up: write the spec, share before Friday.",
      type: "meeting",
      createdAt: iso(-78, now),
      updatedAt: iso(-78, now),
      linkedMeetingId: "m_standup",
      linkedTaskIds: ["t_followup_standup"],
    },
    {
      id: "n_15745_notes",
      title: "LICM — lecture notes",
      body: "Loop-invariant: operands all defined outside the loop OR also invariant.\nPlace in pre-header. Watch for side effects.\nDead store elim: liveness analysis, kill on overwrite before next use.",
      type: "meeting",
      createdAt: iso(-60 * 24 * 1, now),
      updatedAt: iso(-60 * 24 * 1, now),
      linkedMeetingId: "m_15745",
      linkedTaskIds: ["t_15745_pset"],
    },
    {
      id: "n_worklog_mon",
      title: "Worklog — Monday",
      body: "Shipped retry-budget PR (#4821). Spent the afternoon on the failover doc. Left off mid-section on shard reassignment. Pick up there tomorrow.",
      type: "worklog",
      createdAt: iso(-60 * 24, now),
      updatedAt: iso(-60 * 24, now),
      linkedTaskIds: [],
    },
    {
      id: "n_journal_sun",
      title: "Sunday — week ahead",
      body: "Big design review on Wed. Need to be ready. PS3 looms. Don't forget ACM speaker logistics — past me has dropped this twice.",
      type: "journal",
      createdAt: iso(-60 * 24 * 2, now),
      updatedAt: iso(-60 * 24 * 2, now),
      linkedTaskIds: [],
    },
    {
      id: "n_general_ideas",
      title: "Random ideas",
      body: "— a CLI for switching between PR contexts\n— write up the priority-engine experiment in a blog post\n— ask Yuki about her grad school timeline",
      type: "general",
      createdAt: iso(-60 * 24 * 3, now),
      updatedAt: iso(-60 * 24, now),
      linkedTaskIds: [],
    },
    {
      id: "n_ingest_design",
      title: "Ingest pipeline — design questions",
      body: "Aleksandr will ask: why two-stage? failover semantics under network partition? cold-start cost?\nPrep one-line answers.",
      type: "general",
      createdAt: iso(-60 * 12, now),
      updatedAt: iso(-30, now),
      linkedTaskIds: ["t_ingest_diagram"],
    },
    {
      id: "n_journal_recent",
      title: "Tuesday morning",
      body: "Slept 6h. Coffee. Standup in 30m. Plan: Box A (DLQ spec) before noon, Box B (diagram) before 3pm review.",
      type: "journal",
      createdAt: iso(-180, now),
      updatedAt: iso(-180, now),
      linkedTaskIds: [],
    },
    {
      id: "n_acm",
      title: "ACM speaker — Thursday logistics",
      body: "Speaker: Mariana Solis (Cloudflare).\nVenue: Rashid Aud. (60 cap).\nNeeds: HDMI adapter, lapel mic. Pizza for 30.",
      type: "general",
      createdAt: iso(-60 * 24 * 2, now),
      updatedAt: iso(-60 * 12, now),
      linkedTaskIds: ["t_acm_speaker"],
    },
  ];

  const prs: PullRequest[] = [
    {
      id: "pr_1",
      number: 4821,
      repo: "stratus/ingest",
      title: "feat(retry): per-tenant retry budget with token bucket",
      state: "open",
      bucket: "authored",
      author: "you",
      reviewers: ["yuki", "marc"],
      createdAt: iso(-60 * 24, now),
      updatedAt: iso(-15, now),
      htmlUrl: "https://github.com/stratus/ingest/pull/4821",
      additions: 412,
      deletions: 87,
      comments: 9,
      ciStatus: "passing",
    },
    {
      id: "pr_2",
      number: 4815,
      repo: "stratus/ingest",
      title: "chore: bump otel-sdk and pin to v1.27",
      state: "draft",
      bucket: "authored",
      author: "you",
      reviewers: [],
      createdAt: iso(-60 * 24 * 2, now),
      updatedAt: iso(-60 * 24, now),
      htmlUrl: "https://github.com/stratus/ingest/pull/4815",
      additions: 18,
      deletions: 11,
      comments: 0,
      ciStatus: "pending",
    },
    {
      id: "pr_3",
      number: 1247,
      repo: "stratus/console",
      title: "fix(billing): handle null usage rows in the export job",
      state: "open",
      bucket: "review-requested",
      author: "priya",
      reviewers: ["you", "marc"],
      createdAt: iso(-60 * 4, now),
      updatedAt: iso(-60 * 2, now),
      htmlUrl: "https://github.com/stratus/console/pull/1247",
      additions: 42,
      deletions: 14,
      comments: 2,
      ciStatus: "passing",
    },
    {
      id: "pr_4",
      number: 891,
      repo: "stratus/edge",
      title: "feat(routing): geo-aware fallback with per-region overrides",
      state: "open",
      bucket: "review-requested",
      author: "marc",
      reviewers: ["you", "yuki"],
      createdAt: iso(-60 * 8, now),
      updatedAt: iso(-60 * 7, now),
      htmlUrl: "https://github.com/stratus/edge/pull/891",
      additions: 631,
      deletions: 102,
      comments: 4,
      ciStatus: "passing",
    },
    {
      id: "pr_5",
      number: 312,
      repo: "cmu-acm/site",
      title: "feat: speaker series page",
      state: "open",
      bucket: "assigned",
      author: "rohan",
      reviewers: ["you"],
      createdAt: iso(-60 * 24 * 3, now),
      updatedAt: iso(-60 * 24, now),
      htmlUrl: "https://github.com/cmu-acm/site/pull/312",
      additions: 287,
      deletions: 12,
      comments: 1,
      ciStatus: "failing",
    },
    {
      id: "pr_6",
      number: 4763,
      repo: "stratus/ingest",
      title: "spike: WAL replay benchmarks (don't merge)",
      state: "draft",
      bucket: "stale",
      author: "you",
      reviewers: ["yuki"],
      createdAt: iso(-60 * 24 * 12, now),
      updatedAt: iso(-60 * 24 * 9, now),
      htmlUrl: "https://github.com/stratus/ingest/pull/4763",
      additions: 1240,
      deletions: 16,
      comments: 3,
      ciStatus: "none",
    },
    {
      id: "pr_7",
      number: 78,
      repo: "your/dotfiles",
      title: "tmux: split-window keybind to match wezterm",
      state: "open",
      bucket: "stale",
      author: "you",
      reviewers: [],
      createdAt: iso(-60 * 24 * 18, now),
      updatedAt: iso(-60 * 24 * 14, now),
      htmlUrl: "https://github.com/your/dotfiles/pull/78",
      additions: 6,
      deletions: 3,
      comments: 0,
      ciStatus: "none",
    },
  ];

  const recaps: Recap[] = [
    {
      id: "r_yesterday",
      date: dayKey(-1, now),
      accomplishments:
        "Shipped PR #4821 (retry budget). Closed out the failover doc draft. Sat down with Yuki on ingest topology.",
      blockers: "Waiting on infra for the shard rebalance window.",
      topThree: "1) DLQ spec\n2) Ingest topology diagram\n3) PS3 LICM kickoff",
      carryOver: "Failover doc — section 4 (shard reassignment) still rough.",
      createdAt: iso(-60 * 14, now),
      updatedAt: iso(-60 * 14, now),
    },
    {
      id: "r_two_days_ago",
      date: dayKey(-2, now),
      accomplishments: "Reviewed Marc's edge PR (#891). Office hours w/ Greta on Paxos.",
      blockers: "Paxos lab — leader election deadlock under specific timing.",
      topThree: "1) Address PR comments\n2) Failover doc\n3) ACM speaker logistics",
      carryOver: "Resume update slipped — again.",
      createdAt: iso(-60 * 24 * 2 - 60 * 14, now),
      updatedAt: iso(-60 * 24 * 2 - 60 * 14, now),
    },
  ];

  return { tasks, meetings, notes, prs, recaps };
}
