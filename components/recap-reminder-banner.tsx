import Link from "next/link";
import { Sunrise } from "lucide-react";
import { prisma } from "@/lib/db";

const REMINDER_HOUR = 17; // 5pm user-local

/**
 * Phase 6 in-app recap nudge. Server-rendered above the dashboard. Shows up
 * once it's past 5pm user-local AND there's no recap entry for today's
 * user-local date. Hidden if user hasn't captured a timezone yet
 * (TimezoneSync grabs that on first sign-in).
 */
export async function RecapReminderBanner({
  userId,
  timezone,
}: {
  userId: string;
  timezone: string | null;
}) {
  if (!timezone) return null;

  const now = new Date();
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    hour12: false,
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(now).map((p) => [p.type, p.value]),
  );
  const todayLocal = `${parts.year}-${parts.month}-${parts.day}`;
  const hourLocal = parseInt(parts.hour ?? "0", 10);

  if (hourLocal < REMINDER_HOUR) return null;

  const existing = await prisma.recap.findFirst({
    where: { userId, date: todayLocal },
    select: { id: true },
  });
  if (existing) return null;

  return (
    <div className="mx-auto mb-6 flex max-w-[1100px] items-center gap-3 rounded-lg border bg-card px-4 py-3 text-sm">
      <Sunrise className="h-4 w-4 shrink-0 text-foreground" />
      <span className="flex-1">
        <span className="font-medium">Your recap is waiting.</span>{" "}
        <span className="text-muted-foreground">
          End-of-day reflection, ~2 minutes.
        </span>
      </span>
      <Link
        href="/recap"
        className="rounded-md bg-foreground px-3 py-1.5 text-xs font-medium text-background transition-colors hover:bg-foreground/90"
      >
        Recap now
      </Link>
    </div>
  );
}
