export type Workspace = "internship" | "school" | "personal" | "club";

export type Priority = "low" | "med" | "high" | "urgent";

export type TaskStatus = "todo" | "doing" | "blocked" | "done";

export interface Task {
  id: string;
  title: string;
  notes?: string;
  workspace: Workspace;
  priority: Priority;
  status: TaskStatus;
  dueAt?: string; // ISO
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  linkedMeetingId?: string;
  linkedNoteIds: string[];
}

export interface Meeting {
  id: string;
  title: string;
  startAt: string;
  endAt: string;
  location?: string;
  attendees: string[];
  description?: string;
  workspace: Workspace;
  noteIds: string[];
  taskIds: string[];
}

export type NoteType = "worklog" | "general";

export interface Note {
  id: string;
  title: string;
  body: string;
  type: NoteType;
  createdAt: string;
  updatedAt: string;
  linkedMeetingId?: string;
  linkedTaskIds: string[];
}

export type PRBucket = "authored" | "review-requested" | "assigned" | "stale";
export type PRState = "open" | "draft" | "merged" | "closed";

export interface PullRequest {
  id: string;
  number: number;
  repo: string; // e.g. "owner/repo"
  title: string;
  state: PRState;
  bucket: PRBucket;
  author: string;
  reviewers: string[];
  createdAt: string;
  updatedAt: string;
  htmlUrl: string;
  additions: number;
  deletions: number;
  comments: number;
  ciStatus: "passing" | "failing" | "pending" | "none";
}

export interface Recap {
  id: string;
  date: string; // YYYY-MM-DD
  accomplishments: string;
  blockers: string;
  topThree: string;
  carryOver: string;
  createdAt: string;
  updatedAt: string;
}

export const WORKSPACE_META: Record<Workspace, { label: string; color: string }> = {
  internship: { label: "internship", color: "#F4B860" },
  school: { label: "school", color: "#5BA3A8" },
  personal: { label: "personal", color: "#9BB369" },
  club: { label: "club", color: "#C49AD4" },
};

export const PRIORITY_META: Record<Priority, { label: string; color: string; weight: number }> = {
  urgent: { label: "urgent", color: "#E06C75", weight: 100 },
  high: { label: "high", color: "#E5A66A", weight: 60 },
  med: { label: "medium", color: "#9A958A", weight: 30 },
  low: { label: "low", color: "#6B665C", weight: 10 },
};
