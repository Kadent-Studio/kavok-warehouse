"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { useStockNav } from "./stock-nav";

type CategoryCounts = {
  all: number;
  rotable: number;
  consumable: number;
  expendable: number;
};

const TABS: { value: keyof CategoryCounts; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "rotable", label: "Rotables" },
  { value: "consumable", label: "Consumibles" },
  { value: "expendable", label: "Expendibles" },
];

export function StockCategoryTabs({
  active,
  counts,
}: {
  active?: string;
  counts: CategoryCounts;
}) {
  const { setParam } = useStockNav();
  const current = active ?? "all";

  return (
    <Tabs
      value={current}
      onValueChange={(v) => v && setParam("category", v === "all" ? null : v)}
      className="gap-0"
    >
      <TabsList
        variant="line"
        className="h-auto gap-5 border-b border-border p-0"
      >
        {TABS.map((t) => (
          <TabsTrigger
            key={t.value}
            value={t.value}
            data-press
            className="h-auto rounded-none px-0 pb-2.5 text-[14px] text-ink-muted after:bottom-[-1px] after:bg-primary hover:text-ink data-active:text-ink"
          >
            {t.label}
            <span
              className={cn(
                "tnum ml-0.5 text-[11.5px] tabular-nums",
                current === t.value ? "text-primary" : "text-ink-faint",
              )}
            >
              {counts[t.value]}
            </span>
          </TabsTrigger>
        ))}
      </TabsList>
    </Tabs>
  );
}
