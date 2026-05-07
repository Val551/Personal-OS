import type {
  Meeting as DbMeeting,
  Note as DbNote,
  PullRequest as DbPullRequest,
  Recap as DbRecap,
  Task as DbTask,
} from "@prisma/client";
import type {
  Meeting,
  Note,
  PRBucket,
  PullRequest,
  Recap,
  Task,
} from "@/lib/types";

// Prisma's enum identifiers can't contain hyphens, so we store
// `review_requested` and translate to/from the app's `"review-requested"`.
function bucketToApp(b: DbPullRequest["bucket"]): PRBucket {
  return (b === "review_requested" ? "review-requested" : b) as PRBucket;
}

export function bucketToDb(b: PRBucket): DbPullRequest["bucket"] {
  return (b === "review-requested" ? "review_requested" : b) as DbPullRequest["bucket"];
}

export function serializeTask(
  t: DbTask & { linkedNotes?: { id: string }[] },
): Task {
  return {
    id: t.id,
    title: t.title,
    notes: t.notes ?? undefined,
    workspace: t.workspace,
    priority: t.priority,
    status: t.status,
    dueAt: t.dueAt?.toISOString(),
    completedAt: t.completedAt?.toISOString(),
    createdAt: t.createdAt.toISOString(),
    updatedAt: t.updatedAt.toISOString(),
    linkedMeetingId: t.linkedMeetingId ?? undefined,
    linkedNoteIds: (t.linkedNotes ?? []).map((n) => n.id),
  };
}

export function serializeMeeting(
  m: DbMeeting & { notes?: { id: string }[]; tasks?: { id: string }[] },
): Meeting {
  return {
    id: m.id,
    title: m.title,
    startAt: m.startAt.toISOString(),
    endAt: m.endAt.toISOString(),
    location: m.location ?? undefined,
    attendees: m.attendees,
    description: m.description ?? undefined,
    workspace: m.workspace,
    noteIds: (m.notes ?? []).map((n) => n.id),
    taskIds: (m.tasks ?? []).map((t) => t.id),
  };
}

export function serializeNote(
  n: DbNote & { linkedTasks?: { id: string }[] },
): Note {
  return {
    id: n.id,
    title: n.title,
    body: n.body,
    type: n.type,
    createdAt: n.createdAt.toISOString(),
    updatedAt: n.updatedAt.toISOString(),
    linkedMeetingId: n.linkedMeetingId ?? undefined,
    linkedTaskIds: (n.linkedTasks ?? []).map((t) => t.id),
  };
}

export function serializePR(p: DbPullRequest): PullRequest {
  return {
    id: p.id,
    number: p.number,
    repo: p.repo,
    title: p.title,
    state: p.state,
    bucket: bucketToApp(p.bucket),
    author: p.author,
    reviewers: p.reviewers,
    htmlUrl: p.htmlUrl,
    additions: p.additions,
    deletions: p.deletions,
    comments: p.comments,
    ciStatus: p.ciStatus,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

export function serializeRecap(r: DbRecap): Recap {
  return {
    id: r.id,
    date: r.date,
    accomplishments: r.accomplishments,
    blockers: r.blockers,
    topThree: r.topThree,
    carryOver: r.carryOver,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  };
}

