import { cn } from "@/lib/cn";

export function Badge({
  children,
  className,
  tone = "neutral",
  dot,
  dotColor,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "neutral" | "amber" | "urgent" | "warn" | "ok" | "link";
  dot?: boolean;
  dotColor?: string;
}) {
  const toneCls = {
    neutral: "border-hairline bg-elevated/60 text-ink-muted",
    amber: "border-amber/30 bg-amber/10 text-amber",
    urgent: "border-urgent/30 bg-urgent/10 text-urgent",
    warn: "border-warn/30 bg-warn/10 text-warn",
    ok: "border-ok/30 bg-ok/10 text-ok",
    link: "border-link/30 bg-link/10 text-link",
  }[tone];

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-px font-mono text-[10px] uppercase tracking-wider",
        toneCls,
        className,
      )}
    >
      {dot && (
        <span
          className="inline-block h-1.5 w-1.5 rounded-full"
          style={{ background: dotColor ?? "currentColor" }}
        />
      )}
      {children}
    </span>
  );
}
