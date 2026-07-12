import { cn } from "@/lib/utils";

type Props = {
  code?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
};

export function EmptyState({
  code,
  title,
  description,
  action,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "rise-in border border-dashed border-border/80 rounded-xl",
        "py-16 px-6 flex flex-col items-center text-center gap-3",
        "bg-muted/40",
        className,
      )}
    >
      {code && (
        <p className="font-data text-[11px] uppercase tracking-[0.16em] text-primary/60">
          {code}
        </p>
      )}
      <p className="font-display text-[18px] font-semibold text-ink">{title}</p>
      {description && (
        <p className="text-[14px] text-ink-muted max-w-md leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
