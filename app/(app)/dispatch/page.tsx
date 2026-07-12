import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { formatDateTime } from "@/lib/dates";
import { destinationLabel, formatFolio } from "@/lib/dispatch";
import { destinationTypeLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import { NewDispatch } from "./new-dispatch";

export const metadata = { title: "Despacho" };

export default async function DispatchPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [orders, aircraft] = await Promise.all([
    prisma.dispatchOrder.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        number: true,
        requestedBy: true,
        deliveredBy: true,
        destinationType: true,
        destinationText: true,
        createdAt: true,
        aircraft: { select: { registration: true } },
        user: { select: { fullName: true } },
        _count: { select: { movements: true } },
      },
    }),
    prisma.aircraft.findMany({
      where: { active: true },
      orderBy: { registration: "asc" },
      select: { id: true, registration: true, model: true },
    }),
  ]);

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-6xl">
      <PageHeader
        eyebrow="04 · Despacho"
        title="Despacho"
        description="Vales de salida de material: solicitante, quién entregó y destino."
        actions={
          <NewDispatch
            aircraft={aircraft}
            operatorName={session.user.name ?? session.user.username}
          />
        }
      />

      {orders.length === 0 ? (
        <EmptyState
          code="04 · Sin despachos"
          title="Todavía no hay despachos"
          description="Registra la primera salida de material con el botón «Nuevo despacho»."
        />
      ) : (
        <div className="rise-in border border-border rounded-xl overflow-hidden bg-card elevated">
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="bg-muted/70 text-[11px] uppercase tracking-[0.1em] text-ink-faint border-b border-border">
                  <th className="text-left font-semibold px-4 py-3.5">Folio</th>
                  <th className="text-left font-semibold px-4 py-3.5">Fecha</th>
                  <th className="text-left font-semibold px-4 py-3.5">Destino</th>
                  <th className="text-left font-semibold px-4 py-3.5">Solicitó</th>
                  <th className="text-left font-semibold px-4 py-3.5">Entregó</th>
                  <th className="text-right font-semibold px-4 py-3.5">Ítems</th>
                  <th className="text-left font-semibold px-4 py-3.5">Registró</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="border-t border-border/70 first:border-t-0 hover:bg-accent/60 transition-colors"
                  >
                    <td className="px-4 py-3 align-middle">
                      <Link
                        href={`/dispatch/${o.id}`}
                        className="font-data text-[13.5px] text-ink hover:text-primary transition-colors"
                      >
                        {formatFolio(o.number)}
                      </Link>
                    </td>
                    <td className="px-4 py-3 align-middle text-ink-muted text-[13px] tnum whitespace-nowrap">
                      {formatDateTime(o.createdAt)}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span className="text-ink">
                        {destinationLabel({
                          destinationType: o.destinationType,
                          aircraft: o.aircraft,
                          destinationText: o.destinationText,
                        })}
                      </span>
                      <span
                        className={cn(
                          "ml-2 inline-flex items-center rounded-md px-1.5 py-0.5 text-[10.5px] font-medium align-middle",
                          o.destinationType === "aircraft"
                            ? "bg-primary/10 text-primary"
                            : "bg-accent text-ink-muted",
                        )}
                      >
                        {destinationTypeLabel[o.destinationType]}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle text-ink">
                      {o.requestedBy}
                    </td>
                    <td className="px-4 py-3 align-middle text-ink-muted">
                      {o.deliveredBy}
                    </td>
                    <td className="px-4 py-3 align-middle text-right tnum text-ink">
                      {o._count.movements}
                    </td>
                    <td className="px-4 py-3 align-middle text-ink-muted text-[13px]">
                      {o.user.fullName}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
