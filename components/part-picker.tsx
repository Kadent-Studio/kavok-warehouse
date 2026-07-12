"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { trackingTypeLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";

export type PickedPart = {
  id: string;
  partNumber: string;
  description: string;
  trackingType: "serial" | "lot";
  unitOfMeasure: string;
  shelfLifeDays: number | null;
  category: "rotable" | "consumable" | "expendable";
};

export function PartPicker({
  value,
  onChange,
  autoFocus,
}: {
  value: PickedPart | null;
  onChange: (part: PickedPart | null) => void;
  autoFocus?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PickedPart[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      return;
    }
    const ctrl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/parts/search?q=${encodeURIComponent(query)}`,
          { signal: ctrl.signal },
        );
        const data: PickedPart[] = await res.json();
        setResults(data);
        setOpen(true);
      } catch {
        /* aborted */
      } finally {
        setLoading(false);
      }
    }, 220);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [query]);

  if (value) {
    return (
      <div className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 px-3 py-2.5">
        <Check className="size-4 shrink-0 text-primary" />
        <div className="min-w-0 flex-1">
          <p className="font-data text-[13.5px] font-medium text-ink truncate">
            {value.partNumber}
          </p>
          <p className="text-[12px] text-ink-muted truncate">
            {value.description}
          </p>
        </div>
        <span className="shrink-0 text-[11px] uppercase tracking-wider text-ink-faint">
          {trackingTypeLabel[value.trackingType]}
        </span>
        <button
          type="button"
          data-press
          onClick={() => {
            onChange(null);
            setQuery("");
          }}
          className="shrink-0 p-1 text-ink-faint hover:text-destructive rounded-md hover:bg-destructive/10 transition-colors"
          aria-label="Cambiar parte"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-ink-faint" />
      <Input
        value={query}
        autoFocus={autoFocus}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => results.length && setOpen(true)}
        placeholder="Buscar parte por P/N o descripción…"
        className="h-10 pl-8 text-[14px] font-data placeholder:font-sans"
        autoComplete="off"
      />
      {open && (query.trim().length >= 2) && (
        <div className="absolute z-20 mt-1 left-0 right-0 border border-border rounded-lg bg-popover shadow-md overflow-hidden max-h-72 overflow-y-auto">
          {loading && results.length === 0 ? (
            <p className="px-3 py-3 text-[12.5px] text-ink-faint">Buscando…</p>
          ) : results.length === 0 ? (
            <p className="px-3 py-3 text-[12.5px] text-ink-faint">
              Sin coincidencias. Crea la parte en el catálogo primero.
            </p>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                data-press
                onClick={() => {
                  onChange(r);
                  setOpen(false);
                }}
                className={cn(
                  "w-full text-left px-3 py-2.5 hover:bg-muted transition-colors",
                  "flex items-center justify-between gap-3 border-b border-border last:border-b-0",
                )}
              >
                <span className="min-w-0 flex-1">
                  <span className="font-data text-[13px] text-ink block truncate">
                    {r.partNumber}
                  </span>
                  <span className="text-[12px] text-ink-muted block truncate">
                    {r.description}
                  </span>
                </span>
                <span className="shrink-0 text-[10.5px] uppercase tracking-wider text-ink-faint">
                  {trackingTypeLabel[r.trackingType]}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
