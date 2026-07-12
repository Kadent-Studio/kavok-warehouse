import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { formatDateTime } from "@/lib/dates";
import { destinationLabel, formatFolio } from "@/lib/dispatch";
import { destinationTypeLabel, partCategoryLabel } from "@/lib/labels";

export default async function DispatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const order = await prisma.dispatchOrder.findUnique({
    where: { id },
    include: {
      aircraft: { select: { registration: true, model: true } },
      user: { select: { fullName: true, username: true } },
      movements: {
        include: {
          stockItem: {
            select: {
              id: true,
              serialNumber: true,
              lotNumber: true,
              zone: true,
              shelf: true,
              part: {
                select: {
                  partNumber: true,
                  description: true,
                  category: true,
                  unitOfMeasure: true,
                },
              },
            },
          },
        },
        orderBy: { stockItem: { part: { partNumber: "asc" } } },
      },
    },
  });

  if (!order) notFound();

  const destino = destinationLabel({
    destinationType: order.destinationType,
    aircraft: order.aircraft,
    destinationText: order.destinationText,
  });

  return (
    <div className="p-6 lg:p-8 space-y-7 max-w-4xl">
      <Link
        href="/dispatch"
        className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-muted hover:text-ink transition-colors"
      >
        <ArrowLeft className="size-3.5" />
        Despachos
      </Link>

      <PageHeader
        eyebrow="04 · Despacho · Vale"
        title={formatFolio(order.number)}
        description={
          <span className="flex items-center gap-2">
            <span className="text-ink">{destino}</span>
            <span
              className={
                order.destinationType === "aircraft"
                  ? "inline-flex items-center rounded-md bg-primary/10 px-1.5 py-0.5 text-[10.5px] font-medium text-primary"
                  : "inline-flex items-center rounded-md bg-accent px-1.5 py-0.5 text-[10.5px] font-medium text-ink-muted"
              }
            >
              {destinationTypeLabel[order.destinationType]}
            </span>
          </span>
        }
      />

      {/* Cabecera */}
      <div className="border border-border rounded-xl p-6 bg-card elevated">
        <dl className="grid grid-cols-2 sm:grid-cols-4 gap-x-8 gap-y-5">
          <DataItem label="Solicitó">{order.requestedBy}</DataItem>
          <DataItem label="Entregó">{order.deliveredBy}</DataItem>
          <DataItem label="Registró">
            {order.user.fullName || order.user.username}
          </DataItem>
          <DataItem label="Fecha">
            <span className="tnum">{formatDateTime(order.createdAt)}</span>
          </DataItem>
          {order.aircraft?.model && (
            <DataItem label="Modelo">{order.aircraft.model}</DataItem>
          )}
          {order.notes && (
            <div className="col-span-2 sm:col-span-4 flex flex-col gap-1">
              <dt className="text-[11px] uppercase tracking-[0.14em] text-ink-faint font-medium">
                Notas
              </dt>
              <dd className="text-[13.5px] text-ink-muted">{order.notes}</dd>
            </div>
          )}
        </dl>
      </div>

      {/* Líneas */}
      <div className="space-y-3">
        <div className="flex items-baseline gap-3">
          <span className="font-data text-[10.5px] uppercase tracking-[0.16em] text-primary/60">
            Artículos despachados
          </span>
          <span className="text-[12px] text-ink-faint tnum ml-auto">
            {order.movements.length}
          </span>
        </div>

        <div className="border border-border rounded-xl overflow-hidden bg-card elevated">
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="bg-muted/70 text-[11px] uppercase tracking-[0.1em] text-ink-faint border-b border-border">
                  <th className="text-left font-semibold px-4 py-3">Parte</th>
                  <th className="text-left font-semibold px-4 py-3">Categoría</th>
                  <th className="text-left font-semibold px-4 py-3">Desde</th>
                  <th className="text-right font-semibold px-4 py-3">Cantidad</th>
                </tr>
              </thead>
              <tbody>
                {order.movements.map((m) => {
                  const ident = m.stockItem.serialNumber ?? m.stockItem.lotNumber;
                  return (
                    <tr
                      key={m.id}
                      className="border-t border-border/70 first:border-t-0 hover:bg-accent/60 transition-colors"
                    >
                      <td className="px-4 py-3 align-middle">
                        <Link
                          href={`/stock/${m.stockItem.id}`}
                          className="font-data text-[13.5px] text-ink hover:text-primary transition-colors"
                        >
                          {m.stockItem.part.partNumber}
                        </Link>
                        <p className="text-[12px] text-ink-muted truncate max-w-xs">
                          {m.stockItem.part.description}
                          {ident && (
                            <span className="font-data text-ink-faint"> · {ident}</span>
                          )}
                        </p>
                      </td>
                      <td className="px-4 py-3 align-middle text-ink-muted text-[13px]">
                        {partCategoryLabel[m.stockItem.part.category]}
                      </td>
                      <td className="px-4 py-3 align-middle">
                        <span className="inline-flex items-center gap-1.5 font-data text-[13px] text-ink-muted">
                          <MapPin className="size-3 text-ink-faint" />
                          {m.stockItem.zone}/{m.stockItem.shelf}
                        </span>
                      </td>
                      <td className="px-4 py-3 align-middle text-right">
                        <span className="tnum text-ink">{String(m.quantity)}</span>
                        <span className="ml-1 font-data text-[10.5px] uppercase text-ink-faint">
                          {m.stockItem.part.unitOfMeasure}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
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
