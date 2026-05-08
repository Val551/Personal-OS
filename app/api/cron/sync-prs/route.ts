import { prisma } from "@/lib/db";
import { assertCronCaller } from "@/lib/cron/auth";
import { syncGitHubPRs } from "@/lib/integrations/github";

const STALE_THRESHOLD_MS = 55 * 60 * 1000; // resync if last run > 55 min ago
const BATCH_LIMIT = 50;

export async function GET(req: Request) {
  const denied = assertCronCaller(req);
  if (denied) return denied;

  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);
  const due = await prisma.user.findMany({
    where: {
      accounts: { some: { provider: "github" } },
      OR: [{ lastPRSyncAt: null }, { lastPRSyncAt: { lt: cutoff } }],
    },
    select: { id: true },
    orderBy: { lastPRSyncAt: { sort: "asc", nulls: "first" } },
    take: BATCH_LIMIT,
  });

  const results: { userId: string; ok: boolean; error?: string }[] = [];
  for (const { id: userId } of due) {
    try {
      await syncGitHubPRs(userId);
      await prisma.user.update({
        where: { id: userId },
        data: { lastPRSyncAt: new Date() },
      });
      results.push({ userId, ok: true });
    } catch (err) {
      results.push({
        userId,
        ok: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return Response.json({
    job: "sync-prs",
    candidates: due.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
