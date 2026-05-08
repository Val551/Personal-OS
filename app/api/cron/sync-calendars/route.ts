import { prisma } from "@/lib/db";
import { assertCronCaller } from "@/lib/cron/auth";
import { syncGoogleCalendar } from "@/lib/integrations/google";

const STALE_THRESHOLD_MS = 25 * 60 * 1000; // resync if last run > 25 min ago
const BATCH_LIMIT = 50; // cap users per run to stay under Vercel's 60s budget

export async function GET(req: Request) {
  const denied = assertCronCaller(req);
  if (denied) return denied;

  const cutoff = new Date(Date.now() - STALE_THRESHOLD_MS);
  const due = await prisma.user.findMany({
    where: {
      accounts: { some: { provider: "google" } },
      OR: [
        { lastCalendarSyncAt: null },
        { lastCalendarSyncAt: { lt: cutoff } },
      ],
    },
    select: { id: true },
    orderBy: { lastCalendarSyncAt: { sort: "asc", nulls: "first" } },
    take: BATCH_LIMIT,
  });

  const results: { userId: string; ok: boolean; error?: string }[] = [];
  for (const { id: userId } of due) {
    try {
      await syncGoogleCalendar(userId);
      await prisma.user.update({
        where: { id: userId },
        data: { lastCalendarSyncAt: new Date() },
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
    job: "sync-calendars",
    candidates: due.length,
    succeeded: results.filter((r) => r.ok).length,
    failed: results.filter((r) => !r.ok).length,
    results,
  });
}
