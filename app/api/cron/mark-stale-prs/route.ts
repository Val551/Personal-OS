import { prisma } from "@/lib/db";
import { assertCronCaller } from "@/lib/cron/auth";

const STALE_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export async function GET(req: Request) {
  const denied = assertCronCaller(req);
  if (denied) return denied;

  const cutoff = new Date(Date.now() - STALE_AGE_MS);

  // Re-bucket authored PRs older than 7d into "stale".
  const updated = await prisma.pullRequest.updateMany({
    where: {
      bucket: "authored",
      updatedAt: { lt: cutoff },
    },
    data: { bucket: "stale" },
  });

  return Response.json({
    job: "mark-stale-prs",
    rebucketed: updated.count,
  });
}
