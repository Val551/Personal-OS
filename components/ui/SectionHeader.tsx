import { cn } from "@/lib/cn";

export function SectionHeader({
  comment,
  title,
  count,
  right,
  className,
}: {
  comment: string;
  title?: React.ReactNode;
  count?: number | string;
  right?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between", className)}>
      <div>
        <p className="comment-label">{comment}</p>
        {title !== undefined && (
          <h2 className="mt-1 font-display text-[26px] leading-none tracking-tight-display text-ink">
            {title}
            {count !== undefined && (
              <span className="ml-2 align-middle font-mono text-[12px] tracking-normal text-ink-dim">
                {count}
              </span>
            )}
          </h2>
        )}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}
