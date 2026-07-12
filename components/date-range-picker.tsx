"use client";

import { useState } from "react";
import { CalendarRange, X } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import type { DateRange } from "react-day-picker";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Rango de fechas",
}: {
  value: DateRange | undefined;
  onChange: (range: DateRange | undefined) => void;
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const active = !!value?.from;

  const label = active
    ? value?.to
      ? `${format(value.from!, "dd MMM", { locale: es })} — ${format(value.to, "dd MMM yy", { locale: es })}`
      : format(value.from!, "dd MMM yy", { locale: es })
    : placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            data-press
            className={cn(
              "h-9 gap-1.5 text-[13px]",
              active &&
                "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10",
            )}
          >
            <CalendarRange className="size-3.5 opacity-70" />
            <span className={active ? "font-medium capitalize" : ""}>{label}</span>
            {active && (
              <span
                role="button"
                tabIndex={0}
                aria-label="Limpiar fechas"
                className="rounded-sm p-0.5 -mr-1 hover:bg-primary/15 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  onChange(undefined);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.stopPropagation();
                    onChange(undefined);
                  }
                }}
              >
                <X className="size-3" />
              </span>
            )}
          </Button>
        }
      />
      <PopoverContent
        align="start"
        className="w-auto p-0"
      >
        <Calendar
          mode="range"
          locale={es}
          numberOfMonths={2}
          defaultMonth={value?.from}
          selected={value}
          onSelect={onChange}
          autoFocus
        />
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <button
            type="button"
            className="text-[12px] text-ink-muted hover:text-ink"
            onClick={() => onChange(undefined)}
          >
            Limpiar
          </button>
          <Button size="sm" data-press onClick={() => setOpen(false)}>
            Listo
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
