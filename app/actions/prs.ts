"use server";

import { prisma } from "@/lib/db";
import { serializePR } from "@/lib/serialize";
import type { PullRequest } from "@/lib/types";
import { requireUserId } from "./_helpers";

/**
 * Phase 3 stub: bumps `lastSyncedAt` on every PR row so the UI shows a fresh
 * sync timestamp. Real GitHub fetch lands in Phase 5.
 */
export async function resyncPRsAction(): Promise<PullRequest[]> {
  const userId = await requireUserId();
  await prisma.pullRequest.updateMany({
    where: { userId },
    data: { lastSyncedAt: new Date() },
  });
  const prs = await prisma.pullRequest.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });
  return prs.map(serializePR);
}
