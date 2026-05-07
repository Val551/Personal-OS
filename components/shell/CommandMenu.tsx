"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import {
  CalendarDays,
  CheckSquare,
  GitPullRequest,
  Home,
  NotebookText,
  Search,
  Sunrise,
} from "lucide-react";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const NAV = [
  { href: "/", label: "Today", Icon: Home },
  { href: "/tasks", label: "Tasks", Icon: CheckSquare },
  { href: "/meetings", label: "Meetings", Icon: CalendarDays },
  { href: "/notes", label: "Notes", Icon: NotebookText },
  { href: "/github", label: "GitHub", Icon: GitPullRequest },
  { href: "/recap", label: "Recap", Icon: Sunrise },
  { href: "/search", label: "Search", Icon: Search },
];

export function CommandMenu({ open, onOpenChange }: Props) {
  const router = useRouter();
  const { tasks, meetings, notes, prs } = useStore();
  const [query, setQuery] = useState("");

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const results = useMemo(() => {
    return {
      tasks: tasks.slice(0, 80),
      meetings: meetings.slice(0, 40),
      notes: notes.slice(0, 40),
      prs: prs.slice(0, 40),
    };
  }, [tasks, meetings, notes, prs]);

  if (!open) return null;

  const go = (href: string) => {
    onOpenChange(false);
    router.push(href);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border border-edge bg-floating shadow-floating"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command palette" className="flex flex-col">
          <div className="flex items-center gap-2 border-b border-hairline px-4 py-3">
            <Search className="h-4 w-4 text-ink-dim" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Jump to anything — task, meeting, note, PR…"
              className="flex-1 bg-transparent text-[13px] text-ink placeholder:text-ink-dim focus:outline-none"
            />
            <kbd className="kbd">esc</kbd>
          </div>

          <Command.List className="max-h-[420px] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-8 text-center font-mono text-[12px] text-ink-dim">
              {"// no results"}
            </Command.Empty>

            <Command.Group heading="Navigate">
              {NAV.map(({ href, label, Icon }) => (
                <Command.Item
                  key={href}
                  value={`nav ${label}`}
                  onSelect={() => go(href)}
                  className="group flex cursor-pointer items-center gap-2.5 rounded-md px-3 py-2 text-[13px] text-ink-muted aria-selected:bg-elevated aria-selected:text-ink"
                >
                  <Icon className="h-4 w-4 text-ink-dim group-aria-selected:text-amber" />
                  <span>{label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Tasks">
              {results.tasks.map((t) => (
                <Command.Item
                  key={t.id}
                  value={`task ${t.title} ${t.workspace}`}
                  onSelect={() => go(`/tasks?focus=${t.id}`)}
                  className="group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-[13px] text-ink-muted aria-selected:bg-elevated aria-selected:text-ink"
                >
                  <CheckSquare className="h-4 w-4 text-ink-dim group-aria-selected:text-amber" />
                  <span className="flex-1 truncate">{t.title}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
                    {t.workspace}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Meetings">
              {results.meetings.map((m) => (
                <Command.Item
                  key={m.id}
                  value={`meeting ${m.title}`}
                  onSelect={() => go(`/meetings/${m.id}`)}
                  className="group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-[13px] text-ink-muted aria-selected:bg-elevated aria-selected:text-ink"
                >
                  <CalendarDays className="h-4 w-4 text-ink-dim group-aria-selected:text-amber" />
                  <span className="flex-1 truncate">{m.title}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Notes">
              {results.notes.map((n) => (
                <Command.Item
                  key={n.id}
                  value={`note ${n.title} ${n.body.slice(0, 200)}`}
                  onSelect={() => go(`/notes?focus=${n.id}`)}
                  className="group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-[13px] text-ink-muted aria-selected:bg-elevated aria-selected:text-ink"
                >
                  <NotebookText className="h-4 w-4 text-ink-dim group-aria-selected:text-amber" />
                  <span className="flex-1 truncate">{n.title}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-ink-dim">
                    {n.type}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Pull requests">
              {results.prs.map((p) => (
                <Command.Item
                  key={p.id}
                  value={`pr ${p.title} ${p.repo}`}
                  onSelect={() => go("/github")}
                  className="group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-[13px] text-ink-muted aria-selected:bg-elevated aria-selected:text-ink"
                >
                  <GitPullRequest className="h-4 w-4 text-ink-dim group-aria-selected:text-amber" />
                  <span className="flex-1 truncate">{p.title}</span>
                  <span className="font-mono text-[10px] text-ink-dim">
                    {p.repo} #{p.number}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t border-hairline bg-elevated/40 px-4 py-2 font-mono text-[10px] text-ink-dim">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <kbd className="kbd">↑</kbd>
                <kbd className="kbd">↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="kbd">↵</kbd>
                open
              </span>
            </div>
            <span>{"// cmd palette · v0.1"}</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
