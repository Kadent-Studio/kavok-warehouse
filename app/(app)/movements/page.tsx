import Link from "next/link";
import { Download } from "lucide-react";
import { Prisma, type MovementType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { movementTypeLabel, stockStatusLabel } from "@/lib/labels";
import { formatDateTime } from "@/lib/dates";
import { MovementsFilters } from "./movements-filters";

type SearchParams = {
  q?: string;
  type?: string;
  from?: string;
  to?: string;
};

const TYPES: MovementType[] = [
  "initial_stock",
  "receipt",
  "dispatch",
  "transfer",
  "status_change",
];

const TYPE_TONE: Record<MovementType, string> = {
  initial_stock: "bg-accent text-ink-muted",
  receipt: "bg-tag-svc text-tag-svc-foreground",
  dispatch: "bg-tag-scr text-tag-scr-foreground",
  transfer: "bg-accent text-primary",
  status_change: "bg-tag-uns text-tag-uns-foreground",
};

export default async function MovementsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";

  const from = sp.from ? new Date(`${sp.from}T00:00:00.000Z`) : null;
  const to = sp.to ? new Date(`${sp.to}T23:59:59.999Z`) : null;

  const where: Prisma.StockMovementWhereInput = {
    ...(sp.type && TYPES.includes(sp.type as MovementType)
      ? { type: sp.type as MovementType }
      : {}),
    ...(from || to
      ? {
          timestamp: {
            ...(from ? { gte: from } : {}),
            ...(to ? { lte: to } : {}),
          },
        }
      : {}),
    ...(q
      ? {
          OR: [
            { stockItem: { part: { partNumber: { contains: q, mode: "insensitive" } } } },
            { stockItem: { part: { description: { contains: q, mode: "insensitive" } } } },
            { stockItem: { serialNumber: { contains: q, mode: "insensitive" } } },
            { stockItem: { lotNumber: { contains: q, mode: "insensitive" } } },
            { recipient: { contains: q, mode: "insensitive" } },
            { supplier: { contains: q, mode: "insensitive" } },
            { referenceNumber: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      stockItem: {
        select: {
          id: true,
          serialNumber: true,
          lotNumber: true,
          part: { select: { partNumber: true, unitOfMeasure: true } },
        },
      },
      user: { select: { fullName: true, username: true } },
    },
    orderBy: { timestamp: "desc" },
    take: 500,
  });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        eyebrow="02 · Trazabilidad"
        title="Movimientos"
        description="Bitácora inmutable de todo evento de stock en el almacén."
        actions={
          <Button
            variant="outline"
            size="sm"
            data-press
            nativeButton={false}
            render={
              <Link href={`/movements/export${buildQuery(sp)}`}>
                <Download className="size-3.5" />
                Exportar CSV
              </Link>
            }
          />
        }
      />

      <MovementsFilters
        defaultQ={q}
        defaultType={sp.type}
        defaultFrom={sp.from}
        defaultTo={sp.to}
      />

      {movements.length === 0 ? (
        <EmptyState
          code="Sin resultados"
          title={q ? `Nada coincide con "${q}"` : "Aún no hay movimientos"}
          description={
            q
              ? "Ajusta los filtros o el rango de fechas."
              : "Los movimientos se registran automáticamente al recibir, despachar, transferir o cambiar el estado del stock."
          }
        />
      ) : (
        <>
          <div className="rise-in border border-border rounded-xl overflow-hidden bg-card elevated">
            <div className="overflow-x-auto">
              <table className="w-full text-[14px]">
                <thead>
                  <tr className="bg-muted/70 text-[11px] uppercase tracking-[0.1em] text-ink-faint border-b border-border">
                    <th className="text-left font-semibold px-4 py-3.5">Fecha</th>
                    <th className="text-left font-semibold px-4 py-3.5">Tipo</th>
                    <th className="text-left font-semibold px-4 py-3.5">Part Number</th>
                    <th className="text-left font-semibold px-4 py-3.5">Serial / Lote</th>
                    <th className="text-right font-semibold px-4 py-3.5">Cant.</th>
                    <th className="text-left font-semibold px-4 py-3.5">Detalle</th>
                    <th className="text-left font-semibold px-4 py-3.5">Usuario</th>
                  </tr>
                </thead>
                <tbody>
                  {movements.map((m) => (
                    <tr
                      key={m.id}
                      className="border-t border-border/70 first:border-t-0 hover:bg-accent/60 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle text-ink-muted text-[13px] tnum whitespace-nowrap">
                        {formatDateTime(m.timestamp)}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span
                          className={`inline-flex items-center rounded-md px-2 py-0.5 text-[11.5px] font-medium ${TYPE_TONE[m.type]}`}
                        >
                          {movementTypeLabel[m.type]}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <Link
                          href={`/stock/${m.stockItem.id}`}
                          className="font-data text-[13px] font-medium text-ink hover:text-primary"
                        >
                          {m.stockItem.part.partNumber}
                        </Link>
                      </td>
                      <td className="px-4 py-3 align-middle font-data text-[13px] text-ink-muted">
                        {m.stockItem.serialNumber ??
                          m.stockItem.lotNumber ?? (
                            <span className="text-ink-faint">—</span>
                          )}
                      </td>
                      <td className="px-4 py-3 align-middle text-right tnum text-ink">
                        {signed(m.type, m.quantity)}
                      </td>
                      <td className="px-4 py-3 align-middle text-ink-muted text-[13px] max-w-[300px] truncate">
                        {describe(m)}
                      </td>
                      <td className="px-4 py-3 align-middle text-ink-muted text-[13px] whitespace-nowrap">
                        {m.user.fullName || m.user.username}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          {movements.length === 500 && (
            <p className="text-[12px] text-ink-faint text-center">
              Mostrando los 500 movimientos más recientes. Acota con filtros o
              rango de fechas para ver más.
            </p>
          )}
        </>
      )}
    </div>
  );
}

function buildQuery(sp: SearchParams) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v) params.set(k, v);
  const s = params.toString();
  return s ? `?${s}` : "";
}

function signed(type: MovementType, qty: unknown) {
  const n = String(qty);
  if (type === "dispatch") return `−${n}`;
  if (type === "receipt" || type === "initial_stock") return `+${n}`;
  return n;
}

function describe(m: {
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
}) {
  switch (m.type) {
    case "transfer":
      return `${m.fromZone}/${m.fromShelf} → ${m.toZone}/${m.toShelf}`;
    case "status_change":
      return m.previousStatus && m.newStatus
        ? `${stockStatusLabel[m.previousStatus]} → ${stockStatusLabel[m.newStatus]}${m.reason ? ` · ${m.reason}` : ""}`
        : (m.reason ?? "");
    case "dispatch":
      return [m.recipient, m.referenceNumber, m.reason].filter(Boolean).join(" · ");
    case "receipt":
      return [m.supplier, m.referenceNumber].filter(Boolean).join(" · ");
    case "initial_stock":
      return m.toZone ? `${m.toZone}/${m.toShelf}` : "";
    default:
      return "";
  }
}
