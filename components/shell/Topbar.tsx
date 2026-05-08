"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";

const SEGMENT_LABEL: Record<string, string> = {
  "": "Today",
  tasks: "Tasks",
  meetings: "Meetings",
  notes: "Notes",
  github: "GitHub",
  recap: "Recap",
  settings: "Settings",
};

export function Topbar({ onOpenCmd }: { onOpenCmd: () => void }) {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const top = segments[0] ?? "";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-6 backdrop-blur">
      <span className="text-sm font-medium">
        {SEGMENT_LABEL[top] ?? top}
      </span>

      <div className="flex-1" />

      <button
        onClick={onOpenCmd}
        className="group flex items-center gap-2 rounded-md border bg-background px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search…</span>
        <kbd className="ml-2 hidden items-center gap-0.5 rounded border bg-muted px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <ThemeToggle />
    </header>
  );
}
