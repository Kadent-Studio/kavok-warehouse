import Link from "next/link";
import type { MovementType, StockStatus } from "@prisma/client";
import {
  ArrowDownRight,
  ArrowLeftRight,
  ArrowRight,
  Boxes,
  CalendarClock,
  ClipboardPlus,
  Clock3,
  History,
  PackageCheck,
  PackagePlus,
  Plane,
  RefreshCw,
  ShieldAlert,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { auth } from "@/auth";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { StatusTag } from "@/components/status-tag";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";
import { formatDateTime } from "@/lib/dates";
import { movementTypeLabel } from "@/lib/labels";

const CARACAS_OFFSET_MS = 4 * 60 * 60 * 1000;

const movementIcon: Record<MovementType, typeof PackagePlus> = {
  initial_stock: ClipboardPlus,
  receipt: PackagePlus,
  dispatch: ArrowDownRight,
  transfer: ArrowLeftRight,
  status_change: RefreshCw,
};

const movementTone: Record<MovementType, string> = {
  initial_stock: "bg-accent text-primary",
  receipt: "bg-tag-svc text-tag-svc-foreground",
  dispatch: "bg-tag-uns text-tag-uns-foreground",
  transfer: "bg-accent text-primary",
  status_change: "bg-tag-scr text-tag-scr-foreground",
};

function startOfCaracasDay(date: Date) {
  const local = new Date(date.getTime() - CARACAS_OFFSET_MS);
  return new Date(
    Date.UTC(
      local.getUTCFullYear(),
      local.getUTCMonth(),
      local.getUTCDate(),
    ) + CARACAS_OFFSET_MS,
  );
}

function relativeTime(date: Date, now: Date) {
  const minutes = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  return days === 1 ? "ayer" : `hace ${days} días`;
}

export const metadata = { title: "Dashboard" };

export default async function DashboardPage() {
  const session = await auth();
  const now = new Date();
  const todayStart = startOfCaracasDay(now);
  const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
  const weekStart = new Date(todayStart.getTime() - 6 * 24 * 60 * 60 * 1000);
  const expiryLimit = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  const [
    activeStock,
    movementsToday,
    dispatchesWeek,
    expired,
    expiringSoon,
    unserviceable,
    scrap,
    recentMovements,
    weeklyMovements,
    conditionGroups,
  ] = await Promise.all([
    prisma.stockItem.count({ where: { quantity: { gt: 0 } } }),
    prisma.stockMovement.count({
      where: { timestamp: { gte: todayStart, lt: tomorrowStart } },
    }),
    prisma.dispatchOrder.count({ where: { createdAt: { gte: weekStart } } }),
    prisma.stockItem.count({
      where: { quantity: { gt: 0 }, expirationDate: { lt: now } },
    }),
    prisma.stockItem.count({
      where: {
        quantity: { gt: 0 },
        expirationDate: { gte: now, lte: expiryLimit },
      },
    }),
    prisma.stockItem.count({
      where: { quantity: { gt: 0 }, status: "unserviceable" },
    }),
    prisma.stockItem.count({
      where: { quantity: { gt: 0 }, status: "scrap" },
    }),
    prisma.stockMovement.findMany({
      take: 8,
      orderBy: { timestamp: "desc" },
      include: {
        user: { select: { fullName: true } },
        stockItem: {
          select: {
            id: true,
            zone: true,
            shelf: true,
            status: true,
            part: {
              select: {
                partNumber: true,
                description: true,
                unitOfMeasure: true,
              },
            },
          },
        },
      },
    }),
    prisma.stockMovement.findMany({
      where: { timestamp: { gte: weekStart, lt: tomorrowStart } },
      select: { timestamp: true },
    }),
    prisma.stockItem.groupBy({
      by: ["status"],
      where: { quantity: { gt: 0 } },
      _count: { _all: true },
    }),
  ]);

  const attentionCount = expired + expiringSoon + unserviceable + scrap;
  const conditions: Record<StockStatus, number> = {
    serviceable: 0,
    unserviceable: 0,
    scrap: 0,
  };
  for (const group of conditionGroups) conditions[group.status] = group._count._all;

  const activityDays = Array.from({ length: 7 }, (_, index) => {
    const start = new Date(weekStart.getTime() + index * 24 * 60 * 60 * 1000);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    const count = weeklyMovements.filter(
      (movement) => movement.timestamp >= start && movement.timestamp < end,
    ).length;
    return {
      key: start.toISOString(),
      label: new Intl.DateTimeFormat("es-VE", {
        weekday: "short",
        timeZone: "America/Caracas",
      })
        .format(start)
        .replace(".", ""),
      count,
    };
  });
  const maxDailyActivity = Math.max(1, ...activityDays.map((day) => day.count));
  const firstName = (session?.user.name ?? session?.user.username ?? "").split(" ")[0];
  const operationalDate = new Intl.DateTimeFormat("es-VE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Caracas",
  }).format(now);

  return (
    <div className="space-y-6 p-6 lg:p-8">
      <PageHeader
        eyebrow="00 · Panel operativo"
        title={`Hola, ${firstName}`}
        description={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span>El hangar está actualizado.</span>
            <span className="text-ink-faint">·</span>
            <span className="capitalize tnum">{operationalDate}</span>
          </span>
        }
        actions={
          <Button
            size="lg"
            data-press
            nativeButton={false}
            render={
              <Link href="/dispatch">
                <PackageCheck className="size-4" />
                Registrar despacho
              </Link>
            }
          />
        }
      />

      <div className="grid grid-cols-12 gap-4">
        <MetricTile
          className="col-span-6 lg:col-span-4"
          delay={0}
          code="STK"
          label="Existencias activas"
          value={activeStock}
          detail="ítems con disponibilidad"
          icon={Boxes}
        />
        <MetricTile
          className="col-span-6 lg:col-span-3"
          delay={45}
          code="MOV"
          label="Movimientos hoy"
          value={movementsToday}
          detail="jornada Caracas"
          icon={History}
        />
        <MetricTile
          className="col-span-6 lg:col-span-2"
          delay={90}
          code="DSP"
          label="Despachos"
          value={dispatchesWeek}
          detail="últimos 7 días"
          icon={Plane}
        />
        <MetricTile
          className="col-span-6 lg:col-span-3"
          delay={135}
          code="ALT"
          label="Atención abierta"
          value={attentionCount}
          detail="condiciones por revisar"
          icon={ShieldAlert}
          tone={attentionCount > 0 ? "warning" : "success"}
        />

        <section
          className="rise-in col-span-12 overflow-hidden rounded-xl border border-border bg-card elevated lg:col-span-8 lg:row-span-2"
          style={{ animationDelay: "180ms" }}
        >
          <SectionHeading
            code="BITÁCORA · 08"
            title="Actividad del hangar"
            description="Los eventos más recientes del almacén"
            action={{ href: "/movements", label: "Ver bitácora" }}
          />

          {recentMovements.length === 0 ? (
            <div className="flex min-h-80 flex-col items-center justify-center px-6 text-center">
              <History className="mb-4 size-8 text-ink-faint" />
              <p className="font-display text-lg font-semibold text-ink">Sin actividad todavía</p>
              <p className="mt-1 max-w-sm text-sm text-ink-muted">
                Las recepciones, despachos y transferencias aparecerán aquí.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/70">
              {recentMovements.map((movement) => {
                const Icon = movementIcon[movement.type];
                const location = movementLocation(movement);
                return (
                  <Link
                    key={movement.id}
                    href={`/stock/${movement.stockItem.id}`}
                    className="group grid gap-3 px-5 py-3.5 transition-colors hover:bg-accent/45 focus-visible:bg-accent/45 focus-visible:outline-none sm:grid-cols-[auto_minmax(0,1fr)_auto] sm:items-center"
                  >
                    <span
                      className={cn(
                        "flex size-9 items-center justify-center rounded-lg",
                        movementTone[movement.type],
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-data text-[12.5px] font-semibold text-primary">
                          {movement.stockItem.part.partNumber}
                        </span>
                        <span className="text-[13px] font-medium text-ink">
                          {movementTypeLabel[movement.type]}
                        </span>
                        {movement.type === "status_change" && movement.newStatus && (
                          <StatusTag status={movement.newStatus} variant="code" />
                        )}
                      </span>
                      <span className="mt-0.5 block truncate text-[12.5px] text-ink-muted">
                        {movement.stockItem.part.description}
                        <span className="mx-1.5 text-ink-faint/60">·</span>
                        {location}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-5 pl-12 sm:justify-end sm:pl-0">
                      <span className="text-right">
                        <span className="block text-[13px] font-semibold tnum text-ink">
                          {Number(movement.quantity)} {movement.stockItem.part.unitOfMeasure}
                        </span>
                        <span
                          className="block text-[11.5px] text-ink-faint"
                          title={formatDateTime(movement.timestamp) ?? undefined}
                        >
                          {relativeTime(movement.timestamp, now)} · {movement.user.fullName}
                        </span>
                      </span>
                      <ArrowRight className="size-4 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
                    </span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        <section
          className="rise-in col-span-12 rounded-xl border border-border bg-card elevated lg:col-span-4"
          style={{ animationDelay: "225ms" }}
        >
          <SectionHeading
            code="REVISIÓN"
            title="Atención requerida"
            description="Ítems activos que necesitan seguimiento"
          />
          <div className="divide-y divide-border/70 px-5 pb-2">
            <AttentionRow
              href="/stock?expiry=expired"
              label="Vencidos"
              count={expired}
              icon={TriangleAlert}
              tone="danger"
            />
            <AttentionRow
              href="/stock?expiry=soon"
              label="Próximos a vencer"
              count={expiringSoon}
              icon={Clock3}
              tone="warning"
            />
            <AttentionRow
              href="/stock?status=unserviceable"
              label="No serviciables"
              count={unserviceable}
              icon={ShieldAlert}
              tone="warning"
            />
            <AttentionRow
              href="/stock?status=scrap"
              label="Scrap"
              count={scrap}
              icon={RefreshCw}
              tone="danger"
            />
          </div>
        </section>

        <section
          className="rise-in col-span-12 rounded-xl border border-border bg-card p-5 elevated sm:col-span-6 lg:col-span-4"
          style={{ animationDelay: "270ms" }}
        >
          <p className="font-data text-[10.5px] uppercase tracking-[0.16em] text-primary/60">
            CONDICIÓN
          </p>
          <h2 className="mt-1.5 font-display text-[18px] font-semibold text-ink">
            Salud del inventario
          </h2>
          <ConditionDistribution counts={conditions} />
        </section>

        <section
          className="rise-in col-span-12 rounded-xl border border-border bg-card p-5 elevated lg:col-span-8"
          style={{ animationDelay: "315ms" }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-data text-[10.5px] uppercase tracking-[0.16em] text-primary/60">
                PULSO · 07D
              </p>
              <h2 className="mt-1.5 font-display text-[18px] font-semibold text-ink">
                Ritmo de movimientos
              </h2>
            </div>
            <p className="text-right text-[12px] text-ink-faint">
              <span className="block text-lg font-semibold tnum text-ink">
                {weeklyMovements.length}
              </span>
              esta semana
            </p>
          </div>
          <div className="mt-6 grid grid-cols-7 gap-2" aria-label="Movimientos de los últimos siete días">
            {activityDays.map((day) => (
              <div key={day.key} className="flex min-w-0 flex-col items-center gap-2">
                <span className="text-[11px] font-semibold tnum text-ink-muted">{day.count}</span>
                <div className="flex h-16 w-full items-end overflow-hidden rounded-md bg-muted/80">
                  <div
                    className="w-full rounded-md bg-primary/75 transition-[height] duration-500"
                    style={{ height: `${Math.max(day.count ? 12 : 3, (day.count / maxDailyActivity) * 100)}%` }}
                  />
                </div>
                <span className="truncate text-[10.5px] uppercase tracking-wide text-ink-faint">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </section>

        <section
          className="rise-in col-span-12 rounded-xl border border-border bg-card p-5 elevated lg:col-span-4"
          style={{ animationDelay: "360ms" }}
        >
          <div className="flex items-center gap-2">
            <Sparkles className="size-4 text-primary" />
            <h2 className="font-display text-[18px] font-semibold text-ink">Acciones rápidas</h2>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2">
            <QuickAction href="/stock/new" label="Recibir" icon={PackagePlus} />
            <QuickAction href="/dispatch" label="Despachar" icon={PackageCheck} />
            <QuickAction href="/parts/new" label="Nueva parte" icon={ClipboardPlus} />
            <QuickAction href="/movements" label="Bitácora" icon={CalendarClock} />
          </div>
        </section>
      </div>
    </div>
  );
}

function MetricTile({
  code,
  label,
  value,
  detail,
  icon: Icon,
  className,
  delay,
  tone = "neutral",
}: {
  code: string;
  label: string;
  value: number;
  detail: string;
  icon: typeof Boxes;
  className?: string;
  delay: number;
  tone?: "neutral" | "warning" | "success";
}) {
  return (
    <section
      className={cn(
        "rise-in min-h-36 rounded-xl border border-border bg-card p-5 elevated",
        className,
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="font-data text-[10px] font-semibold tracking-[0.16em] text-primary/60">{code}</span>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            tone === "neutral" && "bg-accent text-primary",
            tone === "warning" && "bg-tag-uns text-tag-uns-foreground",
            tone === "success" && "bg-tag-svc text-tag-svc-foreground",
          )}
        >
          <Icon className="size-4" />
        </span>
      </div>
      <p className="mt-3 font-display text-[34px] font-semibold leading-none tracking-tight tnum text-ink">{value}</p>
      <p className="mt-2 text-[13px] font-medium text-ink">{label}</p>
      <p className="mt-0.5 text-[11.5px] text-ink-faint">{detail}</p>
    </section>
  );
}

function SectionHeading({
  code,
  title,
  description,
  action,
}: {
  code: string;
  title: string;
  description: string;
  action?: { href: string; label: string };
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border/70 px-5 py-4">
      <div>
        <p className="font-data text-[10px] font-semibold uppercase tracking-[0.16em] text-primary/60">{code}</p>
        <h2 className="mt-1 font-display text-[18px] font-semibold text-ink">{title}</h2>
        <p className="mt-0.5 text-[12px] text-ink-faint">{description}</p>
      </div>
      {action && (
        <Link
          href={action.href}
          className="inline-flex shrink-0 items-center gap-1 text-[12px] font-medium text-primary hover:underline focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {action.label}
          <ArrowRight className="size-3.5" />
        </Link>
      )}
    </div>
  );
}

function AttentionRow({
  href,
  label,
  count,
  icon: Icon,
  tone,
}: {
  href: string;
  label: string;
  count: number;
  icon: typeof TriangleAlert;
  tone: "warning" | "danger";
}) {
  return (
    <Link
      href={href}
      className="group flex items-center gap-3 py-3.5 focus-visible:rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-lg",
          count === 0 && "bg-muted text-ink-faint",
          count > 0 && tone === "warning" && "bg-tag-uns text-tag-uns-foreground",
          count > 0 && tone === "danger" && "bg-tag-scr text-tag-scr-foreground",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className={cn("flex-1 text-[13px] font-medium", count ? "text-ink" : "text-ink-muted")}>{label}</span>
      <span className="font-display text-xl font-semibold tnum text-ink">{count}</span>
      <ArrowRight className="size-3.5 text-ink-faint transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
    </Link>
  );
}

function ConditionDistribution({ counts }: { counts: Record<StockStatus, number> }) {
  const total = counts.serviceable + counts.unserviceable + counts.scrap;
  const entries: Array<{ status: StockStatus; label: string; tone: string }> = [
    { status: "serviceable", label: "Serviciable", tone: "bg-[color:var(--tag-svc-fg)]" },
    { status: "unserviceable", label: "No serviciable", tone: "bg-[color:var(--tag-uns-fg)]" },
    { status: "scrap", label: "Scrap", tone: "bg-[color:var(--tag-scr-fg)]" },
  ];
  return (
    <div className="mt-5">
      <div className="flex h-2.5 overflow-hidden rounded-full bg-muted" aria-label={`${total} existencias activas`}>
        {entries.map((entry) => (
          <div
            key={entry.status}
            className={entry.tone}
            style={{ width: total ? `${(counts[entry.status] / total) * 100}%` : "0%" }}
          />
        ))}
      </div>
      <div className="mt-4 space-y-2.5">
        {entries.map((entry) => (
          <div key={entry.status} className="flex items-center gap-2 text-[12.5px]">
            <span className={cn("size-2 rounded-full", entry.tone)} />
            <span className="flex-1 text-ink-muted">{entry.label}</span>
            <span className="font-semibold tnum text-ink">{counts[entry.status]}</span>
            <span className="w-9 text-right text-[11px] tnum text-ink-faint">
              {total ? Math.round((counts[entry.status] / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function QuickAction({ href, label, icon: Icon }: { href: string; label: string; icon: typeof PackagePlus }) {
  return (
    <Link
      href={href}
      data-press
      className="flex min-h-20 flex-col items-start justify-between rounded-lg bg-muted/70 p-3 text-left transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Icon className="size-4 text-primary" />
      <span className="text-[12.5px] font-medium text-ink">{label}</span>
    </Link>
  );
}

function movementLocation(movement: {
  type: MovementType;
  fromZone: string | null;
  fromShelf: string | null;
  toZone: string | null;
  toShelf: string | null;
  recipient: string | null;
  stockItem: { zone: string; shelf: string };
}) {
  if (movement.type === "dispatch") return movement.recipient ?? "Salida de almacén";
  if (movement.type === "transfer") {
    return `${movement.fromZone ?? "—"}/${movement.fromShelf ?? "—"} → ${movement.toZone ?? "—"}/${movement.toShelf ?? "—"}`;
  }
  if (movement.toZone || movement.toShelf) return `${movement.toZone ?? "—"}/${movement.toShelf ?? "—"}`;
  return `${movement.stockItem.zone}/${movement.stockItem.shelf}`;
}
