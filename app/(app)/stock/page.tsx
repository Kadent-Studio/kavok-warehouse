import Link from "next/link";
import { Plus, Download } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { StatusTag } from "@/components/status-tag";
import { ExpiryBadge } from "@/components/expiry-badge";
import { partCategoryLabel } from "@/lib/labels";
import { StockFilters } from "./stock-filters";

type SearchParams = {
  q?: string;
  status?: string;
  category?: string;
  zone?: string;
  expiry?: string;
  depleted?: string;
};

const STATUSES = ["serviceable", "unserviceable", "scrap"];

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const showDepleted = sp.depleted === "1";
  const now = new Date();

  const where: Prisma.StockItemWhereInput = {
    ...(showDepleted ? {} : { quantity: { gt: 0 } }),
    ...(sp.status && STATUSES.includes(sp.status)
      ? { status: sp.status as Prisma.StockItemWhereInput["status"] }
      : {}),
    ...(sp.zone ? { zone: sp.zone } : {}),
    ...(sp.category && ["rotable", "consumable", "expendable"].includes(sp.category)
      ? { part: { category: sp.category as never } }
      : {}),
    ...(sp.expiry === "expired"
      ? { expirationDate: { lt: now } }
      : sp.expiry === "soon"
        ? {
            expirationDate: {
              gte: now,
              lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            },
          }
        : {}),
    ...(q
      ? {
          OR: [
            { serialNumber: { contains: q, mode: "insensitive" } },
            { lotNumber: { contains: q, mode: "insensitive" } },
            { part: { partNumber: { contains: q, mode: "insensitive" } } },
            { part: { description: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const [items, zones, totalItems] = await Promise.all([
    prisma.stockItem.findMany({
      where,
      include: {
        part: {
          select: {
            partNumber: true,
            description: true,
            unitOfMeasure: true,
            category: true,
          },
        },
      },
      orderBy: [{ createdAt: "desc" }],
      take: 500,
    }),
    prisma.stockItem.findMany({
      distinct: ["zone"],
      select: { zone: true },
      orderBy: { zone: "asc" },
    }),
    prisma.stockItem.count({ where: { quantity: { gt: 0 } } }),
  ]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        eyebrow="01 · Inventario"
        title="Stock"
        description={`Ítems físicos en almacén. ${totalItems} con existencia.`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              data-press
              nativeButton={false}
              render={
                <Link href={`/stock/export${buildQuery(sp)}`}>
                  <Download className="size-3.5" />
                  Exportar CSV
                </Link>
              }
            />
            <Button
              size="sm"
              data-press
              nativeButton={false}
              render={
                <Link href="/stock/new">
                  <Plus className="size-3.5" />
                  Recibir / Cargar
                </Link>
              }
            />
          </>
        }
      />

      <StockFilters
        defaultQ={q}
        defaultStatus={sp.status}
        defaultCategory={sp.category}
        defaultZone={sp.zone}
        defaultExpiry={sp.expiry}
        defaultDepleted={showDepleted}
        zones={zones.map((z) => z.zone)}
      />

      {items.length === 0 ? (
        <EmptyState
          code="Sin resultados"
          title={q ? `Nada coincide con "${q}"` : "Sin stock registrado"}
          description={
            q
              ? "Ajusta los filtros o revisa la ortografía."
              : "Registra la primera recepción o carga tu inventario inicial para empezar."
          }
          action={
            !q && (
              <Button
                size="sm"
                data-press
                nativeButton={false}
                render={
                  <Link href="/stock/new">
                    <Plus className="size-3.5" />
                    Recibir / Cargar
                  </Link>
                }
              />
            )
          }
        />
      ) : (
        <StockTable items={items} />
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

function StockTable({
  items,
}: {
  items: Array<{
    id: string;
    serialNumber: string | null;
    lotNumber: string | null;
    quantity: unknown;
    zone: string;
    shelf: string;
    status: "serviceable" | "unserviceable" | "scrap";
    expirationDate: Date | null;
    part: {
      partNumber: string;
      description: string;
      unitOfMeasure: string;
      category: "rotable" | "consumable" | "expendable";
    };
  }>;
}) {
  return (
    <div className="rise-in border border-border rounded-xl overflow-hidden bg-card elevated">
      <div className="overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="bg-muted/70 text-[11px] uppercase tracking-[0.1em] text-ink-faint border-b border-border">
              <th className="text-left font-semibold px-4 py-3.5">Part Number</th>
              <th className="text-left font-semibold px-4 py-3.5">Serial / Lote</th>
              <th className="text-left font-semibold px-4 py-3.5">Descripción</th>
              <th className="text-right font-semibold px-4 py-3.5">Cant.</th>
              <th className="text-left font-semibold px-4 py-3.5">Ubicación</th>
              <th className="text-left font-semibold px-4 py-3.5">Estado</th>
              <th className="text-left font-semibold px-4 py-3.5">Vence</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const depleted = Number(it.quantity) <= 0;
              return (
                <tr
                  key={it.id}
                  className={cnRow(depleted)}
                >
                  <td className="px-4 py-3.5 align-middle">
                    <Link
                      href={`/stock/${it.id}`}
                      className="font-data text-[13.5px] font-medium text-ink hover:text-primary tracking-tight"
                    >
                      {it.part.partNumber}
                    </Link>
                    <span className="block text-[11px] text-ink-faint mt-0.5">
                      {partCategoryLabel[it.part.category]}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 align-middle font-data text-[13px] text-ink-muted">
                    {it.serialNumber ?? it.lotNumber ?? (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3.5 align-middle text-ink-muted max-w-[320px] truncate">
                    {it.part.description}
                  </td>
                  <td className="px-4 py-3.5 align-middle text-right tnum">
                    <span className={depleted ? "text-ink-faint" : "text-ink font-medium"}>
                      {String(it.quantity)}
                    </span>
                    <span className="text-ink-faint text-[11px] ml-1 uppercase">
                      {it.part.unitOfMeasure}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 align-middle text-ink-muted">
                    <span className="font-data text-[13px]">{it.zone}</span>
                    <span className="mx-1 text-ink-faint">/</span>
                    <span className="font-data text-[13px]">{it.shelf}</span>
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <StatusTag status={it.status} />
                  </td>
                  <td className="px-4 py-3.5 align-middle">
                    <ExpiryBadge expiration={it.expirationDate} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function cnRow(depleted: boolean) {
  return [
    "border-t border-border/70 first:border-t-0 hover:bg-accent/60 transition-colors",
    depleted && "opacity-55",
  ]
    .filter(Boolean)
    .join(" ");
}
