"use client";

import { ChevronDown, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export type FilterOption = { value: string; label: string };

export function FilterMenu({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: FilterOption[];
  onChange: (v: string | null) => void;
}) {
  const active = value != null && value !== "";
  const current = active
    ? (options.find((o) => o.value === value)?.label ?? value)
    : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="outline"
            size="sm"
            data-press
            className={cn(
              "h-9 gap-1.5 rounded-full text-[13px]",
              active &&
                "border-primary/40 bg-primary/5 text-primary hover:bg-primary/10",
            )}
          >
            {label}
            {current && (
              <span className="font-medium">
                <span className="text-ink-faint/60 mx-0.5">·</span>
                {current}
              </span>
            )}
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        }
      />
      <DropdownMenuContent className="min-w-[180px]">
        <DropdownMenuRadioGroup
          value={value ?? ""}
          onValueChange={(v) => onChange(v || null)}
        >
          <DropdownMenuRadioItem value="">Todos</DropdownMenuRadioItem>
          {options.map((o) => (
            <DropdownMenuRadioItem key={o.value} value={o.value}>
              {o.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function FilterChip({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/25 bg-primary/5 pl-2.5 pr-1 py-1 text-[12px] font-medium text-primary">
      {label}
      <button
        type="button"
        onClick={onRemove}
        data-press
        className="rounded-sm p-0.5 hover:bg-primary/15 transition-colors"
        aria-label={`Quitar ${label}`}
      >
        <X className="size-3" />
      </button>
    </span>
  );
}
