import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: string;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-end justify-between gap-4 pb-7 border-b border-border/60",
        className,
      )}
    >
      <div className="space-y-2">
        {eyebrow && (
          <p className="font-data text-[11px] uppercase tracking-[0.16em] text-primary/70">
            {eyebrow}
          </p>
        )}
        <h1 className="font-display text-[31px] font-semibold tracking-tight text-ink leading-none">
          {title}
        </h1>
        {description && (
          <p className="text-[14.5px] text-ink-muted max-w-2xl leading-relaxed pt-0.5">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
