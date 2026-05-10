"use server";

import { prisma } from "@/lib/db";
import { serializeNote } from "@/lib/serialize";
import type { Note, NoteType } from "@/lib/types";
import { requireUserId } from "./_helpers";

export interface CreateNoteInput {
  title?: string;
  body?: string;
  type?: NoteType;
  linkedMeetingId?: string;
  linkedTaskIds?: string[];
}

export async function createNoteAction(input: CreateNoteInput): Promise<Note> {
  const userId = await requireUserId();
  const created = await prisma.note.create({
    data: {
      userId,
      title: input.title?.trim() || "Untitled note",
      body: input.body ?? "",
      type: input.type ?? "general",
      linkedMeetingId: input.linkedMeetingId,
      linkedTasks: input.linkedTaskIds?.length
        ? { connect: input.linkedTaskIds.map((id) => ({ id })) }
        : undefined,
    },
    include: { linkedTasks: true },
  });
  return serializeNote(created);
}

export interface UpdateNoteInput {
  title?: string;
  body?: string;
  type?: NoteType;
}

export async function updateNoteAction(
  id: string,
  patch: UpdateNoteInput,
): Promise<Note | null> {
  const userId = await requireUserId();
  // updateMany doesn't throw when no row matches — protects against debounced
  // saves firing on a stale id (note was deleted, or still-optimistic temp id).
  const result = await prisma.note.updateMany({
    where: { id, userId },
    data: patch,
  });
  if (result.count === 0) return null;
  const updated = await prisma.note.findUnique({
    where: { id },
    include: { linkedTasks: true },
  });
  return updated ? serializeNote(updated) : null;
}

export async function deleteNoteAction(id: string): Promise<void> {
  const userId = await requireUserId();
  // deleteMany is idempotent — safe against double-clicks and stale ids.
  await prisma.note.deleteMany({ where: { id, userId } });
}
