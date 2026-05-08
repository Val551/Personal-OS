"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  CheckSquare,
  GitPullRequest,
  Home,
  LogOut,
  NotebookText,
  Search,
  Settings,
  Sunrise,
} from "lucide-react";
import type { Session } from "next-auth";
import { cn } from "@/lib/utils";
import { signOutAction } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const ITEMS: {
  href: string;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
}[] = [
  { href: "/", label: "Today", Icon: Home },
  { href: "/tasks", label: "Tasks", Icon: CheckSquare },
  { href: "/meetings", label: "Meetings", Icon: CalendarDays },
  { href: "/notes", label: "Notes", Icon: NotebookText },
  { href: "/github", label: "GitHub", Icon: GitPullRequest },
  { href: "/recap", label: "Recap", Icon: Sunrise },
  { href: "/search", label: "Search", Icon: Search },
  { href: "/settings", label: "Settings", Icon: Settings },
];

export function Sidebar({ session }: { session: Session }) {
  const pathname = usePathname();
  const user = session.user;
  const initials = (user?.name ?? user?.email ?? "?")
    .split(/\s+|@/)
    .filter(Boolean)
    .map((s) => s[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <aside className="sticky top-0 flex h-screen w-[232px] shrink-0 flex-col border-r bg-background">
      <div className="flex items-center gap-2.5 px-5 pt-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-foreground text-background">
          <span className="text-xs font-semibold tracking-tighter">eo</span>
        </div>
        <div className="flex flex-col leading-none">
          <span className="text-sm font-semibold tracking-tight">
            engineering.os
          </span>
          <span className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
            v0.1 · personal
          </span>
        </div>
      </div>

      <Separator className="mx-5 mt-5 w-auto" />

      <nav className="mt-3 flex flex-col gap-px px-3">
        <p className="px-2 pb-1 pt-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          workspace
        </p>
        {ITEMS.map(({ href, label, Icon }) => {
          const active =
            href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm transition-colors",
                active
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground",
              )}
            >
              <Icon
                className={cn(
                  "h-4 w-4",
                  active ? "text-foreground" : "text-muted-foreground/70",
                )}
              />
              <span>{label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="flex-1" />

      <div className="m-3 flex items-center gap-2.5 rounded-lg border bg-card p-2.5">
        {user?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={user.name ?? ""}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-medium text-secondary-foreground">
            {initials}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-medium">
            {user?.name ?? "Anonymous"}
          </p>
          <p className="truncate text-[10px] text-muted-foreground">
            {user?.email ?? "unknown"}
          </p>
        </div>
        <form action={signOutAction}>
          <Button
            type="submit"
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </aside>
  );
}
