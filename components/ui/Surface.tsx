import { cn } from "@/lib/cn";
import { forwardRef } from "react";

export const Surface = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { tone?: "panel" | "elevated" | "floating" }
>(function Surface({ className, tone = "panel", ...props }, ref) {
  const toneCls =
    tone === "floating"
      ? "bg-floating shadow-floating border-edge"
      : tone === "elevated"
        ? "bg-elevated shadow-elevated border-hairline"
        : "bg-panel border-hairline";
  return (
    <div ref={ref} className={cn("rounded-xl border", toneCls, className)} {...props} />
  );
});
