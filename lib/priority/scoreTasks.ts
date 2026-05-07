import type { Meeting, Task } from "@/lib/types";
import { PRIORITY_META } from "@/lib/types";

export interface TaskScore {
  taskId: string;
  score: number;
  reason: string;
  factors: string[];
}

interface ScoreOptions {
  now?: number;
}

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function hoursUntil(iso: string | undefined, now: number): number | null {
  if (!iso) return null;
  return (new Date(iso).getTime() - now) / HOUR_MS;
}

function daysSince(iso: string, now: number): number {
  return (now - new Date(iso).getTime()) / DAY_MS;
}

/**
 * Rule-based task scoring per PRD §4.8.
 * Higher score = more urgent. Returns the dominant reason for surfacing.
 */
export function scoreTask(
  task: Task,
  meetings: Meeting[],
  options: ScoreOptions = {},
): TaskScore {
  const now = options.now ?? Date.now();
  const factors: string[] = [];
  let score = 0;
  let reason = "";

  // Done tasks score 0; never surfaced.
  if (task.status === "done") {
    return { taskId: task.id, score: 0, reason: "Completed", factors: ["done"] };
  }

  // Manual priority weight
  const priWeight = PRIORITY_META[task.priority].weight;
  score += priWeight;
  factors.push(`priority:${task.priority}+${priWeight}`);

  // Due-date pressure
  const hrs = hoursUntil(task.dueAt, now);
  if (hrs !== null) {
    if (hrs < 0) {
      score += 80;
      factors.push("overdue+80");
      reason = `Overdue by ${Math.ceil(-hrs / 24)}d`;
    } else if (hrs <= 6) {
      score += 70;
      factors.push("due≤6h+70");
      reason = `Due in ${Math.max(1, Math.round(hrs))}h`;
    } else if (hrs <= 24) {
      score += 55;
      factors.push("due≤24h+55");
      reason = `Due in ${Math.round(hrs)}h`;
    } else if (hrs <= 24 * 3) {
      score += 35;
      factors.push("due≤3d+35");
      reason = `Due in ${Math.round(hrs / 24)}d`;
    } else if (hrs <= 24 * 7) {
      score += 18;
      factors.push("due≤7d+18");
      reason = reason || `Due in ${Math.round(hrs / 24)}d`;
    } else {
      score += 4;
      factors.push("due-future+4");
    }
  }

  // Linked meeting today/imminent → boost
  if (task.linkedMeetingId) {
    const m = meetings.find((mm) => mm.id === task.linkedMeetingId);
    if (m) {
      const mhrs = hoursUntil(m.startAt, now);
      if (mhrs !== null && mhrs >= -1 && mhrs <= 24) {
        score += 30;
        factors.push("linked-meeting-soon+30");
        if (!reason) {
          if (mhrs < 0) reason = "Linked to a meeting in progress";
          else if (mhrs <= 1) reason = "Linked to next meeting";
          else reason = `Linked to a meeting in ${Math.round(mhrs)}h`;
        }
      } else {
        score += 8;
        factors.push("linked-meeting+8");
      }
    }
  }

  // Blocked status: deprioritize unless urgent
  if (task.status === "blocked") {
    score -= 20;
    factors.push("blocked-20");
    if (!reason) reason = "Blocked";
  }

  // In-progress tasks get a small boost (continue what you started)
  if (task.status === "doing") {
    score += 8;
    factors.push("in-progress+8");
  }

  // Staleness — old, untouched todos surface gently
  const since = daysSince(task.updatedAt, now);
  if (task.status !== "blocked" && since > 5) {
    const stale = Math.min(20, Math.floor(since));
    score += stale;
    factors.push(`stale+${stale}`);
    if (!reason) reason = `Stale ${Math.floor(since)}d`;
  }

  if (!reason) {
    reason = `Priority: ${task.priority}`;
  }

  return { taskId: task.id, score, reason, factors };
}

export function scoreTasks(
  tasks: Task[],
  meetings: Meeting[],
  options: ScoreOptions = {},
): TaskScore[] {
  return tasks
    .map((t) => scoreTask(t, meetings, options))
    .sort((a, b) => b.score - a.score);
}

export function rankTopTasks(
  tasks: Task[],
  meetings: Meeting[],
  limit = 5,
  options: ScoreOptions = {},
): { task: Task; score: TaskScore }[] {
  const scoreMap = new Map(scoreTasks(tasks, meetings, options).map((s) => [s.taskId, s]));
  return tasks
    .filter((t) => t.status !== "done")
    .map((t) => ({ task: t, score: scoreMap.get(t.id)! }))
    .sort((a, b) => b.score.score - a.score.score)
    .slice(0, limit);
}
