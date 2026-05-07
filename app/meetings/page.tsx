"use client";

import Link from "next/link";
import { useMemo } from "react";
import { format, isToday, isTomorrow, isAfter } from "date-fns";
import { ChevronRight, MapPin, Users } from "lucide-react";
import { useStore } from "@/lib/store";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { WORKSPACE_META } from "@/lib/types";
import { formatTime } from "@/lib/format";
import { cn } from "@/lib/cn";

export default function MeetingsPage() {
  const { meetings } = useStore();

  const sorted = useMemo(
    () => meetings.slice().sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime()),
    [meetings],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, typeof sorted>();
    for (const m of sorted) {
      const d = new Date(m.startAt);
      const key = isToday(d)
        ? "Today"
        : isTomorrow(d)
          ? "Tomorrow"
          : format(d, "EEEE LLL d");
      const arr = map.get(key) ?? [];
      arr.push(m);
      map.set(key, arr);
    }
    return Array.from(map.entries());
  }, [sorted]);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <header className="pt-2 animate-fade-up">
        <p className="comment-label">calendar · upcoming</p>
        <h1 className="mt-1 font-display text-[52px] leading-[0.95] tracking-tightest-display text-ink">
          Meetings<span className="text-amber">.</span>
        </h1>
        <p className="mt-2 font-mono text-[12px] text-ink-muted">
          <span className="text-ink">{meetings.length}</span> total ·{" "}
          <span className="text-amber">
            {meetings.filter((m) => isToday(new Date(m.startAt))).length}
          </span>{" "}
          today
        </p>
      </header>

      <div className="flex flex-col gap-8">
        {grouped.map(([day, list], idx) => (
          <section key={day} className={cn("animate-fade-up", `stagger-${Math.min(idx + 1, 5)}`)}>
            <div className="mb-3 flex items-center gap-3">
              <span className="comment-label">{day}</span>
              <span className="h-px flex-1 bg-hairline" />
              <span className="font-mono text-[10px] text-ink-dim">{list.length} events</span>
            </div>
            <Surface className="overflow-hidden">
              <ul className="divide-y divide-hairline">
                {list.map((m) => {
                  const start = new Date(m.startAt);
                  const end = new Date(m.endAt);
                  const inProgress = new Date() >= start && new Date() < end;
                  const past = isAfter(new Date(), end);
                  return (
                    <li key={m.id}>
                      <Link
                        href={`/meetings/${m.id}`}
                        className={cn(
                          "group grid grid-cols-[120px_1fr_auto] items-center gap-5 px-5 py-4 transition-colors hover:bg-elevated/40",
                          past && "opacity-50",
                        )}
                      >
                        <div className="flex flex-col font-mono text-[12px] tabular leading-tight">
                          <span className={cn("text-ink", inProgress && "text-amber")}>
                            {formatTime(m.startAt)}
                          </span>
                          <span className="text-ink-dim">{formatTime(m.endAt)}</span>
                          {inProgress && (
                            <span className="mt-1 flex items-center gap-1 text-[10px] text-amber">
                              <span className="status-dot bg-amber animate-pulse-dot" />
                              live
                            </span>
                          )}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-[15px] text-ink group-hover:text-ink">
                            {m.title}
                          </p>
                          <div className="mt-1.5 flex flex-wrap items-center gap-3 font-mono text-[11px] text-ink-muted">
                            {m.location && (
                              <span className="flex items-center gap-1">
                                <MapPin className="h-3 w-3 text-ink-dim" />
                                {m.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1">
                              <Users className="h-3 w-3 text-ink-dim" />
                              {m.attendees.length}
                            </span>
                            <span className="flex items-center gap-1.5">
                              <Badge dot dotColor={WORKSPACE_META[m.workspace].color}>
                                {WORKSPACE_META[m.workspace].label}
                              </Badge>
                            </span>
                            {m.noteIds.length > 0 && (
                              <span className="text-link">{m.noteIds.length} notes</span>
                            )}
                            {m.taskIds.length > 0 && (
                              <span className="text-amber">{m.taskIds.length} tasks</span>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-ink-dim transition-transform group-hover:translate-x-0.5 group-hover:text-ink" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Surface>
          </section>
        ))}
      </div>
    </div>
  );
}
