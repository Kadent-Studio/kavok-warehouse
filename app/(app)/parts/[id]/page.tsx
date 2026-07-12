import { notFound } from "next/navigation";
import Link from "next/link";
import { Pencil } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { PartForm } from "../part-form";
import { partCategoryLabel, trackingTypeLabel } from "@/lib/labels";
import { AlternatesPanel } from "./alternates-panel";
import { ArchiveButton } from "./archive-button";
import { StatusTag } from "@/components/status-tag";

export default async function PartDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const part = await prisma.part.findUnique({
    where: { id },
    include: {
      alternatesFrom: {
        include: {
          alternate: {
            select: {
              id: true,
              partNumber: true,
              description: true,
              manufacturer: true,
            },
          },
        },
      },
      stockItems: {
        select: {
          id: true,
          serialNumber: true,
          lotNumber: true,
          quantity: true,
          zone: true,
          shelf: true,
          status: true,
          expirationDate: true,
        },
        take: 20,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!part) notFound();

  const alternates = part.alternatesFrom.map((a) => a.alternate);
  const stockTotal = part.stockItems.reduce(
    (sum, i) => sum + Number(i.quantity),
    0,
  );

  return (
    <div className="p-6 lg:p-8 space-y-8 max-w-5xl">
      <PageHeader
        eyebrow={`03 · Catálogo / ${part.archived ? "Archivada" : "Activa"}`}
        title={part.description}
        description={
          <span className="font-data text-[13px] text-ink-muted tracking-tight">
            {part.partNumber}
          </span>
        }
        actions={
          <>
            <ArchiveButton
              partId={part.id}
              archived={part.archived}
              hasStock={part.stockItems.length > 0}
            />
            <Button
              size="sm"
              data-press
              nativeButton={false}
              render={
                <Link href={`/parts/${part.id}/edit`}>
                  <Pencil className="size-3.5" />
                  Editar
                </Link>
              }
            />
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <div className="space-y-8">
          <DataGrid
            code="A"
            title="Identidad"
            rows={[
              {
                label: "Part Number",
                value: (
                  <span className="font-data text-[13.5px] text-ink">
                    {part.partNumber}
                  </span>
                ),
              },
              { label: "Descripción", value: part.description },
              { label: "Fabricante", value: part.manufacturer },
              {
                label: "Capítulo ATA",
                value: part.ataChapter ? (
                  <span className="font-data">{part.ataChapter}</span>
                ) : (
                  <Empty />
                ),
              },
            ]}
          />

          <DataGrid
            code="B"
            title="Clasificación"
            rows={[
              { label: "Categoría", value: partCategoryLabel[part.category] },
              { label: "Tracking", value: trackingTypeLabel[part.trackingType] },
              {
                label: "Unidad de medida",
                value: (
                  <span className="font-data uppercase">{part.unitOfMeasure}</span>
                ),
              },
              {
                label: "Vida útil",
                value: part.shelfLifeDays != null ? (
                  <span className="font-data tabular-nums">
                    {part.shelfLifeDays} días
                  </span>
                ) : (
                  <Empty />
                ),
              },
            ]}
          />

          <StockPreview
            stock={part.stockItems}
            total={stockTotal}
            uom={part.unitOfMeasure}
          />
        </div>

        <aside className="space-y-6">
          <AlternatesPanel
            partId={part.id}
            currentPartNumber={part.partNumber}
            alternates={alternates}
          />
        </aside>
      </div>
    </div>
  );
}

function DataGrid({
  code,
  title,
  rows,
}: {
  code: string;
  title: string;
  rows: { label: string; value: React.ReactNode }[];
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-4">
        <span className="font-data text-[10.5px] uppercase tracking-[0.16em] text-primary/60">
          Sección {code}
        </span>
        <h2 className="font-display text-[15px] font-semibold text-ink tracking-tight">
          {title}
        </h2>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5 border border-border rounded-xl p-6 bg-card elevated">
        {rows.map((r) => (
          <div key={r.label} className="flex flex-col gap-1">
            <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint font-medium">
              {r.label}
            </dt>
            <dd className="text-[14px] text-ink">{r.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function Empty() {
  return <span className="text-ink-faint">—</span>;
}

function StockPreview({
  stock,
  total,
  uom,
}: {
  stock: Array<{
    id: string;
    serialNumber: string | null;
    lotNumber: string | null;
    quantity: unknown;
    zone: string;
    shelf: string;
    status: "serviceable" | "unserviceable" | "scrap";
    expirationDate: Date | null;
  }>;
  total: number;
  uom: string;
}) {
  return (
    <section>
      <div className="flex items-baseline justify-between gap-3 mb-4">
        <div className="flex items-baseline gap-3">
          <span className="font-data text-[10.5px] uppercase tracking-[0.16em] text-primary/60">
            Sección C
          </span>
          <h2 className="font-display text-[15px] font-semibold text-ink tracking-tight">
            Stock actual
          </h2>
        </div>
        <p className="text-[12.5px] tnum text-ink-muted">
          Total: <span className="text-ink font-semibold">{total}</span>{" "}
          <span className="uppercase text-ink-faint text-[11px]">{uom}</span>
        </p>
      </div>
      {stock.length === 0 ? (
        <div className="border border-dashed border-border/80 rounded-xl py-8 px-5 text-[13px] text-ink-muted bg-muted/40">
          Aún no hay ítems físicos de esta parte. Se creará stock desde una
          recepción o carga inicial.
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden bg-card elevated">
          <table className="w-full text-[12.5px]">
            <thead>
              <tr className="bg-muted/60 text-[10px] uppercase tracking-[0.12em] text-ink-faint border-b border-border">
                <th className="text-left font-medium px-3 py-2">Serial / Lote</th>
                <th className="text-left font-medium px-3 py-2">Cant.</th>
                <th className="text-left font-medium px-3 py-2">Ubicación</th>
                <th className="text-left font-medium px-3 py-2">Estado</th>
                <th className="text-left font-medium px-3 py-2">Vence</th>
              </tr>
            </thead>
            <tbody>
              {stock.map((s) => (
                <tr
                  key={s.id}
                  className="border-t border-border first:border-t-0 hover:bg-muted/30"
                >
                  <td className="px-3 py-2 font-data text-[12px]">
                    {s.serialNumber ?? s.lotNumber ?? <Empty />}
                  </td>
                  <td className="px-3 py-2 tnum">{String(s.quantity)}</td>
                  <td className="px-3 py-2 text-ink-muted">
                    <span className="font-data">{s.zone}</span>
                    <span className="mx-1 text-ink-faint">/</span>
                    <span className="font-data">{s.shelf}</span>
                  </td>
                  <td className="px-3 py-2">
                    <StatusTag status={s.status} />
                  </td>
                  <td className="px-3 py-2 font-data text-ink-muted">
                    {s.expirationDate ? (
                      formatDate(s.expirationDate)
                    ) : (
                      <Empty />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

function formatDate(d: Date) {
  return new Intl.DateTimeFormat("es-VE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "America/Caracas",
  }).format(d);
}
