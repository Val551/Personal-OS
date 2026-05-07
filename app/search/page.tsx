"use client";

import Link from "next/link";
import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  GitPullRequest,
  NotebookText,
  Search as SearchIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { Surface } from "@/components/ui/Surface";
import { Badge } from "@/components/ui/Badge";
import { WORKSPACE_META } from "@/lib/types";
import { format } from "date-fns";

export default function SearchPage() {
  return (
    <Suspense fallback={null}>
      <SearchPageInner />
    </Suspense>
  );
}

function SearchPageInner() {
  const params = useSearchParams();
  const { tasks, meetings, notes, prs } = useStore();
  const [q, setQ] = useState(params.get("q") ?? "");

  const norm = q.trim().toLowerCase();

  const results = useMemo(() => {
    if (!norm) {
      return { tasks: [], meetings: [], notes: [], prs: [], total: 0 };
    }
    const t = tasks.filter(
      (x) => x.title.toLowerCase().includes(norm) || x.notes?.toLowerCase().includes(norm),
    );
    const m = meetings.filter(
      (x) =>
        x.title.toLowerCase().includes(norm) || x.description?.toLowerCase().includes(norm),
    );
    const n = notes.filter(
      (x) => x.title.toLowerCase().includes(norm) || x.body.toLowerCase().includes(norm),
    );
    const p = prs.filter(
      (x) => x.title.toLowerCase().includes(norm) || x.repo.toLowerCase().includes(norm),
    );
    return {
      tasks: t,
      meetings: m,
      notes: n,
      prs: p,
      total: t.length + m.length + n.length + p.length,
    };
  }, [norm, tasks, meetings, notes, prs]);

  return (
    <div className="mx-auto flex max-w-[1100px] flex-col gap-6">
      <header className="pt-2 animate-fade-up">
        <p className="comment-label">grep · across everything</p>
        <h1 className="mt-1 font-display text-[52px] leading-[0.95] tracking-tightest-display text-ink">
          Search<span className="text-amber">.</span>
        </h1>
      </header>

      <Surface tone="elevated" className="flex items-center gap-3 px-4 py-3 animate-fade-up stagger-1">
        <SearchIcon className="h-4 w-4 text-ink-dim" />
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tasks, meetings, notes, pull requests…"
          className="flex-1 bg-transparent font-mono text-[14px] text-ink placeholder:text-ink-dim focus:outline-none"
        />
        {q && (
          <span className="font-mono text-[11px] text-ink-dim">
            <span className="text-ink">{results.total}</span> result{results.total === 1 ? "" : "s"}
          </span>
        )}
      </Surface>

      {!norm ? (
        <Surface className="p-12 text-center animate-fade-up stagger-2">
          <p className="font-mono text-[12px] text-ink-dim">{"// type to search across all entities"}</p>
        </Surface>
      ) : results.total === 0 ? (
        <Surface className="p-12 text-center animate-fade-up stagger-2">
          <p className="font-mono text-[12px] text-ink-dim">{"// no matches"}</p>
        </Surface>
      ) : (
        <div className="flex flex-col gap-5">
          {results.tasks.length > 0 && (
            <Group icon={CheckSquare} comment="tasks" count={results.tasks.length}>
              {results.tasks.map((t) => (
                <Link
                  key={t.id}
                  href={`/tasks?focus=${t.id}`}
                  className="group flex items-center gap-3 rounded-md border border-hairline bg-elevated/40 px-3 py-2.5 transition-colors hover:border-edge hover:bg-elevated"
                >
                  <CheckSquare className="h-3.5 w-3.5 text-ink-dim group-hover:text-amber" />
                  <p className="flex-1 truncate text-[13px] text-ink">{t.title}</p>
                  <Badge dot dotColor={WORKSPACE_META[t.workspace].color}>
                    {WORKSPACE_META[t.workspace].label}
                  </Badge>
                </Link>
              ))}
            </Group>
          )}

          {results.meetings.length > 0 && (
            <Group icon={CalendarDays} comment="meetings" count={results.meetings.length}>
              {results.meetings.map((m) => (
                <Link
                  key={m.id}
                  href={`/meetings/${m.id}`}
                  className="group flex items-center gap-3 rounded-md border border-hairline bg-elevated/40 px-3 py-2.5 transition-colors hover:border-edge hover:bg-elevated"
                >
                  <CalendarDays className="h-3.5 w-3.5 text-ink-dim group-hover:text-amber" />
                  <p className="flex-1 truncate text-[13px] text-ink">{m.title}</p>
                  <span className="font-mono text-[11px] text-ink-muted">
                    {format(new Date(m.startAt), "EEE LLL d · HH:mm")}
                  </span>
                </Link>
              ))}
            </Group>
          )}

          {results.notes.length > 0 && (
            <Group icon={NotebookText} comment="notes" count={results.notes.length}>
              {results.notes.map((n) => (
                <Link
                  key={n.id}
                  href={`/notes?focus=${n.id}`}
                  className="group flex items-start gap-3 rounded-md border border-hairline bg-elevated/40 px-3 py-2.5 transition-colors hover:border-edge hover:bg-elevated"
                >
                  <NotebookText className="mt-0.5 h-3.5 w-3.5 text-ink-dim group-hover:text-amber" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] text-ink">{n.title}</p>
                    <p className="line-clamp-1 font-mono text-[11px] text-ink-dim">{n.body}</p>
                  </div>
                  <Badge tone="link">{n.type}</Badge>
                </Link>
              ))}
            </Group>
          )}

          {results.prs.length > 0 && (
            <Group icon={GitPullRequest} comment="pull requests" count={results.prs.length}>
              {results.prs.map((p) => (
                <a
                  key={p.id}
                  href={p.htmlUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-md border border-hairline bg-elevated/40 px-3 py-2.5 transition-colors hover:border-edge hover:bg-elevated"
                >
                  <GitPullRequest className="h-3.5 w-3.5 text-ink-dim group-hover:text-amber" />
                  <p className="flex-1 truncate text-[13px] text-ink">{p.title}</p>
                  <span className="font-mono text-[11px] text-ink-muted">
                    {p.repo} #{p.number}
                  </span>
                </a>
              ))}
            </Group>
          )}
        </div>
      )}
    </div>
  );
}

function Group({
  icon: Icon,
  comment,
  count,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  comment: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <Surface className="p-4 animate-fade-up">
      <div className="mb-3 flex items-center gap-2">
        <Icon className="h-3.5 w-3.5 text-ink-dim" />
        <span className="comment-label">{comment}</span>
        <span className="font-mono text-[10px] text-ink-dim">{count}</span>
      </div>
      <div className="flex flex-col gap-1.5">{children}</div>
    </Surface>
  );
}
