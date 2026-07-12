"use client";

import {
  createContext,
  useContext,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

type NavCtx = {
  isPending: boolean;
  /** Set/clear a single param and reset pagination to page 1. */
  setParam: (key: string, value: string | null) => void;
  /** Jump to a page (page 1 drops the param). */
  goToPage: (page: number) => void;
  /** Replace the whole query string (used by "Limpiar todo"). */
  replaceAll: (next: URLSearchParams) => void;
  searchParams: URLSearchParams;
};

const Ctx = createContext<NavCtx | null>(null);

export function useStockNav() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStockNav debe usarse dentro de <StockNavProvider>");
  return ctx;
}

export function StockNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function replace(next: URLSearchParams) {
    const s = next.toString();
    startTransition(() => {
      router.replace(s ? `/stock?${s}` : "/stock");
    });
  }

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    next.delete("page"); // cualquier cambio de filtro vuelve a página 1
    replace(next);
  }

  function goToPage(page: number) {
    const next = new URLSearchParams(searchParams);
    if (page <= 1) next.delete("page");
    else next.set("page", String(page));
    replace(next);
  }

  return (
    <Ctx
      value={{
        isPending,
        setParam,
        goToPage,
        replaceAll: replace,
        searchParams: new URLSearchParams(searchParams),
      }}
    >
      {children}
    </Ctx>
  );
}

/** Envuelve la tabla (server) y muestra un overlay de carga en cualquier navegación. */
export function StockTableFrame({ children }: { children: ReactNode }) {
  const { isPending } = useStockNav();
  return (
    <div className="relative">
      <div
        className={cn(
          "transition-opacity duration-200",
          isPending && "pointer-events-none opacity-50",
        )}
        aria-busy={isPending}
      >
        {children}
      </div>
      {isPending && (
        <div className="pointer-events-none absolute inset-0 flex items-start justify-center pt-16">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-1.5 text-[12.5px] font-medium text-ink-muted elevated">
            <Loader2 className="size-3.5 animate-spin text-primary" />
            Cargando…
          </span>
        </div>
      )}
    </div>
  );
}
