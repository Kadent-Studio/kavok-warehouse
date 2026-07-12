"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import type { Part } from "@prisma/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { createPart, updatePart } from "./actions";

type Mode = "create" | "edit";

type Props =
  | { mode: "create"; part?: undefined }
  | { mode: "edit"; part: Part };

const CATEGORY_OPTIONS = [
  { value: "rotable", label: "Rotable" },
  { value: "consumable", label: "Consumible" },
  { value: "expendable", label: "Expendible" },
];

const TRACKING_OPTIONS = [
  { value: "serial", label: "Por serial" },
  { value: "lot", label: "Por lote" },
];

const UOM_HINTS = ["EA", "KG", "L", "M", "PZ", "GAL", "OZ"];

export function PartForm({ mode, part }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [partNumber, setPartNumber] = useState(part?.partNumber ?? "");
  const [description, setDescription] = useState(part?.description ?? "");
  const [manufacturer, setManufacturer] = useState(part?.manufacturer ?? "");
  const [unitOfMeasure, setUnitOfMeasure] = useState(part?.unitOfMeasure ?? "EA");
  const [category, setCategory] = useState<string>(part?.category ?? "rotable");
  const [trackingType, setTrackingType] = useState<string>(
    part?.trackingType ?? "serial",
  );
  const [ataChapter, setAtaChapter] = useState(part?.ataChapter ?? "");
  const [shelfLifeDays, setShelfLifeDays] = useState<string>(
    part?.shelfLifeDays != null ? String(part.shelfLifeDays) : "",
  );

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const payload = {
      partNumber,
      description,
      manufacturer,
      unitOfMeasure,
      category,
      trackingType,
      ataChapter: ataChapter || undefined,
      shelfLifeDays: shelfLifeDays === "" ? undefined : Number(shelfLifeDays),
    };

    startTransition(async () => {
      if (mode === "create") {
        const result = await createPart(payload);
        if (result.ok) {
          toast.success("Parte creada");
          router.push(`/parts/${result.id}`);
          router.refresh();
        } else {
          toast.error(result.error);
        }
      } else {
        const result = await updatePart(part.id, payload);
        if (result.ok) {
          toast.success("Cambios guardados");
          router.refresh();
        } else {
          toast.error(result.error);
        }
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <Section
        code="A"
        title="Identidad"
        description="Cómo el fabricante identifica esta parte."
      >
        <Field label="Part Number" required htmlFor="partNumber" span={2}>
          <Input
            id="partNumber"
            value={partNumber}
            onChange={(e) => setPartNumber(e.target.value.toUpperCase())}
            required
            autoComplete="off"
            autoCapitalize="characters"
            className="font-data text-[13.5px] tracking-tight uppercase"
            placeholder="Ej. 3214-B-01"
          />
        </Field>

        <Field label="Descripción" required htmlFor="description" span={2}>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            placeholder="Nombre técnico tal como aparece en la placa/manual"
          />
        </Field>

        <Field label="Fabricante" required htmlFor="manufacturer">
          <Input
            id="manufacturer"
            value={manufacturer}
            onChange={(e) => setManufacturer(e.target.value)}
            required
            placeholder="Honeywell, Boeing, Airbus..."
          />
        </Field>

        <Field label="Capítulo ATA" htmlFor="ataChapter">
          <Input
            id="ataChapter"
            value={ataChapter}
            onChange={(e) => setAtaChapter(e.target.value)}
            placeholder="Ej. 32 (Landing Gear)"
            className="font-data"
            maxLength={16}
          />
        </Field>
      </Section>

      <Section
        code="B"
        title="Clasificación"
        description="Determina cómo se gestiona en almacén."
      >
        <Field label="Categoría" required htmlFor="category">
          <Select
            items={CATEGORY_OPTIONS}
            value={category}
            onValueChange={(v) => v && setCategory(v)}
          >
            <SelectTrigger id="category" data-press>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field label="Tipo de tracking" required htmlFor="trackingType">
          <Select
            items={TRACKING_OPTIONS}
            value={trackingType}
            onValueChange={(v) => v && setTrackingType(v)}
          >
            <SelectTrigger id="trackingType" data-press>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRACKING_OPTIONS.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FieldHint>
            {trackingType === "serial"
              ? "Cada unidad se registra con su serial único (típico de rotables)."
              : "Se agrupan por lote (típico de consumibles y tornillería)."}
          </FieldHint>
        </Field>

        <Field label="Unidad de medida" required htmlFor="unitOfMeasure">
          <Input
            id="unitOfMeasure"
            value={unitOfMeasure}
            onChange={(e) => setUnitOfMeasure(e.target.value.toUpperCase())}
            required
            className="font-data uppercase"
            list="uom-suggestions"
            maxLength={16}
          />
          <datalist id="uom-suggestions">
            {UOM_HINTS.map((u) => (
              <option key={u} value={u} />
            ))}
          </datalist>
        </Field>

        <Field label="Vida útil (días)" htmlFor="shelfLifeDays">
          <Input
            id="shelfLifeDays"
            type="number"
            min={0}
            step={1}
            value={shelfLifeDays}
            onChange={(e) => setShelfLifeDays(e.target.value)}
            placeholder="Vacío = sin vencimiento"
            className="font-data tabular-nums"
          />
          <FieldHint>
            Días desde la recepción hasta el vencimiento. Se calcula por ítem.
          </FieldHint>
        </Field>
      </Section>

      <div className="flex items-center justify-between pt-4 border-t border-border/70">
        <p className="text-[11.5px] text-ink-faint">
          <span className="font-data uppercase tracking-widest">Nota</span>
          <span className="mx-2 text-ink-faint/50">·</span>
          Los part numbers se almacenan en mayúsculas.
        </p>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            data-press
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            data-press
            disabled={isPending}
            nativeButton={false}
            render={<Link href="/parts">Volver al listado</Link>}
          />
          <Button type="submit" size="sm" data-press disabled={isPending}>
            {isPending
              ? mode === "create"
                ? "Creando..."
                : "Guardando..."
              : mode === "create"
                ? "Crear parte"
                : "Guardar cambios"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Section({
  code,
  title,
  description,
  children,
}: {
  code: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 md:gap-10">
      <header className="space-y-1.5">
        <p className="font-data text-[10.5px] uppercase tracking-[0.16em] text-primary/60">
          Sección {code}
        </p>
        <h2 className="font-display text-[17px] font-semibold text-ink tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-[12.5px] text-ink-muted leading-relaxed">
            {description}
          </p>
        )}
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  required,
  htmlFor,
  span = 1,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor: string;
  span?: 1 | 2;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", span === 2 && "sm:col-span-2")}>
      <Label
        htmlFor={htmlFor}
        className="text-[11.5px] uppercase tracking-[0.12em] text-ink-muted font-medium"
      >
        {label}
        {required && <span className="ml-1 text-navy/70">*</span>}
      </Label>
      {children}
    </div>
  );
}

function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11.5px] text-ink-faint leading-relaxed">{children}</p>
  );
}
