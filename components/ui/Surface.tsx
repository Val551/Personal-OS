import { cn } from "@/lib/utils";
import { forwardRef } from "react";

// Shadcn-flavored compat shim. Keeps the existing API used across pages.
export const Surface = forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    tone?: "panel" | "elevated" | "floating";
  }
>(function Surface({ className, tone = "panel", ...props }, ref) {
  const toneCls =
    tone === "floating"
      ? "bg-popover shadow-lg"
      : tone === "elevated"
        ? "bg-card shadow-sm"
        : "bg-card";
  return (
    <div
      ref={ref}
      className={cn("rounded-lg border", toneCls, className)}
      {...props}
    />
  );
});
