"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { syncGoogleCalendar, type SyncResult } from "@/lib/integrations/google";
import { serializeMeeting } from "@/lib/serialize";
import type { Meeting } from "@/lib/types";
import { requireUserId } from "./_helpers";

export interface SyncCalendarResponse {
  result: SyncResult;
  meetings: Meeting[];
}

export async function syncCalendarAction(): Promise<SyncCalendarResponse> {
  const userId = await requireUserId();
  const result = await syncGoogleCalendar(userId);

  const fresh = await prisma.meeting.findMany({
    where: { userId },
    include: {
      notes: { select: { id: true } },
      tasks: { select: { id: true } },
    },
    orderBy: { startAt: "asc" },
  });

  revalidatePath("/(app)", "layout");
  return { result, meetings: fresh.map(serializeMeeting) };
}
