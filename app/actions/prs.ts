"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { serializePR } from "@/lib/serialize";
import { syncGitHubPRs } from "@/lib/integrations/github";
import type { PullRequest } from "@/lib/types";
import { requireUserId } from "./_helpers";

export async function resyncPRsAction(): Promise<PullRequest[]> {
  const userId = await requireUserId();
  await syncGitHubPRs(userId);

  const prs = await prisma.pullRequest.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  revalidatePath("/(app)", "layout");
  return prs.map(serializePR);
}
