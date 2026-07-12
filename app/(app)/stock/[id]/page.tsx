import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowDownRight,
  ArrowLeftRight,
  RefreshCw,
  PackagePlus,
  Inbox,
} from "lucide-react";
import type { MovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { StatusTag } from "@/components/status-tag";
import { ExpiryBadge } from "@/components/expiry-badge";
import { movementTypeLabel, stockStatusLabel, partCategoryLabel } from "@/lib/labels";
import { formatDate, formatDateTime } from "@/lib/dates";
import { StockActions } from "./stock-actions";

const MOVEMENT_ICON: Record<MovementType, React.ComponentType<{ className?: string }>> = {
  initial_stock: Inbox,
  receipt: PackagePlus,
  dispatch: ArrowDownRight,
  transfer: ArrowLeftRight,
  status_change: RefreshCw,
};

export default async function StockDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const item = await prisma.stockItem.findUnique({
    where: { id },
    include: {
      part: true,
      movements: {
        include: { user: { select: { fullName: true, username: true } } },
        orderBy: { timestamp: "desc" },
      },
    },
  });

  if (!item) notFound();

  const qty = Number(item.quantity);
  const depleted = qty <= 0;
  const identifier = item.serialNumber ?? item.lotNumber ?? null;

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl">
      <PageHeader
        eyebrow={`01 · Inventario / ${item.part.trackingType === "serial" ? "Serial" : "Lote"}`}
        title={item.part.description}
        description={
          <span className="flex items-center gap-2">
            <Link
              href={`/parts/${item.partId}`}
              className="font-data text-[13.5px] text-primary hover:underline"
            >
              {item.part.partNumber}
            </Link>
            {identifier && (
              <>
                <span className="text-ink-faint/50">·</span>
                <span className="font-data text-[13px] text-ink-muted">
                  {identifier}
                </span>
              </>
            )}
          </span>
        }
        actions={
          <StockActions
            itemId={item.id}
            quantity={qty}
            unitOfMeasure={item.part.unitOfMeasure}
            status={item.status}
            zone={item.zone}
            shelf={item.shelf}
            expiration={item.expirationDate}
          />
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">
        {/* Ficha */}
        <div className="space-y-4">
          <div className="border border-border rounded-xl p-6 bg-card elevated">
            <dl className="grid grid-cols-2 gap-x-8 gap-y-5">
              <DataItem label="Cantidad">
                <span className={depleted ? "text-ink-faint" : "text-ink"}>
                  <span className="font-display text-[22px] font-semibold tnum">
                    {String(item.quantity)}
                  </span>
                  <span className="text-[12px] uppercase text-ink-faint ml-1.5">
                    {item.part.unitOfMeasure}
                  </span>
                </span>
                {depleted && (
                  <span className="block text-[11px] uppercase tracking-wider text-ink-faint mt-1">
                    Agotado
                  </span>
                )}
              </DataItem>
              <DataItem label="Estado">
                <StatusTag status={item.status} variant="full" />
              </DataItem>
              <DataItem label="Categoría">
                {partCategoryLabel[item.part.category]}
              </DataItem>
              <DataItem label="Ubicación">
                <span className="font-data">
                  {item.zone} <span className="text-ink-faint">/</span> {item.shelf}
                </span>
              </DataItem>
              <DataItem label="Recepción">
                <span className="font-data tnum">
                  {formatDate(item.receiptDate)}
                </span>
              </DataItem>
              <DataItem label="Vencimiento">
                <ExpiryBadge expiration={item.expirationDate} />
              </DataItem>
              {item.notes && (
                <div className="col-span-2 flex flex-col gap-1">
                  <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint font-medium">
                    Notas
                  </dt>
                  <dd className="text-[13.5px] text-ink-muted">{item.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Historial */}
        <aside>
          <div className="flex items-baseline gap-3 mb-4">
            <span className="font-data text-[10.5px] uppercase tracking-[0.16em] text-primary/60">
              Bitácora
            </span>
            <h2 className="font-display text-[15px] font-semibold text-ink tracking-tight">
              Movimientos
            </h2>
            <span className="text-[12px] text-ink-faint tnum ml-auto">
              {item.movements.length}
            </span>
          </div>
          <ol className="relative border-l border-border ml-1.5 space-y-5">
            {item.movements.map((m) => {
              const Icon = MOVEMENT_ICON[m.type];
              return (
                <li key={m.id} className="relative pl-6">
                  <span className="absolute -left-[9px] top-0.5 flex size-[18px] items-center justify-center rounded-full bg-card border border-border">
                    <Icon className="size-3 text-ink-muted" />
                  </span>
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="text-[13px] font-medium text-ink">
                      {movementTypeLabel[m.type]}
                    </p>
                    <span className="text-[13px] tnum text-ink-muted shrink-0">
                      {signed(m.type, m.quantity)}
                    </span>
                  </div>
                  <p className="text-[11.5px] text-ink-faint mt-0.5 tnum">
                    {formatDateTime(m.timestamp)} ·{" "}
                    {m.user.fullName || m.user.username}
                  </p>
                  <MovementDetail
                    type={m.type}
                    fromZone={m.fromZone}
                    fromShelf={m.fromShelf}
                    toZone={m.toZone}
                    toShelf={m.toShelf}
                    supplier={m.supplier}
                    recipient={m.recipient}
                    referenceNumber={m.referenceNumber}
                    previousStatus={m.previousStatus}
                    newStatus={m.newStatus}
                    reason={m.reason}
                    notes={m.notes}
                  />
                </li>
              );
            })}
          </ol>
        </aside>
      </div>
    </div>
  );
}

function DataItem({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint font-medium">
        {label}
      </dt>
      <dd className="text-[14px] text-ink">{children}</dd>
    </div>
  );
}

function signed(type: MovementType, qty: unknown) {
  const n = String(qty);
  if (type === "dispatch") return `−${n}`;
  if (type === "receipt" || type === "initial_stock") return `+${n}`;
  return n;
}

function MovementDetail(props: {
  type: MovementType;
  fromZone: string | null;
  fromShelf: string | null;
  toZone: string | null;
  toShelf: string | null;
  supplier: string | null;
  recipient: string | null;
  referenceNumber: string | null;
  previousStatus: "serviceable" | "unserviceable" | "scrap" | null;
  newStatus: "serviceable" | "unserviceable" | "scrap" | null;
  reason: string | null;
  notes: string | null;
}) {
  const bits: React.ReactNode[] = [];

  if (props.type === "transfer") {
    bits.push(
      <span key="loc" className="font-data">
        {props.fromZone}/{props.fromShelf} → {props.toZone}/{props.toShelf}
      </span>,
    );
  }
  if (props.type === "status_change" && props.previousStatus && props.newStatus) {
    bits.push(
      <span key="st">
        {stockStatusLabel[props.previousStatus]} →{" "}
        {stockStatusLabel[props.newStatus]}
      </span>,
    );
  }
  if (props.supplier) bits.push(<span key="sup">Proveedor: {props.supplier}</span>);
  if (props.recipient) bits.push(<span key="rec">Destino: {props.recipient}</span>);
  if (props.referenceNumber)
    bits.push(
      <span key="ref" className="font-data">
        Ref: {props.referenceNumber}
      </span>,
    );
  if (props.reason) bits.push(<span key="rea">Motivo: {props.reason}</span>);
  if (props.notes) bits.push(<span key="not">{props.notes}</span>);

  if (bits.length === 0) return null;

  return (
    <div className="mt-1.5 flex flex-col gap-0.5 text-[12px] text-ink-muted">
      {bits.map((b, i) => (
        <div key={i}>{b}</div>
      ))}
    </div>
  );
}
