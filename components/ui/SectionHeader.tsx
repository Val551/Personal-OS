import { cn } from "@/lib/utils";

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
        <p className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          {comment}
        </p>
        {title !== undefined && (
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            {title}
            {count !== undefined && (
              <span className="ml-2 align-middle text-xs font-normal text-muted-foreground">
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
