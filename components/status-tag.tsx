import type { StockStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

const CODE: Record<StockStatus, string> = {
  serviceable: "SVC",
  unserviceable: "UNS",
  scrap: "SCR",
};

const LABEL: Record<StockStatus, string> = {
  serviceable: "Serviciable",
  unserviceable: "No serviciable",
  scrap: "Scrap",
};

const TONE: Record<StockStatus, string> = {
  serviceable:
    "bg-tag-svc text-tag-svc-foreground border-[color:var(--tag-svc-border)]",
  unserviceable:
    "bg-tag-uns text-tag-uns-foreground border-[color:var(--tag-uns-border)]",
  scrap: "bg-tag-scr text-tag-scr-foreground border-[color:var(--tag-scr-border)]",
};

type Props = {
  status: StockStatus;
  variant?: "ribbon" | "code" | "full";
  className?: string;
};

/**
 * Signature component: echoes the physical cardboard status tags mechanics
 * hang on parts. `ribbon` for tables (short), `full` for detail views.
 */
export function StatusTag({ status, variant = "ribbon", className }: Props) {
  const code = CODE[status];
  const label = LABEL[status];

  if (variant === "code") {
    return (
      <span
        className={cn(
          "font-data text-[10px] font-semibold tracking-widest uppercase",
          "text-tag-svc-foreground",
          status === "unserviceable" && "text-tag-uns-foreground",
          status === "scrap" && "text-tag-scr-foreground",
          className,
        )}
        title={label}
      >
        {code}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 border rounded-sm",
        "px-1.5 py-0.5 text-[10.5px] leading-none font-medium",
        TONE[status],
        className,
      )}
      title={label}
    >
      <span className="font-data font-semibold tracking-wider uppercase">
        {code}
      </span>
      {variant === "full" && (
        <span className="text-[10.5px] font-normal opacity-90">{label}</span>
      )}
    </span>
  );
}
