"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addAlternate, removeAlternate } from "../actions";

type Alt = {
  id: string;
  partNumber: string;
  description: string;
  manufacturer: string;
};

type SearchResult = { id: string; partNumber: string; description: string };

export function AlternatesPanel({
  partId,
  currentPartNumber,
  alternates,
}: {
  partId: string;
  currentPartNumber: string;
  alternates: Alt[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  async function search(q: string) {
    setQuery(q);
    if (q.trim().length < 2) {
      setResults([]);
      return;
    }
    setSearching(true);
    try {
      const res = await fetch(
        `/api/parts/search?q=${encodeURIComponent(q)}&exclude=${partId}`,
      );
      const data: SearchResult[] = await res.json();
      setResults(data);
    } finally {
      setSearching(false);
    }
  }

  function add(altId: string) {
    startTransition(async () => {
      const r = await addAlternate(partId, altId);
      if (r.ok) {
        toast.success("Alternativa vinculada");
        setQuery("");
        setResults([]);
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  function remove(altId: string) {
    startTransition(async () => {
      await removeAlternate(partId, altId);
      toast.success("Alternativa desvinculada");
      router.refresh();
    });
  }

  return (
    <section className="border border-border rounded-xl bg-card elevated overflow-hidden">
      <header className="border-b border-border/70 px-4 py-3.5 bg-muted/30">
        <p className="font-data text-[10.5px] uppercase tracking-[0.16em] text-primary/60">
          Sección D
        </p>
        <h3 className="font-display text-[14px] font-semibold text-ink tracking-tight">
          Partes alternas
        </h3>
        <p className="text-[11.5px] text-ink-muted mt-1 leading-relaxed">
          Partes intercambiables con{" "}
          <span className="font-data text-ink">{currentPartNumber}</span>. La
          vinculación es bidireccional.
        </p>
      </header>

      <div className="p-4 space-y-3">
        <div className="relative">
          <Input
            value={query}
            onChange={(e) => search(e.target.value)}
            placeholder="Buscar P/N o descripción…"
            className="h-8 text-[12.5px] font-data placeholder:font-sans"
          />
          {results.length > 0 && (
            <div className="absolute z-10 mt-1 left-0 right-0 border border-border rounded-md bg-popover shadow-md overflow-hidden">
              {results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => add(r.id)}
                  disabled={isPending}
                  className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center justify-between gap-3 border-b border-border last:border-b-0"
                  data-press
                >
                  <span className="flex-1 min-w-0">
                    <span className="font-data text-[12px] text-ink block truncate">
                      {r.partNumber}
                    </span>
                    <span className="text-[11.5px] text-ink-muted block truncate">
                      {r.description}
                    </span>
                  </span>
                  <Plus className="size-3.5 text-ink-faint shrink-0" />
                </button>
              ))}
            </div>
          )}
          {searching && (
            <p className="mt-1 font-data text-[10px] uppercase tracking-widest text-ink-faint">
              Buscando…
            </p>
          )}
        </div>

        {alternates.length === 0 ? (
          <p className="text-[11.5px] text-ink-faint text-center py-4">
            Ninguna alternativa vinculada.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {alternates.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between gap-2 border border-border rounded-sm px-2.5 py-2 hover:bg-muted/40 transition-colors"
              >
                <Link
                  href={`/parts/${a.id}`}
                  className="flex-1 min-w-0 hover:text-navy"
                >
                  <span className="font-data text-[12px] text-ink block truncate">
                    {a.partNumber}
                  </span>
                  <span className="text-[11px] text-ink-muted block truncate">
                    {a.description}
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => remove(a.id)}
                  disabled={isPending}
                  className="p-1 text-ink-faint hover:text-destructive rounded-sm hover:bg-destructive/10 transition-colors"
                  data-press
                  aria-label="Quitar alternativa"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
