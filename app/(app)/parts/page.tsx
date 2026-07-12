import Link from "next/link";
import { Plus, Download } from "lucide-react";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/empty-state";
import { partCategoryLabel, trackingTypeLabel } from "@/lib/labels";
import { PartsFilters } from "./parts-filters";

type SearchParams = {
  q?: string;
  category?: string;
  tracking?: string;
  archived?: string;
};

export default async function PartsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const category = sp.category;
  const tracking = sp.tracking;
  const includeArchived = sp.archived === "1";

  const where: Prisma.PartWhereInput = {
    ...(includeArchived ? {} : { archived: false }),
    ...(category && ["rotable", "consumable", "expendable"].includes(category)
      ? { category: category as Prisma.PartWhereInput["category"] }
      : {}),
    ...(tracking && ["serial", "lot"].includes(tracking)
      ? { trackingType: tracking as Prisma.PartWhereInput["trackingType"] }
      : {}),
    ...(q
      ? {
          OR: [
            { partNumber: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { manufacturer: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const parts = await prisma.part.findMany({
    where,
    orderBy: [{ archived: "asc" }, { partNumber: "asc" }],
    take: 500,
  });

  const totalActive = await prisma.part.count({ where: { archived: false } });

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <PageHeader
        eyebrow="03 · Catálogo"
        title="Partes"
        description={`Fichas maestras de part numbers. ${totalActive} activas.`}
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              data-press
              nativeButton={false}
              render={
                <Link href={`/parts/export${buildQuery(sp)}`}>
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
                <Link href="/parts/new">
                  <Plus className="size-3.5" />
                  Nueva parte
                </Link>
              }
            />
          </>
        }
      />

      <PartsFilters
        defaultQ={q}
        defaultCategory={category}
        defaultTracking={tracking}
        defaultArchived={includeArchived}
      />

      {parts.length === 0 ? (
        <EmptyState
          code="Sin resultados"
          title={q ? `Ninguna parte coincide con "${q}"` : "Catálogo vacío"}
          description={
            q
              ? "Ajusta filtros o revisa la ortografía. También puedes activar el filtro de archivados."
              : "Crea la primera ficha de parte para empezar a registrar stock."
          }
          action={
            !q && (
              <Button
                size="sm"
                data-press
                nativeButton={false}
                render={
                  <Link href="/parts/new">
                    <Plus className="size-3.5" />
                    Nueva parte
                  </Link>
                }
              />
            )
          }
        />
      ) : (
        <PartsTable parts={parts} />
      )}
    </div>
  );
}

function buildQuery(sp: SearchParams) {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.category) params.set("category", sp.category);
  if (sp.tracking) params.set("tracking", sp.tracking);
  if (sp.archived) params.set("archived", sp.archived);
  const s = params.toString();
  return s ? `?${s}` : "";
}

function PartsTable({
  parts,
}: {
  parts: Awaited<ReturnType<typeof prisma.part.findMany>>;
}) {
  return (
    <div className="rise-in border border-border rounded-xl overflow-hidden bg-card elevated">
      <div className="overflow-x-auto">
        <table className="w-full text-[14px]">
          <thead>
            <tr className="bg-muted/70 text-[11px] uppercase tracking-[0.1em] text-ink-faint border-b border-border">
              <th className="text-left font-semibold px-4 py-3.5">Part Number</th>
              <th className="text-left font-semibold px-4 py-3.5">Descripción</th>
              <th className="text-left font-semibold px-4 py-3.5">Fabricante</th>
              <th className="text-left font-semibold px-4 py-3.5">Categoría</th>
              <th className="text-left font-semibold px-4 py-3.5">Tracking</th>
              <th className="text-left font-semibold px-4 py-3.5">UoM</th>
              <th className="text-left font-semibold px-4 py-3.5">ATA</th>
              <th className="text-left font-semibold px-4 py-3.5">Vida útil</th>
            </tr>
          </thead>
          <tbody>
            {parts.map((p) => (
              <tr
                key={p.id}
                className="border-t border-border/70 first:border-t-0 hover:bg-accent/60 transition-colors"
              >
                <td className="px-4 py-3.5 align-middle">
                  <Link
                    href={`/parts/${p.id}`}
                    className="font-data text-[13.5px] font-medium text-ink hover:text-primary tracking-tight"
                  >
                    {p.partNumber}
                  </Link>
                  {p.archived && (
                    <span className="ml-2 text-[10.5px] uppercase tracking-wider text-ink-faint">
                      · archivada
                    </span>
                  )}
                </td>
                <td className="px-4 py-3.5 align-middle text-ink-muted max-w-[420px] truncate">
                  {p.description}
                </td>
                <td className="px-4 py-3.5 align-middle text-ink-muted">
                  {p.manufacturer}
                </td>
                <td className="px-4 py-3.5 align-middle">
                  {partCategoryLabel[p.category]}
                </td>
                <td className="px-4 py-3.5 align-middle text-ink-muted">
                  {trackingTypeLabel[p.trackingType]}
                </td>
                <td className="px-4 py-3.5 align-middle font-data text-[13px] text-ink-muted">
                  {p.unitOfMeasure}
                </td>
                <td className="px-4 py-3.5 align-middle font-data text-[13px] text-ink-muted">
                  {p.ataChapter ?? <span className="text-ink-faint">—</span>}
                </td>
                <td className="px-4 py-3.5 align-middle text-[13.5px] text-ink-muted tnum">
                  {p.shelfLifeDays != null ? (
                    `${p.shelfLifeDays} d`
                  ) : (
                    <span className="text-ink-faint">—</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
