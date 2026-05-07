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
): Promise<Note> {
  const userId = await requireUserId();
  const updated = await prisma.note.update({
    where: { id, userId },
    data: patch,
    include: { linkedTasks: true },
  });
  return serializeNote(updated);
}

export async function deleteNoteAction(id: string): Promise<void> {
  const userId = await requireUserId();
  await prisma.note.delete({ where: { id, userId } });
}
