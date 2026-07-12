"use client";

import { useState } from "react";
import { Search, X, SlidersHorizontal, PackageX, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FilterMenu, FilterChip, type FilterOption } from "@/components/filter-controls";
import { cn } from "@/lib/utils";
import { useStockNav } from "./stock-nav";

type Option = FilterOption;

const STATUS_OPTS: Option[] = [
  { value: "serviceable", label: "Serviciable" },
  { value: "unserviceable", label: "No serviciable" },
  { value: "scrap", label: "Scrap" },
];
const EXPIRY_OPTS: Option[] = [
  { value: "expired", label: "Vencidos" },
  { value: "soon", label: "Por vencer (30d)" },
];

type Props = {
  defaultQ: string;
  defaultStatus?: string;
  defaultZone?: string;
  defaultExpiry?: string;
  defaultDepleted: boolean;
  zones: string[];
};

export function StockFilters({
  defaultQ,
  defaultStatus,
  defaultZone,
  defaultExpiry,
  defaultDepleted,
  zones,
}: Props) {
  const { setParam, replaceAll, isPending } = useStockNav();
  const [q, setQ] = useState(defaultQ);

  // Resincroniza el input cuando la URL cambia externamente (p. ej. "Limpiar
  // todo"), sin useEffect — patrón de estado derivado durante el render.
  const [prevDefaultQ, setPrevDefaultQ] = useState(defaultQ);
  if (defaultQ !== prevDefaultQ) {
    setPrevDefaultQ(defaultQ);
    setQ(defaultQ);
  }

  const zoneOpts: Option[] = zones.map((z) => ({ value: z, label: z }));

  const chips: { key: string; label: string; onRemove: () => void }[] = [];
  if (defaultStatus)
    chips.push({
      key: "status",
      label: `Estado: ${labelOf(STATUS_OPTS, defaultStatus)}`,
      onRemove: () => setParam("status", null),
    });
  if (defaultZone)
    chips.push({
      key: "zone",
      label: `Zona: ${defaultZone}`,
      onRemove: () => setParam("zone", null),
    });
  if (defaultExpiry)
    chips.push({
      key: "expiry",
      label: labelOf(EXPIRY_OPTS, defaultExpiry),
      onRemove: () => setParam("expiry", null),
    });
  if (defaultDepleted)
    chips.push({
      key: "depleted",
      label: "Incluye agotados",
      onRemove: () => setParam("depleted", null),
    });

  return (
    <div className="space-y-3">
      {/* Toolbar */}
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
            placeholder="Buscar por P/N, serial, lote o descripción"
            className="h-9 rounded-full pl-8 pr-8 text-[14px] font-data placeholder:font-sans placeholder:text-ink-faint border-transparent bg-muted/50 focus-visible:bg-background"
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
          label="Estado"
          value={defaultStatus}
          options={STATUS_OPTS}
          onChange={(v) => setParam("status", v)}
        />
        {zoneOpts.length > 0 && (
          <FilterMenu
            label="Zona"
            value={defaultZone}
            options={zoneOpts}
            onChange={(v) => setParam("zone", v)}
          />
        )}
        <FilterMenu
          label="Vencimiento"
          value={defaultExpiry}
          options={EXPIRY_OPTS}
          onChange={(v) => setParam("expiry", v)}
        />

        <Button
          type="button"
          variant={defaultDepleted ? "secondary" : "ghost"}
          size="sm"
          onClick={() => setParam("depleted", defaultDepleted ? null : "1")}
          data-press
          className={cn(
            "h-9 gap-1.5 rounded-full text-[13px]",
            defaultDepleted && "text-ink",
          )}
        >
          <PackageX className="size-3.5" />
          Agotados
        </Button>

        {isPending && (
          <Loader2 className="ml-auto mr-1 size-4 animate-spin text-primary" />
        )}
      </div>

      {/* Active filter chips */}
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
              replaceAll(new URLSearchParams());
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

function labelOf(options: Option[], value: string) {
  return options.find((o) => o.value === value)?.label ?? value;
}
