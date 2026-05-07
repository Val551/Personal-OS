"use server";

import { prisma } from "@/lib/db";
import { serializeTask } from "@/lib/serialize";
import type { Priority, Task, TaskStatus, Workspace } from "@/lib/types";
import { requireUserId } from "./_helpers";

export interface CreateTaskInput {
  title: string;
  workspace?: Workspace;
  priority?: Priority;
  dueAt?: string;
  linkedMeetingId?: string;
  notes?: string;
}

export async function createTaskAction(input: CreateTaskInput): Promise<Task> {
  const userId = await requireUserId();
  const created = await prisma.task.create({
    data: {
      userId,
      title: input.title,
      workspace: input.workspace ?? "personal",
      priority: input.priority ?? "med",
      status: "todo",
      dueAt: input.dueAt ? new Date(input.dueAt) : undefined,
      linkedMeetingId: input.linkedMeetingId,
      notes: input.notes,
    },
    include: { linkedNotes: true },
  });
  return serializeTask(created);
}

export interface UpdateTaskInput {
  title?: string;
  notes?: string;
  workspace?: Workspace;
  priority?: Priority;
  status?: TaskStatus;
  dueAt?: string | null;
}

export async function updateTaskAction(
  id: string,
  patch: UpdateTaskInput,
): Promise<Task> {
  const userId = await requireUserId();
  const updated = await prisma.task.update({
    where: { id, userId },
    data: {
      ...patch,
      dueAt:
        patch.dueAt === undefined
          ? undefined
          : patch.dueAt === null
            ? null
            : new Date(patch.dueAt),
    },
    include: { linkedNotes: true },
  });
  return serializeTask(updated);
}

export async function toggleTaskCompleteAction(id: string): Promise<Task> {
  const userId = await requireUserId();
  const existing = await prisma.task.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Task not found");

  const isDone = existing.status === "done";
  const updated = await prisma.task.update({
    where: { id },
    data: {
      status: isDone ? "todo" : "done",
      completedAt: isDone ? null : new Date(),
    },
    include: { linkedNotes: true },
  });
  return serializeTask(updated);
}

export async function setTaskStatusAction(
  id: string,
  status: TaskStatus,
): Promise<Task> {
  const userId = await requireUserId();
  const updated = await prisma.task.update({
    where: { id, userId },
    data: {
      status,
      completedAt: status === "done" ? new Date() : null,
    },
    include: { linkedNotes: true },
  });
  return serializeTask(updated);
}

export async function deleteTaskAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.task.delete({ where: { id, userId } });
}
