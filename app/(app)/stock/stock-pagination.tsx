"use client";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useStockNav } from "./stock-nav";

export function StockPagination({
  page,
  perPage,
  total,
}: {
  page: number;
  perPage: number;
  total: number;
}) {
  const { goToPage, isPending, searchParams } = useStockNav();
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const current = Math.min(page, totalPages);
  const from = total === 0 ? 0 : (current - 1) * perPage + 1;
  const to = Math.min(current * perPage, total);

  function hrefFor(p: number) {
    const next = new URLSearchParams(searchParams);
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    const s = next.toString();
    return s ? `/stock?${s}` : "/stock";
  }

  function go(e: React.MouseEvent, p: number) {
    e.preventDefault();
    if (p === current || isPending) return;
    goToPage(p);
  }

  return (
    <div className="flex flex-col-reverse items-center justify-between gap-3 sm:flex-row">
      <p className="text-[13px] text-ink-muted tnum">
        Mostrando <span className="text-ink font-medium">{from}</span>–
        <span className="text-ink font-medium">{to}</span> de{" "}
        <span className="text-ink font-medium">{total}</span> ítems
      </p>

      {totalPages > 1 && (
        <Pagination className="mx-0 w-auto justify-end">
          <PaginationContent
            data-busy={isPending}
            className="data-[busy=true]:pointer-events-none data-[busy=true]:opacity-60"
          >
            <PaginationItem>
              <PaginationPrevious
                text="Anterior"
                href={hrefFor(current - 1)}
                aria-disabled={current <= 1}
                className={current <= 1 ? "pointer-events-none opacity-40" : ""}
                onClick={(e) => go(e, current - 1)}
              />
            </PaginationItem>

            {pageWindow(current, totalPages).map((p, i) =>
              p === "…" ? (
                <PaginationItem key={`gap-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    href={hrefFor(p)}
                    isActive={p === current}
                    onClick={(e) => go(e, p)}
                    className="tnum"
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                text="Siguiente"
                href={hrefFor(current + 1)}
                aria-disabled={current >= totalPages}
                className={
                  current >= totalPages ? "pointer-events-none opacity-40" : ""
                }
                onClick={(e) => go(e, current + 1)}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}

/** Ventana compacta de páginas: 1 … 4 5 [6] 7 8 … 20 */
function pageWindow(current: number, total: number): (number | "…")[] {
  const pages = new Set<number>([1, total, current, current - 1, current + 1]);
  const sorted = [...pages]
    .filter((p) => p >= 1 && p <= total)
    .sort((a, b) => a - b);

  const out: (number | "…")[] = [];
  let prev = 0;
  for (const p of sorted) {
    if (p - prev > 1) out.push("…");
    out.push(p);
    prev = p;
  }
  return out;
}
