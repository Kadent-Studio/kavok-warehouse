import { daysUntil, expiryStatus, formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

const TONE: Record<string, string> = {
  ok: "text-tag-svc-foreground",
  soon: "bg-tag-uns text-tag-uns-foreground border-[color:var(--tag-uns-border)]",
  expired:
    "bg-tag-scr text-tag-scr-foreground border-[color:var(--tag-scr-border)]",
};

export function ExpiryBadge({
  expiration,
  className,
}: {
  expiration: Date | null | undefined;
  className?: string;
}) {
  const status = expiryStatus(expiration);

  if (status === "none") {
    return <span className="text-ink-faint text-[13px]">—</span>;
  }

  const date = formatDate(expiration);
  const days = daysUntil(expiration)!;

  if (status === "ok") {
    return (
      <span className={cn("text-[13px] tnum text-ink-muted", className)}>
        {date}
      </span>
    );
  }

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-sm border px-1.5 py-0.5 text-[11.5px] font-medium tnum",
        TONE[status],
        className,
      )}
      title={status === "expired" ? "Vencido" : "Por vencer"}
    >
      {date}
      <span className="opacity-80">
        {status === "expired"
          ? `· vencido ${Math.abs(days)}d`
          : days === 0
            ? "· hoy"
            : `· ${days}d`}
      </span>
    </span>
  );
}
