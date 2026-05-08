"use server";

import { prisma } from "@/lib/db";
import { serializeMeeting } from "@/lib/serialize";
import type { Meeting, Workspace } from "@/lib/types";
import { requireUserId } from "./_helpers";

export interface UpdateMeetingInput {
  workspace?: Workspace;
}

/**
 * Lets the user reclassify a synced calendar event (e.g. change the
 * heuristic-default "internship" to "school"). Only fields that should be
 * locally editable land here — title/start/end stay tied to Google.
 */
export async function updateMeetingAction(
  id: string,
  input: UpdateMeetingInput,
): Promise<Meeting> {
  const userId = await requireUserId();
  // Ownership guard — only update meetings belonging to the calling user.
  const result = await prisma.meeting.updateMany({
    where: { id, userId },
    data: { workspace: input.workspace },
  });
  if (result.count === 0) throw new Error("Meeting not found");

  const updated = await prisma.meeting.findUniqueOrThrow({
    where: { id },
    include: {
      notes: { select: { id: true } },
      tasks: { select: { id: true } },
    },
  });
  return serializeMeeting(updated);
}
