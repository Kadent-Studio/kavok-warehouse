"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import type { DateRange } from "react-day-picker";
import { Input } from "@/components/ui/input";
import { FilterMenu, FilterChip, type FilterOption } from "@/components/filter-controls";
import { DateRangePicker } from "@/components/date-range-picker";

const TYPE_OPTS: FilterOption[] = [
  { value: "initial_stock", label: "Inventario inicial" },
  { value: "receipt", label: "Recepción" },
  { value: "dispatch", label: "Salida" },
  { value: "transfer", label: "Transferencia" },
  { value: "status_change", label: "Cambio de estado" },
];

export function MovementsFilters({
  defaultQ,
  defaultType,
  defaultFrom,
  defaultTo,
}: {
  defaultQ: string;
  defaultType?: string;
  defaultFrom?: string;
  defaultTo?: string;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(defaultQ);

  useEffect(() => {
    setQ(defaultQ);
  }, [defaultQ]);

  function push(next: URLSearchParams) {
    const s = next.toString();
    startTransition(() => {
      router.replace(s ? `/movements?${s}` : "/movements");
    });
  }

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (!value) next.delete(key);
    else next.set(key, value);
    push(next);
  }

  function setRange(range: DateRange | undefined) {
    const next = new URLSearchParams(searchParams);
    if (range?.from) next.set("from", format(range.from, "yyyy-MM-dd"));
    else next.delete("from");
    if (range?.to) next.set("to", format(range.to, "yyyy-MM-dd"));
    else next.delete("to");
    push(next);
  }

  const range: DateRange | undefined = defaultFrom
    ? {
        from: new Date(`${defaultFrom}T12:00:00`),
        to: defaultTo ? new Date(`${defaultTo}T12:00:00`) : undefined,
      }
    : undefined;

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (defaultType)
    chips.push({
      key: "type",
      label: `Tipo: ${TYPE_OPTS.find((o) => o.value === defaultType)?.label ?? defaultType}`,
      onRemove: () => setParam("type", null),
    });
  if (defaultFrom || defaultTo)
    chips.push({
      key: "range",
      label: `Fechas: ${defaultFrom ?? "…"} → ${defaultTo ?? "…"}`,
      onRemove: () => setRange(undefined),
    });

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 elevated">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setParam("q", q.trim() || null);
          }}
          className="relative flex-1 min-w-[220px]"
        >
          <Search className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-faint" />
          <Input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por P/N, serial, destino, proveedor…"
            className="h-9 pl-8 pr-8 text-[14px] font-data placeholder:font-sans placeholder:text-ink-faint border-transparent bg-muted/50 focus-visible:bg-background"
          />
          {q && (
            <button
              type="button"
              onClick={() => {
                setQ("");
                setParam("q", null);
              }}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
              aria-label="Limpiar"
            >
              <X className="size-3.5" />
            </button>
          )}
        </form>

        <div className="h-5 w-px bg-border mx-0.5 hidden sm:block" />

        <FilterMenu
          label="Tipo"
          value={defaultType}
          options={TYPE_OPTS}
          onChange={(v) => setParam("type", v)}
        />

        <DateRangePicker value={range} onChange={setRange} />

        {isPending && (
          <span className="font-data text-[10.5px] uppercase tracking-widest text-ink-faint ml-auto pr-1">
            Filtrando…
          </span>
        )}
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          <SlidersHorizontal className="size-3.5 text-ink-faint mr-0.5" />
          {chips.map((c) => (
            <FilterChip key={c.key} label={c.label} onRemove={c.onRemove} />
          ))}
          <button
            type="button"
            onClick={() => {
              setQ("");
              push(new URLSearchParams());
            }}
            className="text-[12px] text-ink-muted hover:text-ink underline underline-offset-2 ml-1"
          >
            Limpiar todo
          </button>
        </div>
      )}
    </div>
  );
}
