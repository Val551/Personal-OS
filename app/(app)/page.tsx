"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { format, isAfter, isToday, isWithinInterval, addDays } from "date-fns";
import { ArrowRight, ExternalLink, Plus, Sparkles } from "lucide-react";
import { useStore } from "@/lib/store";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { rankTopTasks, scoreTask } from "@/lib/priority/scoreTasks";
import { formatTime, relativeDue, formatPRAge } from "@/lib/format";
import { PRIORITY_META, WORKSPACE_META } from "@/lib/types";
import { cn } from "@/lib/cn";

export default function TodayPage() {
  const { tasks, meetings, prs, createNote, toggleTaskComplete } = useStore();
  const [quickNote, setQuickNote] = useState("");
  const [savedFlash, setSavedFlash] = useState(false);

  const today = useMemo(() => {
    return meetings
      .filter((m) => isToday(new Date(m.startAt)))
      .sort((a, b) => new Date(a.startAt).getTime() - new Date(b.startAt).getTime());
  }, [meetings]);

  const ranked = useMemo(() => rankTopTasks(tasks, meetings, 5), [tasks, meetings]);
  const hero = ranked[0];

  const deadlines = useMemo(() => {
    const now = new Date();
    const horizon = addDays(now, 7);
    return tasks
      .filter((t) => t.status !== "done" && t.dueAt)
      .filter((t) =>
        isWithinInterval(new Date(t.dueAt!), { start: now, end: horizon }) ||
        !isAfter(new Date(t.dueAt!), now),
      )
      .sort((a, b) => new Date(a.dueAt!).getTime() - new Date(b.dueAt!).getTime())
      .slice(0, 6);
  }, [tasks]);

  const prAttention = useMemo(() => {
    return prs
      .filter((p) => p.bucket === "review-requested" || p.bucket === "stale")
      .slice(0, 4);
  }, [prs]);

  const completedToday = tasks.filter(
    (t) => t.status === "done" && t.completedAt && isToday(new Date(t.completedAt)),
  ).length;

  const handleQuickNote = () => {
    if (!quickNote.trim()) return;
    createNote({ body: quickNote.trim(), type: "general", title: quickNote.split("\n")[0].slice(0, 60) });
    setQuickNote("");
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 1400);
  };

  const todayLabel = format(new Date(), "EEEE");
  const dateLabel = format(new Date(), "LLLL d, yyyy");

  return (
    <div className="mx-auto flex max-w-[1280px] flex-col gap-6">
      <header className="pt-2 animate-fade-up">
        <h1 className="font-display text-[64px] leading-[0.95] tracking-tightest-display text-ink">
          {todayLabel}
        </h1>
        <p className="mt-2 font-mono text-[12px] text-ink-muted">
          {dateLabel} ·{" "}
          <span className="text-ink">{today.length}</span> meetings ·{" "}
          <span className="text-ink">{tasks.filter((t) => t.status !== "done").length}</span> open ·{" "}
          <span className="text-ok">{completedToday}</span> shipped
        </p>
      </header>

      {hero && (
        <Surface
          tone="floating"
          className="relative p-6 animate-fade-up stagger-1"
        >
          <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div className="flex-1">
              <div className="mb-2 flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5 text-amber" />
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {hero.score.reason}
                </span>
              </div>
              <h2 className="font-display text-[34px] leading-[1.05] tracking-tight-display text-ink">
                {hero.task.title}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <Badge
                  tone={hero.task.priority === "urgent" ? "urgent" : "warn"}
                  dot
                  dotColor={PRIORITY_META[hero.task.priority].color}
                >
                  {PRIORITY_META[hero.task.priority].label}
                </Badge>
                <Badge dot dotColor={WORKSPACE_META[hero.task.workspace].color}>
                  {WORKSPACE_META[hero.task.workspace].label}
                </Badge>
                {hero.task.dueAt && (
                  <Badge>
                    due <span className="ml-1 text-ink">{relativeDue(hero.task.dueAt)}</span>
                  </Badge>
                )}
              </div>
            </div>
            <Link
              href={`/tasks?focus=${hero.task.id}`}
              className="group inline-flex items-center gap-2 self-start rounded-md bg-amber px-3.5 py-2 font-mono text-[12px] uppercase tracking-wider text-base shadow-glow transition-transform duration-200 ease-spring hover:translate-x-0.5 hover:shadow-ring active:translate-x-1"
            >
              focus this
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </Surface>
      )}

      {/* GRID --------------------------------------------------------------- */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* TODAY'S MEETINGS ------------------------------------------------- */}
        <Surface className="col-span-1 p-5 animate-fade-up stagger-2 lg:col-span-2">
          <SectionHeader
            comment="today's meetings"
            title="Schedule"
            count={today.length}
            right={
              <Link
                href="/meetings"
                className="font-mono text-[11px] uppercase tracking-wider text-ink-dim transition-colors hover:text-ink"
              >
                all →
              </Link>
            }
          />
          <ul className="mt-4 flex flex-col">
            {today.length === 0 && (
              <li className="py-8 text-center text-[12px] text-muted-foreground">
                Nothing on the calendar today.
              </li>
            )}
            {today.map((m, idx) => {
              const start = new Date(m.startAt);
              const end = new Date(m.endAt);
              const inProgress = new Date() >= start && new Date() < end;
              const past = new Date() >= end;
              return (
                <li key={m.id} className="relative">
                  <Link
                    href={`/meetings/${m.id}`}
                    className={cn(
                      "group flex items-center gap-4 rounded-lg px-2 py-3 transition-colors",
                      "hover:bg-elevated/60",
                      past && "opacity-50",
                    )}
                  >
                    {/* Timeline rail */}
                    <div className="flex w-16 shrink-0 flex-col items-end font-mono text-[11px] tabular leading-tight">
                      <span
                        className={cn(
                          "text-ink",
                          inProgress && "text-amber",
                        )}
                      >
                        {formatTime(m.startAt)}
                      </span>
                      <span className="text-ink-dim">{formatTime(m.endAt)}</span>
                    </div>
                    <div
                      className={cn(
                        "h-10 w-px",
                        inProgress ? "bg-amber" : "bg-hairline",
                      )}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-[14px] text-ink group-hover:text-ink">
                          {m.title}
                        </p>
                        {inProgress && (
                          <Badge tone="amber" dot dotColor="#F4B860">
                            now
                          </Badge>
                        )}
                      </div>
                      <p className="mt-0.5 truncate font-mono text-[11px] text-ink-dim">
                        {m.location ?? "—"} · {m.attendees.length} attendees
                      </p>
                    </div>
                    <Badge dot dotColor={WORKSPACE_META[m.workspace].color}>
                      {WORKSPACE_META[m.workspace].label}
                    </Badge>
                  </Link>
                  {idx < today.length - 1 && (
                    <div className="ml-[68px] h-px bg-hairline" />
                  )}
                </li>
              );
            })}
          </ul>
        </Surface>

        {/* PR ATTENTION ----------------------------------------------------- */}
        <Surface className="p-5 animate-fade-up stagger-3">
          <SectionHeader
            comment="needs review"
            title="Pulls"
            count={prAttention.length}
            right={
              <Link
                href="/github"
                className="font-mono text-[11px] uppercase tracking-wider text-ink-dim transition-colors hover:text-ink"
              >
                all →
              </Link>
            }
          />
          <ul className="mt-4 flex flex-col gap-3">
            {prAttention.length === 0 && (
              <li className="py-6 text-center text-[12px] text-muted-foreground">
                Inbox zero.
              </li>
            )}
            {prAttention.map((p) => (
              <li key={p.id}>
                <a
                  href={p.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group block rounded-lg border border-hairline bg-elevated/40 p-3 transition-all duration-150 hover:border-edge hover:bg-elevated"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-ink-dim">
                      {p.repo}
                      <span className="text-ink-faint"> · </span>
                      <span className="text-ink-muted">#{p.number}</span>
                    </span>
                    <ExternalLink className="h-3 w-3 text-ink-dim opacity-0 transition-opacity group-hover:opacity-100" />
                  </div>
                  <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-ink">
                    {p.title}
                  </p>
                  <div className="mt-2 flex items-center justify-between font-mono text-[10px] text-ink-dim">
                    <span className="flex items-center gap-2">
                      <span className="text-ok">+{p.additions}</span>
                      <span className="text-urgent">−{p.deletions}</span>
                      <span>· {p.comments} cmts</span>
                    </span>
                    <span>{formatPRAge(p.updatedAt)} ago</span>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        </Surface>

        {/* TOP TASKS -------------------------------------------------------- */}
        <Surface className="col-span-1 p-5 animate-fade-up stagger-4 lg:col-span-2">
          <SectionHeader
            comment="priority engine"
            title="Top tasks"
            count={ranked.length}
            right={
              <Link
                href="/tasks"
                className="font-mono text-[11px] uppercase tracking-wider text-ink-dim transition-colors hover:text-ink"
              >
                all →
              </Link>
            }
          />
          <ul className="mt-4 divide-y divide-hairline">
            {ranked.map(({ task, score }, idx) => (
              <li
                key={task.id}
                className="flex items-center gap-3 py-2.5 transition-colors hover:bg-elevated/30"
              >
                <span className="w-6 font-mono text-[10px] tabular text-ink-dim">
                  0{idx + 1}
                </span>
                <button
                  onClick={() => toggleTaskComplete(task.id)}
                  className="group flex h-4 w-4 shrink-0 items-center justify-center rounded border border-edge transition-colors hover:border-amber"
                  aria-label="Complete task"
                >
                  <span className="h-2 w-2 rounded-sm bg-transparent transition-colors group-hover:bg-amber/40" />
                </button>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] text-ink">{task.title}</p>
                  <p className="mt-0.5 flex items-center gap-2 font-mono text-[10.5px] text-ink-dim">
                    <span>{score.reason}</span>
                  </p>
                </div>
                <div className="flex items-center gap-1.5">
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: PRIORITY_META[task.priority].color }}
                    title={task.priority}
                  />
                  <Badge dot dotColor={WORKSPACE_META[task.workspace].color}>
                    {WORKSPACE_META[task.workspace].label}
                  </Badge>
                </div>
              </li>
            ))}
          </ul>
        </Surface>

        {/* DEADLINES -------------------------------------------------------- */}
        <Surface className="p-5 animate-fade-up stagger-5">
          <SectionHeader
            comment="next 7 days"
            title="Deadlines"
            count={deadlines.length}
          />
          <ul className="mt-4 flex flex-col gap-2">
            {deadlines.length === 0 && (
              <li className="py-6 text-center text-[12px] text-muted-foreground">
                No upcoming deadlines.
              </li>
            )}
            {deadlines.map((t) => {
              const score = scoreTask(t, meetings);
              const overdue = score.reason.toLowerCase().includes("overdue");
              return (
                <li
                  key={t.id}
                  className="flex items-center gap-3 rounded-md px-2 py-1.5 transition-colors hover:bg-elevated/40"
                >
                  <span
                    className={cn(
                      "w-12 shrink-0 font-mono text-[11px] tabular",
                      overdue ? "text-urgent" : "text-amber",
                    )}
                  >
                    {relativeDue(t.dueAt!)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12.5px] text-ink-muted">{t.title}</p>
                  </div>
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: WORKSPACE_META[t.workspace].color }}
                  />
                </li>
              );
            })}
          </ul>
        </Surface>

        {/* QUICK NOTE ------------------------------------------------------- */}
        <Surface className="col-span-1 p-5 animate-fade-up lg:col-span-3">
          <SectionHeader
            comment="quick capture"
            title="Drop a thought"
            right={
              <span className="font-mono text-[11px] text-ink-dim">
                <kbd className="kbd">⌘</kbd>
                <kbd className="kbd ml-1">↵</kbd>
                <span className="ml-1.5">to save</span>
              </span>
            }
          />
          <div className="mt-4 flex items-end gap-3">
            <div className="flex-1">
              <textarea
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                onKeyDown={(e) => {
                  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
                    e.preventDefault();
                    handleQuickNote();
                  }
                }}
                placeholder="What's on your mind?"
                className="w-full resize-none bg-transparent font-mono text-[13px] leading-relaxed text-ink placeholder:text-ink-dim focus:outline-none"
                rows={3}
              />
            </div>
            <button
              onClick={handleQuickNote}
              disabled={!quickNote.trim()}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border border-hairline bg-elevated px-3 py-1.5 font-mono text-[12px] uppercase tracking-wider transition-all duration-150 ease-spring",
                "hover:border-amber/50 hover:text-amber active:scale-[0.97]",
                "disabled:opacity-40 disabled:hover:border-hairline disabled:hover:text-ink-muted",
                savedFlash && "border-ok/50 text-ok",
              )}
            >
              <Plus className="h-3.5 w-3.5" />
              {savedFlash ? "saved" : "save note"}
            </button>
          </div>
        </Surface>
      </div>
    </div>
  );
}
