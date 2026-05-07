"use client";

import { usePathname } from "next/navigation";
import { Search } from "lucide-react";
import { format } from "date-fns";
import { useEffect, useState } from "react";

const SEGMENT_LABEL: Record<string, string> = {
  "": "today",
  tasks: "tasks",
  meetings: "meetings",
  notes: "notes",
  github: "github",
  recap: "recap",
  search: "search",
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
    <header className="sticky top-0 z-20 flex h-12 items-center gap-3 border-b border-hairline bg-base/80 px-6 backdrop-blur-md">
      <div className="flex items-center gap-2 font-mono text-[11px]">
        <span className="text-ink-dim">~/</span>
        <span className="text-ink-muted">engineering-os</span>
        <span className="text-ink-faint">/</span>
        <span className="text-amber">{SEGMENT_LABEL[top] ?? top}</span>
        {segments[1] && (
          <>
            <span className="text-ink-faint">/</span>
            <span className="text-ink-muted">{segments[1]}</span>
          </>
        )}
        <span className="caret -ml-1" />
      </div>

      <div className="flex-1" />

      <button
        onClick={onOpenCmd}
        className="group flex items-center gap-2 rounded-md border border-hairline bg-elevated/60 px-2.5 py-1 text-[12px] text-ink-muted transition-colors duration-150 hover:border-edge hover:bg-elevated hover:text-ink active:scale-[0.99]"
      >
        <Search className="h-3.5 w-3.5 text-ink-dim group-hover:text-ink-muted" />
        <span>Search anything…</span>
        <span className="mx-1 h-3 w-px bg-hairline" />
        <kbd className="kbd">⌘ K</kbd>
      </button>

      <div className="flex items-center gap-2 font-mono text-[11px] text-ink-muted">
        <span className="status-dot bg-amber animate-pulse-dot" />
        <span suppressHydrationWarning>{time || "—"}</span>
      </div>
    </header>
  );
}
