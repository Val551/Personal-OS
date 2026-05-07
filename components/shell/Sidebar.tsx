"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  GitPullRequest,
  Home,
  NotebookText,
  Search,
  Sunrise,
} from "lucide-react";
import { cn } from "@/lib/cn";

const ITEMS: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  shortcut: string;
}[] = [
  { href: "/", label: "Today", Icon: Home, shortcut: "G T" },
  { href: "/tasks", label: "Tasks", Icon: CheckSquare, shortcut: "G K" },
  { href: "/meetings", label: "Meetings", Icon: CalendarDays, shortcut: "G M" },
  { href: "/notes", label: "Notes", Icon: NotebookText, shortcut: "G N" },
  { href: "/github", label: "GitHub", Icon: GitPullRequest, shortcut: "G P" },
  { href: "/recap", label: "Recap", Icon: Sunrise, shortcut: "G R" },
  { href: "/search", label: "Search", Icon: Search, shortcut: "G S" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sticky top-0 flex h-screen w-[232px] shrink-0 flex-col border-r border-hairline bg-panel/60 backdrop-blur-sm">
      {/* Brand mark */}
      <div className="flex items-center gap-2.5 px-5 pt-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-md bg-elevated shadow-elevated">
          <span className="font-mono text-[11px] tracking-tighter text-amber">{"//"}</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-display text-[15px] italic tracking-tight text-ink">
            engineering<span className="text-amber">.os</span>
          </span>
          <span className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.2em] text-ink-dim">
            v0.1 · personal
          </span>
        </div>
      </div>

      <div className="mx-5 mt-5 h-px bg-hairline" />

      {/* Nav */}
      <nav className="mt-3 flex flex-col gap-px px-3">
        <p className="comment-label px-2 pb-1 pt-2">workspace</p>
        {ITEMS.map(({ href, label, Icon, shortcut }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] transition-colors duration-150",
                active
                  ? "bg-elevated text-ink"
                  : "text-ink-muted hover:bg-elevated/50 hover:text-ink",
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-4 w-px -translate-y-1/2 bg-amber" />
              )}
              <Icon
                className={cn(
                  "h-4 w-4 transition-colors",
                  active ? "text-amber" : "text-ink-dim group-hover:text-ink-muted",
                )}
              />
              <span className="flex-1">{label}</span>
              <kbd
                className={cn(
                  "kbd transition-opacity",
                  active ? "opacity-100" : "opacity-0 group-hover:opacity-70",
                )}
              >
                {shortcut}
              </kbd>
            </Link>
          );
        })}
      </nav>

      <div className="mx-5 my-4 h-px bg-hairline" />

      {/* System status */}
      <div className="px-5">
        <p className="comment-label">system</p>
        <ul className="mt-2 space-y-1.5 font-mono text-[11px] text-ink-muted">
          <li className="flex items-center justify-between">
            <span className="text-ink-dim">calendar</span>
            <span className="flex items-center gap-1.5">
              <span className="status-dot bg-ok animate-pulse-dot" />
              synced
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-ink-dim">github</span>
            <span className="flex items-center gap-1.5">
              <span className="status-dot bg-ok animate-pulse-dot" />
              synced
            </span>
          </li>
          <li className="flex items-center justify-between">
            <span className="text-ink-dim">priority</span>
            <span className="flex items-center gap-1.5">
              <span className="status-dot bg-amber animate-pulse-dot" />
              live
            </span>
          </li>
        </ul>
      </div>

      {/* Spacer + user chip */}
      <div className="flex-1" />
      <div className="m-3 flex items-center gap-2.5 rounded-md border border-hairline bg-elevated/60 p-2.5">
        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-amber/20 font-mono text-[11px] text-amber">
          FC
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12px] text-ink">Fabio Campos</p>
          <p className="truncate font-mono text-[10px] text-ink-dim">fabiocam@cmu</p>
        </div>
        <kbd className="kbd">⌘ K</kbd>
      </div>
    </aside>
  );
}
