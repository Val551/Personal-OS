"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";
import { ThemeToggle } from "@/components/theme-toggle";
import { Separator } from "@/components/ui/separator";

const SEGMENT_LABEL: Record<string, string> = {
  "": "Today",
  tasks: "Tasks",
  meetings: "Meetings",
  notes: "Notes",
  github: "GitHub",
  recap: "Recap",
  search: "Search",
};

export function Topbar({ onOpenCmd }: { onOpenCmd: () => void }) {
  const pathname = usePathname();
  const [time, setTime] = useState<string>("");

  useEffect(() => {
    const tick = () => setTime(format(new Date(), "EEE LLL d · HH:mm"));
    tick();
    const id = setInterval(tick, 30 * 1000);
    return () => clearInterval(id);
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const top = segments[0] ?? "";

  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b bg-background/80 px-6 backdrop-blur">
      <div className="flex items-center gap-2 text-sm">
        <span className="text-muted-foreground">engineering-os</span>
        <span className="text-muted-foreground/50">/</span>
        <span className="font-medium">{SEGMENT_LABEL[top] ?? top}</span>
        {segments[1] && (
          <>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-muted-foreground">{segments[1]}</span>
          </>
        )}
      </div>

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

      <Separator orientation="vertical" className="h-6" />

      <span
        suppressHydrationWarning
        className="hidden text-xs text-muted-foreground md:inline"
      >
        {time || "—"}
      </span>

      <ThemeToggle />
    </header>
  );
}
