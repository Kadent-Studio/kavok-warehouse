"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PartPicker, type PickedPart } from "@/components/part-picker";
import { FormSection, Field, FieldHint } from "@/components/form-parts";
import { computeExpiration, formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { createStockEntry } from "../actions";

type EntryType = "receipt" | "initial_stock";

const STATUS_OPTIONS = [
  { value: "serviceable", label: "Serviciable" },
  { value: "unserviceable", label: "No serviciable" },
  { value: "scrap", label: "Scrap" },
];

export function StockEntryForm({ today }: { today: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [type, setType] = useState<EntryType>("receipt");
  const [part, setPart] = useState<PickedPart | null>(null);
  const [serialNumber, setSerialNumber] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [zone, setZone] = useState("");
  const [shelf, setShelf] = useState("");
  const [status, setStatus] = useState("serviceable");
  const [receiptDate, setReceiptDate] = useState(today);
  const [supplier, setSupplier] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");
  const [notes, setNotes] = useState("");

  const isSerial = part?.trackingType === "serial";

  function resetItemFields() {
    setPart(null);
    setSerialNumber("");
    setLotNumber("");
    setQuantity("1");
    setNotes("");
    // keep zone/shelf/status/date/supplier for fast repeated entry
  }

  function submit(again: boolean) {
    if (!part) {
      toast.error("Selecciona una parte");
      return;
    }
    const payload = {
      type,
      partId: part.id,
      serialNumber: isSerial ? serialNumber : undefined,
      lotNumber: !isSerial ? lotNumber : undefined,
      quantity: isSerial ? 1 : Number(quantity),
      zone,
      shelf,
      status,
      receiptDate,
      supplier: type === "receipt" ? supplier : undefined,
      referenceNumber: type === "receipt" ? referenceNumber : undefined,
      notes,
    };

    startTransition(async () => {
      const result = await createStockEntry(payload);
      if (result.ok) {
        if (again) {
          toast.success("Registrado. Listo para el siguiente.");
          resetItemFields();
        } else {
          toast.success("Ítem registrado en stock");
          router.push(`/stock/${result.id}`);
          router.refresh();
        }
      } else {
        toast.error(result.error);
      }
    });
  }

  const expiryPreview =
    part?.shelfLifeDays != null && receiptDate
      ? formatDate(
          computeExpiration(
            new Date(`${receiptDate}T12:00:00.000Z`),
            part.shelfLifeDays,
          ),
        )
      : null;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit(false);
      }}
      className="space-y-8"
    >
      <FormSection
        code="A"
        title="Tipo y parte"
        description="Qué estás registrando y de qué part number."
      >
        <Field label="Tipo de entrada" required span={2}>
          <div className="grid grid-cols-2 gap-2">
            <TypeCard
              active={type === "receipt"}
              onClick={() => setType("receipt")}
              title="Recepción"
              hint="Compra o ingreso nuevo con proveedor / documento."
            />
            <TypeCard
              active={type === "initial_stock"}
              onClick={() => setType("initial_stock")}
              title="Inventario inicial"
              hint="Carga de existencia que ya estaba en el almacén."
            />
          </div>
        </Field>

        <Field label="Parte" required span={2}>
          <PartPicker value={part} onChange={setPart} />
          {part && (
            <FieldHint>
              {isSerial
                ? "Parte por serial: se registra una unidad con su serial único."
                : "Parte por lote: indica cantidad y (opcional) número de lote."}
              {part.shelfLifeDays != null &&
                ` Vida útil ${part.shelfLifeDays} días.`}
            </FieldHint>
          )}
        </Field>
      </FormSection>

      {part && (
        <>
          <FormSection
            code="B"
            title="Identificación y cantidad"
            description="Serial o lote, y cuánto ingresa."
          >
            {isSerial ? (
              <Field label="Número de serial" required htmlFor="serial" span={2}>
                <Input
                  id="serial"
                  value={serialNumber}
                  onChange={(e) => setSerialNumber(e.target.value.toUpperCase())}
                  required
                  autoComplete="off"
                  className="font-data uppercase"
                  placeholder="SN-XXXX"
                />
              </Field>
            ) : (
              <>
                <Field label="Número de lote" htmlFor="lot">
                  <Input
                    id="lot"
                    value={lotNumber}
                    onChange={(e) => setLotNumber(e.target.value.toUpperCase())}
                    autoComplete="off"
                    className="font-data uppercase"
                    placeholder="Opcional"
                  />
                </Field>
                <Field label="Cantidad" required htmlFor="qty">
                  <div className="flex items-center gap-2">
                    <Input
                      id="qty"
                      type="number"
                      min={0}
                      step="any"
                      value={quantity}
                      onChange={(e) => setQuantity(e.target.value)}
                      required
                      className="font-data tnum"
                    />
                    <span className="text-[12px] uppercase text-ink-faint font-data shrink-0">
                      {part.unitOfMeasure}
                    </span>
                  </div>
                </Field>
              </>
            )}
          </FormSection>

          <FormSection
            code="C"
            title="Ubicación y estado"
            description="Dónde queda y en qué condición ingresa."
          >
            <Field label="Zona" required htmlFor="zone">
              <Input
                id="zone"
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                required
                placeholder="Ej. Rotables, Consumibles, Recibo"
              />
            </Field>
            <Field label="Estante" required htmlFor="shelf">
              <Input
                id="shelf"
                value={shelf}
                onChange={(e) => setShelf(e.target.value)}
                required
                className="font-data"
                placeholder="Ej. A-3"
              />
            </Field>
            <Field label="Estado inicial" required htmlFor="status">
              <Select
                items={STATUS_OPTIONS}
                value={status}
                onValueChange={(v) => v && setStatus(v)}
              >
                <SelectTrigger id="status" data-press>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Fecha de recepción" required htmlFor="receiptDate">
              <Input
                id="receiptDate"
                type="date"
                value={receiptDate}
                onChange={(e) => setReceiptDate(e.target.value)}
                required
                className="font-data tnum"
              />
              {expiryPreview && (
                <FieldHint>Vencerá el {expiryPreview}.</FieldHint>
              )}
            </Field>
          </FormSection>

          {type === "receipt" && (
            <FormSection
              code="D"
              title="Documento"
              description="Trazabilidad de la recepción."
            >
              <Field label="Proveedor" htmlFor="supplier">
                <Input
                  id="supplier"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Nombre del proveedor"
                />
              </Field>
              <Field label="Referencia / OC" htmlFor="reference">
                <Input
                  id="reference"
                  value={referenceNumber}
                  onChange={(e) => setReferenceNumber(e.target.value)}
                  className="font-data"
                  placeholder="N° orden de compra / documento"
                />
              </Field>
            </FormSection>
          )}

          <FormSection code="E" title="Notas" description="Observaciones opcionales.">
            <Field label="Notas" htmlFor="notes" span={2}>
              <Input
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Cualquier detalle relevante"
              />
            </Field>
          </FormSection>
        </>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/70">
        <p className="text-[11.5px] text-ink-faint">
          <span className="font-data uppercase tracking-widest">Nota</span>
          <span className="mx-2 text-ink-faint/50">·</span>
          El vencimiento se calcula desde la vida útil de la parte.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            data-press
            disabled={isPending}
            nativeButton={false}
            render={<Link href="/stock">Cancelar</Link>}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-press
            disabled={isPending || !part}
            onClick={() => submit(true)}
          >
            Guardar y agregar otro
          </Button>
          <Button
            type="submit"
            size="sm"
            data-press
            disabled={isPending || !part}
          >
            {isPending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function TypeCard({
  active,
  onClick,
  title,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  title: string;
  hint: string;
}) {
  return (
    <button
      type="button"
      data-press
      onClick={onClick}
      className={cn(
        "text-left rounded-lg border p-3 transition-colors",
        active
          ? "border-primary/50 bg-primary/5 ring-1 ring-primary/20"
          : "border-border hover:bg-muted/60",
      )}
    >
      <p
        className={cn(
          "text-[13.5px] font-semibold",
          active ? "text-primary" : "text-ink",
        )}
      >
        {title}
      </p>
      <p className="text-[11.5px] text-ink-muted mt-0.5 leading-snug">{hint}</p>
    </button>
  );
}
