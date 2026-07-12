"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ALL = "__all__";

type Props = {
  defaultQ: string;
  defaultCategory?: string;
  defaultTracking?: string;
  defaultArchived: boolean;
};

export function PartsFilters({
  defaultQ,
  defaultCategory,
  defaultTracking,
  defaultArchived,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(defaultQ);

  useEffect(() => {
    setQ(defaultQ);
  }, [defaultQ]);

  const category = defaultCategory ?? ALL;
  const tracking = defaultTracking ?? ALL;

  function push(next: URLSearchParams) {
    const s = next.toString();
    startTransition(() => {
      router.replace(s ? `/parts?${s}` : "/parts");
    });
  }

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(searchParams);
    if (value === null || value === "" || value === ALL) next.delete(key);
    else next.set(key, value);
    push(next);
  }

  function onSubmitSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setParam("q", q.trim() || null);
  }

  const activeFilters =
    (defaultCategory ? 1 : 0) + (defaultTracking ? 1 : 0) + (defaultArchived ? 1 : 0);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form onSubmit={onSubmitSearch} className="relative flex-1 min-w-[240px]">
        <Search
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-ink-faint"
          aria-hidden
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por P/N, descripción o fabricante"
          className={cn(
            "h-10 pl-8 pr-8 text-[14px]",
            "font-data placeholder:font-sans placeholder:text-ink-faint",
          )}
        />
        {q && (
          <button
            type="button"
            onClick={() => {
              setQ("");
              setParam("q", null);
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-faint hover:text-ink"
            aria-label="Limpiar búsqueda"
          >
            <X className="size-3.5" />
          </button>
        )}
      </form>

      <Select
        items={[
          { value: ALL, label: "Toda categoría" },
          { value: "rotable", label: "Rotable" },
          { value: "consumable", label: "Consumible" },
          { value: "expendable", label: "Expendible" },
        ]}
        value={category}
        onValueChange={(v) => setParam("category", !v || v === ALL ? null : v)}
      >
        <SelectTrigger className="min-w-[150px] h-10 text-[13.5px]" data-press>
          <SelectValue placeholder="Categoría" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Toda categoría</SelectItem>
          <SelectItem value="rotable">Rotable</SelectItem>
          <SelectItem value="consumable">Consumible</SelectItem>
          <SelectItem value="expendable">Expendible</SelectItem>
        </SelectContent>
      </Select>

      <Select
        items={[
          { value: ALL, label: "Todo tracking" },
          { value: "serial", label: "Por serial" },
          { value: "lot", label: "Por lote" },
        ]}
        value={tracking}
        onValueChange={(v) => setParam("tracking", !v || v === ALL ? null : v)}
      >
        <SelectTrigger className="min-w-[150px] h-10 text-[13.5px]" data-press>
          <SelectValue placeholder="Tracking" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todo tracking</SelectItem>
          <SelectItem value="serial">Por serial</SelectItem>
          <SelectItem value="lot">Por lote</SelectItem>
        </SelectContent>
      </Select>

      <Button
        type="button"
        variant={defaultArchived ? "default" : "outline"}
        size="sm"
        onClick={() => setParam("archived", defaultArchived ? null : "1")}
        data-press
        className="h-10 text-[13px]"
      >
        {defaultArchived ? "Incluye archivadas" : "Ocultar archivadas"}
      </Button>

      {activeFilters > 0 && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setQ("");
            push(new URLSearchParams());
          }}
          className="h-10 text-[12.5px] text-ink-muted"
          data-press
        >
          Limpiar filtros
        </Button>
      )}

      {isPending && (
        <span className="font-data text-[10.5px] uppercase tracking-widest text-ink-faint ml-auto">
          Filtrando…
        </span>
      )}
    </div>
  );
}
