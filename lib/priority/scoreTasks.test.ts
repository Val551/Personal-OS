import { describe, expect, it } from "vitest";
import { scoreTask } from "./scoreTasks";
import type { Meeting, Task } from "@/lib/types";

const NOW = new Date("2026-05-06T15:00:00Z").getTime();

function task(overrides: Partial<Task>): Task {
  return {
    id: overrides.id ?? "t",
    title: overrides.title ?? "task",
    workspace: overrides.workspace ?? "personal",
    priority: overrides.priority ?? "med",
    status: overrides.status ?? "todo",
    dueAt: overrides.dueAt,
    createdAt: overrides.createdAt ?? new Date(NOW - 60 * 60 * 1000).toISOString(),
    updatedAt: overrides.updatedAt ?? new Date(NOW - 60 * 60 * 1000).toISOString(),
    completedAt: overrides.completedAt,
    linkedMeetingId: overrides.linkedMeetingId,
    linkedNoteIds: overrides.linkedNoteIds ?? [],
    notes: overrides.notes,
  };
}

const meetingSoon: Meeting = {
  id: "m_soon",
  title: "Soon",
  startAt: new Date(NOW + 60 * 60 * 1000).toISOString(),
  endAt: new Date(NOW + 90 * 60 * 1000).toISOString(),
  attendees: [],
  workspace: "internship",
  noteIds: [],
  taskIds: [],
};

describe("scoreTask", () => {
  it("returns 0 for completed tasks", () => {
    const t = task({ status: "done" });
    const s = scoreTask(t, [], { now: NOW });
    expect(s.score).toBe(0);
    expect(s.reason).toMatch(/Completed/i);
  });

  it("urgent overdue ranks higher than urgent-with-no-due-date", () => {
    const overdue = task({
      id: "a",
      priority: "urgent",
      dueAt: new Date(NOW - 24 * 60 * 60 * 1000).toISOString(),
    });
    const noDue = task({ id: "b", priority: "urgent" });
    const aScore = scoreTask(overdue, [], { now: NOW });
    const bScore = scoreTask(noDue, [], { now: NOW });
    expect(aScore.score).toBeGreaterThan(bScore.score);
    expect(aScore.reason).toMatch(/Overdue/i);
  });

  it("due in 6h beats due in 5d at same priority", () => {
    const soon = task({
      id: "soon",
      priority: "med",
      dueAt: new Date(NOW + 6 * 60 * 60 * 1000).toISOString(),
    });
    const later = task({
      id: "later",
      priority: "med",
      dueAt: new Date(NOW + 5 * 24 * 60 * 60 * 1000).toISOString(),
    });
    expect(scoreTask(soon, [], { now: NOW }).score).toBeGreaterThan(
      scoreTask(later, [], { now: NOW }).score,
    );
  });

  it("linked-meeting-soon boosts the score and surfaces a reason", () => {
    const linked = task({ id: "l", priority: "med", linkedMeetingId: "m_soon" });
    const unlinked = task({ id: "u", priority: "med" });
    const ls = scoreTask(linked, [meetingSoon], { now: NOW });
    const us = scoreTask(unlinked, [], { now: NOW });
    expect(ls.score).toBeGreaterThan(us.score);
    expect(ls.reason).toMatch(/meeting/i);
  });

  it("blocked tasks lose points", () => {
    const blocked = task({ id: "b", status: "blocked" });
    const open = task({ id: "o", status: "todo" });
    expect(scoreTask(blocked, [], { now: NOW }).score).toBeLessThan(
      scoreTask(open, [], { now: NOW }).score,
    );
  });

  it("stale untouched todos surface with a stale reason", () => {
    const stale = task({
      id: "s",
      priority: "low",
      updatedAt: new Date(NOW - 12 * 24 * 60 * 60 * 1000).toISOString(),
    });
    const s = scoreTask(stale, [], { now: NOW });
    expect(s.reason).toMatch(/Stale/i);
  });

  it("in-progress tasks edge out matching todo tasks", () => {
    const doing = task({ id: "d", status: "doing", priority: "med" });
    const todo = task({ id: "t", status: "todo", priority: "med" });
    expect(scoreTask(doing, [], { now: NOW }).score).toBeGreaterThan(
      scoreTask(todo, [], { now: NOW }).score,
    );
  });
});
