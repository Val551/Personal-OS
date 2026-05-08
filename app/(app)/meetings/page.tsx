"use client";

import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { useStore } from "@/lib/store";
import { Surface } from "@/components/ui/Surface";
import { Button } from "@/components/ui/button";
import { WORKSPACE_META, type Meeting } from "@/lib/types";
import { cn } from "@/lib/utils";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MAX_EVENTS_VISIBLE = 3;

function dayKey(d: Date) {
  return format(d, "yyyy-MM-dd");
}

export default function MeetingsPage() {
  const { meetings, syncCalendar } = useStore();
  const [isSyncing, startSync] = useTransition();
  const [syncStatus, setSyncStatus] = useState<string | null>(null);
  const [viewMonth, setViewMonth] = useState(() => startOfMonth(new Date()));

  const handleSync = () => {
    setSyncStatus(null);
    startSync(async () => {
      try {
        const result = await syncCalendar();
        setSyncStatus(
          `synced · ${result.upserted} upserted · ${result.cancelled} removed`,
        );
      } catch (err) {
        setSyncStatus(err instanceof Error ? `error · ${err.message}` : "error");
      }
    });
  };

  // Group meetings by their local day key for fast cell lookup, sorted by
  // start time within each day.
  const byDay = useMemo(() => {
    const map = new Map<string, Meeting[]>();
    for (const m of meetings) {
      const key = dayKey(new Date(m.startAt));
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
    }
    for (const arr of map.values()) {
      arr.sort(
        (a, b) =>
          new Date(a.startAt).getTime() - new Date(b.startAt).getTime(),
      );
    }
    return map;
  }, [meetings]);

  // Calendar bounds: the week containing the 1st through the week containing
  // the last day of the month. Always Sun → Sat.
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: 0 });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4 pt-2 animate-fade-up">
        <div>
          <p className="comment-label">calendar · month view</p>
          <h1 className="mt-1 font-display text-[52px] leading-[0.95] tracking-tightest-display text-ink">
            Meetings
          </h1>
          <p className="mt-2 font-mono text-[12px] text-ink-muted">
            <span className="text-ink">{meetings.length}</span> total ·{" "}
            <span className="text-amber">
              {meetings.filter((m) => isToday(new Date(m.startAt))).length}
            </span>{" "}
            today
            {syncStatus && (
              <span className="ml-3 text-ink-dim">{syncStatus}</span>
            )}
          </p>
        </div>
        <button
          type="button"
          onClick={handleSync}
          disabled={isSyncing}
          className="flex items-center gap-2 rounded-md border border-hairline bg-elevated/40 px-3 py-2 font-mono text-[11px] text-ink-muted transition-colors hover:border-ink-dim hover:text-ink focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber disabled:opacity-50"
        >
          <RefreshCw className={cn("h-3.5 w-3.5", isSyncing && "animate-spin")} />
          {isSyncing ? "syncing…" : "sync calendar"}
        </button>
      </header>

      {/* Month nav */}
      <div className="flex items-center justify-between animate-fade-up stagger-1">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMonth((m) => addMonths(m, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-[22px] font-semibold tracking-tight">
            {format(viewMonth, "MMMM yyyy")}
          </h2>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setViewMonth(startOfMonth(new Date()))}
          className="h-8 text-xs"
        >
          Today
        </Button>
      </div>

      {/* Calendar */}
      <Surface className="overflow-hidden animate-fade-up stagger-2">
        {/* Weekday header row */}
        <div className="grid grid-cols-7 border-b">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="px-3 py-2 text-center font-mono text-[11px] uppercase tracking-wider text-muted-foreground"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {days.map((day, idx) => {
            const inMonth = isSameMonth(day, viewMonth);
            const today = isToday(day);
            const events = byDay.get(dayKey(day)) ?? [];
            const visible = events.slice(0, MAX_EVENTS_VISIBLE);
            const overflow = events.length - visible.length;

            return (
              <div
                key={dayKey(day)}
                className={cn(
                  "relative flex min-h-[112px] flex-col gap-1 border-b border-r p-2 last:border-r-0",
                  // Cut right border on the last column of each row
                  idx % 7 === 6 && "border-r-0",
                  // Last row has no bottom border
                  idx >= days.length - 7 && "border-b-0",
                  !inMonth && "bg-muted/20",
                )}
              >
                {/* Day number */}
                <div className="flex items-center justify-end px-1">
                  {today ? (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-foreground text-[12px] font-semibold text-background">
                      {format(day, "d")}
                    </span>
                  ) : (
                    <span
                      className={cn(
                        "text-[12px] font-medium",
                        inMonth ? "text-foreground" : "text-muted-foreground/50",
                      )}
                    >
                      {format(day, "d")}
                    </span>
                  )}
                </div>

                {/* Events */}
                <div className="flex flex-col gap-1">
                  {visible.map((m) => {
                    const isPast =
                      new Date() >= new Date(m.endAt) && !isSameDay(day, new Date());
                    return (
                      <Link
                        key={m.id}
                        href={`/meetings/${m.id}`}
                        title={`${format(new Date(m.startAt), "p")} · ${m.title}`}
                        className={cn(
                          "group flex items-center gap-1.5 truncate rounded px-1.5 py-0.5 text-[11px] leading-tight transition-colors hover:bg-accent",
                          isPast && "opacity-50",
                        )}
                      >
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ background: WORKSPACE_META[m.workspace].color }}
                        />
                        <span className="truncate text-foreground/90 group-hover:text-foreground">
                          {m.title}
                        </span>
                      </Link>
                    );
                  })}
                  {overflow > 0 && (
                    <span className="px-1.5 text-[10px] text-muted-foreground">
                      +{overflow} more
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Surface>

      {/* Workspace legend */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground animate-fade-up stagger-3">
        <span className="font-mono uppercase tracking-wider">workspaces</span>
        {(Object.keys(WORKSPACE_META) as Array<keyof typeof WORKSPACE_META>).map(
          (k) => (
            <span key={k} className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: WORKSPACE_META[k].color }}
              />
              {WORKSPACE_META[k].label}
            </span>
          ),
        )}
      </div>
    </div>
  );
}
