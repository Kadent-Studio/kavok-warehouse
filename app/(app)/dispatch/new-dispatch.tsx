"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Trash2,
  Loader2,
  PackagePlus,
  MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { partCategoryLabel } from "@/lib/labels";
import { cn } from "@/lib/utils";
import {
  createDispatch,
  searchAvailableStock,
  type AvailableStockItem,
} from "./actions";

type Aircraft = { id: string; registration: string; model: string | null };
type Line = { item: AvailableStockItem; quantity: string };

const CATEGORY_ORDER = ["rotable", "consumable", "expendable"] as const;

export function NewDispatch({
  aircraft,
  operatorName,
}: {
  aircraft: Aircraft[];
  operatorName: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" data-press onClick={() => setOpen(true)}>
        <Plus className="size-3.5" />
        Nuevo despacho
      </Button>
      {open && (
        <DispatchDialog
          aircraft={aircraft}
          operatorName={operatorName}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

function DispatchDialog({
  aircraft,
  operatorName,
  onClose,
}: {
  aircraft: Aircraft[];
  operatorName: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [requestedBy, setRequestedBy] = useState("");
  const [deliveredBy, setDeliveredBy] = useState(operatorName);
  const [destinationType, setDestinationType] = useState<"aircraft" | "other">(
    aircraft.length > 0 ? "aircraft" : "other",
  );
  const [aircraftId, setAircraftId] = useState<string>(aircraft[0]?.id ?? "");
  const [destinationText, setDestinationText] = useState("");
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<Line[]>([]);

  function addLine(item: AvailableStockItem) {
    setLines((prev) =>
      prev.some((l) => l.item.id === item.id) ? prev : [...prev, { item, quantity: "1" }],
    );
  }
  function removeLine(id: string) {
    setLines((prev) => prev.filter((l) => l.item.id !== id));
  }
  function setLineQty(id: string, q: string) {
    setLines((prev) =>
      prev.map((l) => (l.item.id === id ? { ...l, quantity: q } : l)),
    );
  }

  const addedIds = new Set(lines.map((l) => l.item.id));

  const canSubmit =
    requestedBy.trim().length > 0 &&
    deliveredBy.trim().length > 0 &&
    lines.length > 0 &&
    (destinationType === "aircraft" ? !!aircraftId : destinationText.trim().length > 0) &&
    lines.every((l) => {
      const q = Number(l.quantity);
      return q > 0 && q <= l.item.quantity;
    });

  function submit() {
    startTransition(async () => {
      const r = await createDispatch({
        requestedBy,
        deliveredBy,
        destinationType,
        aircraftId: destinationType === "aircraft" ? aircraftId : undefined,
        destinationText: destinationType === "other" ? destinationText : undefined,
        notes,
        lines: lines.map((l) => ({
          stockItemId: l.item.id,
          quantity: Number(l.quantity),
        })),
      });
      if (r.ok) {
        toast.success("Despacho registrado");
        onClose();
        router.push(`/dispatch/${r.id}`);
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  // Group lines by part category for readable organization.
  const grouped = CATEGORY_ORDER.map((cat) => ({
    cat,
    items: lines.filter((l) => l.item.category === cat),
  })).filter((g) => g.items.length > 0);

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl gap-0 p-0 max-h-[88vh] flex flex-col overflow-hidden">
        <DialogHeader className="p-5 pb-4 pr-12 border-b border-border/60">
          <p className="font-data text-[10.5px] uppercase tracking-[0.16em] text-primary/60">
            04 · Despacho · Nuevo vale
          </p>
          <DialogTitle className="font-display text-[19px]">
            Registrar despacho
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-5 space-y-7">
          {/* ── Cabecera ─────────────────────────────── */}
          <section className="space-y-4">
            <SectionLabel code="A">Datos del vale</SectionLabel>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Solicitó *">
                <Input
                  value={requestedBy}
                  onChange={(e) => setRequestedBy(e.target.value)}
                  placeholder="Nombre del solicitante"
                  autoFocus
                />
              </Field>
              <Field label="Entregó *">
                <Input
                  value={deliveredBy}
                  onChange={(e) => setDeliveredBy(e.target.value)}
                  placeholder="Nombre de quien entrega"
                />
              </Field>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Tipo de destino *">
                <Select
                  items={DEST_OPTS}
                  value={destinationType}
                  onValueChange={(v) =>
                    v && setDestinationType(v as "aircraft" | "other")
                  }
                >
                  <SelectTrigger className="w-full" data-press>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {DEST_OPTS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Destino *">
                {destinationType === "aircraft" ? (
                  aircraft.length > 0 ? (
                    <Select
                      items={aircraft.map((a) => ({ value: a.id, label: a.registration }))}
                      value={aircraftId}
                      onValueChange={(v) => v && setAircraftId(v)}
                    >
                      <SelectTrigger className="w-full font-data" data-press>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {aircraft.map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            <span className="font-data">{a.registration}</span>
                            {a.model && (
                              <span className="text-ink-faint"> · {a.model}</span>
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-[12.5px] text-tag-uns-foreground">
                      No hay aeronaves activas. Agrégalas en «Aeronaves» o usa
                      destino «Otro».
                    </p>
                  )
                ) : (
                  <Input
                    value={destinationText}
                    onChange={(e) => setDestinationText(e.target.value)}
                    placeholder="Taller, cliente, ubicación…"
                  />
                )}
              </Field>
            </div>

            <Field label="Notas">
              <Input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Opcional"
              />
            </Field>
          </section>

          {/* ── Artículos ────────────────────────────── */}
          <section className="space-y-4">
            <SectionLabel code="B">Artículos</SectionLabel>
            <ArticleSearch addedIds={addedIds} onAdd={addLine} />

            {lines.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/80 bg-muted/40 py-8 px-4 text-center">
                <PackagePlus className="mx-auto size-5 text-ink-faint" />
                <p className="mt-2 text-[13px] text-ink-muted">
                  Busca una parte por P/N o descripción y añádela al vale.
                </p>
                <p className="mt-1 text-[11.5px] text-ink-faint">
                  Solo se muestran ítems serviciables con existencia.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {grouped.map((g) => (
                  <div key={g.cat} className="space-y-1.5">
                    <p className="font-data text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">
                      {partCategoryLabel[g.cat]}
                    </p>
                    <div className="rounded-lg border border-border overflow-hidden bg-card elevated">
                      {g.items.map((l, i) => (
                        <LineRow
                          key={l.item.id}
                          line={l}
                          first={i === 0}
                          onQty={(q) => setLineQty(l.item.id, q)}
                          onRemove={() => removeLine(l.item.id)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                <p className="text-[12px] text-ink-muted">
                  <span className="tnum font-medium text-ink">{lines.length}</span>{" "}
                  {lines.length === 1 ? "artículo" : "artículos"} en el vale.
                </p>
              </div>
            )}
          </section>
        </div>

        <DialogFooter className="m-0 rounded-none border-t border-border">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            data-press
          >
            Cancelar
          </Button>
          <Button size="sm" onClick={submit} disabled={isPending || !canSubmit} data-press>
            {isPending ? (
              <>
                <Loader2 className="size-3.5 animate-spin" />
                Registrando…
              </>
            ) : (
              "Registrar despacho"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const DEST_OPTS = [
  { value: "aircraft", label: "Aeronave" },
  { value: "other", label: "Otro" },
];

function ArticleSearch({
  addedIds,
  onAdd,
}: {
  addedIds: Set<string>;
  onAdd: (item: AvailableStockItem) => void;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AvailableStockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const reqId = useRef(0);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      const r = await searchAvailableStock(q);
      if (id === reqId.current) {
        setResults(r);
        setLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [query]);

  return (
    <div className="space-y-2">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar por P/N o descripción…"
          className="h-10 pl-9"
        />
        {loading && (
          <Loader2 className="absolute right-3 top-1/2 size-4 -translate-y-1/2 animate-spin text-ink-faint" />
        )}
      </div>

      {query.trim().length >= 2 && (
        <div className="rounded-lg border border-border bg-card overflow-hidden">
          {results.length === 0 && !loading ? (
            <p className="px-3 py-3 text-[13px] text-ink-muted">
              Sin ítems serviciables para «{query.trim()}».
            </p>
          ) : (
            <ul className="max-h-56 overflow-y-auto divide-y divide-border/70">
              {results.map((item) => {
                const added = addedIds.has(item.id);
                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      disabled={added}
                      onClick={() => onAdd(item)}
                      data-press
                      className={cn(
                        "flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors",
                        added ? "opacity-45 cursor-default" : "hover:bg-accent/60",
                      )}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-data text-[13px] text-ink truncate">
                          {item.partNumber}
                        </p>
                        <p className="text-[12px] text-ink-muted truncate">
                          {item.description}
                        </p>
                        <p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-ink-faint">
                          <MapPin className="size-3" />
                          <span className="font-data">
                            {item.zone}/{item.shelf}
                          </span>
                          {(item.serialNumber || item.lotNumber) && (
                            <span className="font-data">
                              · {item.serialNumber ?? item.lotNumber}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="tnum text-[13px] text-ink">
                          {item.quantity}
                          <span className="ml-1 font-data text-[10.5px] uppercase text-ink-faint">
                            {item.unitOfMeasure}
                          </span>
                        </p>
                        <p className="text-[11px] text-primary/70">
                          {added ? "Añadido" : "Añadir"}
                        </p>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

function LineRow({
  line,
  first,
  onQty,
  onRemove,
}: {
  line: Line;
  first: boolean;
  onQty: (q: string) => void;
  onRemove: () => void;
}) {
  const { item } = line;
  const isSerial = item.trackingType === "serial";
  const qty = Number(line.quantity);
  const invalid = !(qty > 0 && qty <= item.quantity);

  return (
    <div
      className={cn(
        "flex items-center gap-3 px-3 py-2.5",
        !first && "border-t border-border/70",
      )}
    >
      <div className="min-w-0 flex-1">
        <p className="font-data text-[13px] text-ink truncate">{item.partNumber}</p>
        <p className="text-[11.5px] text-ink-faint truncate">
          {item.description} · <span className="font-data">{item.zone}/{item.shelf}</span>
        </p>
      </div>

      <div className="shrink-0 flex items-center gap-1.5">
        <Input
          type="number"
          min={0}
          step="any"
          value={line.quantity}
          disabled={isSerial}
          onChange={(e) => onQty(e.target.value)}
          aria-invalid={invalid}
          className="h-8 w-20 font-data tnum text-right"
        />
        <span className="w-8 font-data text-[10.5px] uppercase text-ink-faint">
          {item.unitOfMeasure}
        </span>
      </div>

      <span className="shrink-0 w-16 text-right text-[11px] text-ink-faint tnum">
        de {item.quantity}
      </span>

      <Button
        variant="ghost"
        size="icon-sm"
        data-press
        onClick={onRemove}
        aria-label="Quitar"
        className="shrink-0 text-ink-faint hover:text-destructive"
      >
        <Trash2 className="size-3.5" />
      </Button>
    </div>
  );
}

function SectionLabel({ code, children }: { code: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2">
      <span className="flex size-5 items-center justify-center rounded bg-primary/10 font-data text-[10.5px] font-semibold text-primary">
        {code}
      </span>
      <span className="font-display text-[15px] font-semibold text-ink">
        {children}
      </span>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11.5px] uppercase tracking-[0.12em] text-ink-muted font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}
