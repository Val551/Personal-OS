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
];

const itemCls =
  "group flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm text-muted-foreground aria-selected:bg-accent aria-selected:text-accent-foreground";

const groupCls =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground";

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
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh] backdrop-blur-sm"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <Command label="Command palette" className="flex flex-col">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Jump to anything — task, meeting, note, PR…"
              className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
              esc
            </kbd>
          </div>

          <Command.List className="max-h-[420px] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-8 text-center text-sm text-muted-foreground">
              No results.
            </Command.Empty>

            <Command.Group heading="Navigate" className={groupCls}>
              {NAV.map(({ href, label, Icon }) => (
                <Command.Item
                  key={href}
                  value={`nav ${label}`}
                  onSelect={() => go(href)}
                  className={itemCls}
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Tasks" className={groupCls}>
              {results.tasks.map((t) => (
                <Command.Item
                  key={t.id}
                  value={`task ${t.title} ${t.workspace}`}
                  onSelect={() => go(`/tasks?focus=${t.id}`)}
                  className={itemCls}
                >
                  <CheckSquare className="h-4 w-4" />
                  <span className="flex-1 truncate">{t.title}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t.workspace}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Meetings" className={groupCls}>
              {results.meetings.map((m) => (
                <Command.Item
                  key={m.id}
                  value={`meeting ${m.title}`}
                  onSelect={() => go(`/meetings/${m.id}`)}
                  className={itemCls}
                >
                  <CalendarDays className="h-4 w-4" />
                  <span className="flex-1 truncate">{m.title}</span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Notes" className={groupCls}>
              {results.notes.map((n) => (
                <Command.Item
                  key={n.id}
                  value={`note ${n.title} ${n.body.slice(0, 200)}`}
                  onSelect={() => go(`/notes?focus=${n.id}`)}
                  className={itemCls}
                >
                  <NotebookText className="h-4 w-4" />
                  <span className="flex-1 truncate">{n.title}</span>
                  <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                    {n.type}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>

            <Command.Group heading="Pull requests" className={groupCls}>
              {results.prs.map((p) => (
                <Command.Item
                  key={p.id}
                  value={`pr ${p.title} ${p.repo}`}
                  onSelect={() => go("/github")}
                  className={itemCls}
                >
                  <GitPullRequest className="h-4 w-4" />
                  <span className="flex-1 truncate">{p.title}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {p.repo} #{p.number}
                  </span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t bg-muted/40 px-4 py-2 text-[10px] text-muted-foreground">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border bg-muted px-1.5 py-0.5">↑↓</kbd>
                navigate
              </span>
              <span className="flex items-center gap-1.5">
                <kbd className="rounded border bg-muted px-1.5 py-0.5">↵</kbd>
                open
              </span>
            </div>
            <span>cmd palette</span>
          </div>
        </Command>
      </div>
    </div>
  );
}
