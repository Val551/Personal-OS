import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

// Legacy `tone` API used across the app's existing pages — maps onto the new
// shadcn-flavored variant set so callers don't need to migrate at once.
type LegacyTone = "neutral" | "amber" | "urgent" | "warn" | "ok" | "link";

export interface BadgeProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "color">,
    VariantProps<typeof badgeVariants> {
  tone?: LegacyTone;
  dot?: boolean;
  dotColor?: string;
}

const TONE_TO_CLASS: Record<LegacyTone, string> = {
  neutral: "border bg-secondary text-secondary-foreground",
  amber: "border bg-secondary text-foreground",
  urgent: "border-destructive/30 bg-destructive/10 text-destructive",
  warn: "border-warn/30 bg-warn/10 text-warn",
  ok: "border-ok/30 bg-ok/10 text-ok",
  link: "border-primary/30 bg-primary/10 text-primary",
};

function Badge({
  className,
  variant,
  tone,
  dot,
  dotColor,
  children,
  ...props
}: BadgeProps) {
  if (tone) {
    return (
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-md border px-1.5 py-px font-mono text-[10px] uppercase tracking-wider",
          TONE_TO_CLASS[tone],
          className,
        )}
        {...(props as React.HTMLAttributes<HTMLSpanElement>)}
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
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

export { Badge, badgeVariants };
