"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, MoreHorizontal, Pencil, Power, Trash2 } from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import {
  createAircraft,
  updateAircraft,
  setAircraftActive,
  deleteAircraft,
} from "./actions";

type AircraftRow = {
  id: string;
  registration: string;
  model: string | null;
  active: boolean;
  createdAt: string;
  dispatchCount: number;
};

export function AircraftClient({ aircraft }: { aircraft: AircraftRow[] }) {
  const [dialog, setDialog] = useState<
    { type: "create" } | { type: "edit"; row: AircraftRow } | null
  >(null);

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button size="sm" data-press onClick={() => setDialog({ type: "create" })}>
          <Plus className="size-3.5" />
          Nueva aeronave
        </Button>
      </div>

      {aircraft.length === 0 ? (
        <div className="rise-in rounded-xl border border-dashed border-border/80 bg-muted/40 py-14 px-6 text-center">
          <p className="font-data text-[11px] uppercase tracking-[0.16em] text-primary/60">
            98 · Sin aeronaves
          </p>
          <p className="mt-2 font-display text-[18px] font-semibold text-ink">
            No hay aeronaves registradas
          </p>
          <p className="mt-1 text-[14px] text-ink-muted">
            Agrega la primera para poder seleccionarla como destino de despacho.
          </p>
        </div>
      ) : (
        <div className="rise-in border border-border rounded-xl overflow-hidden bg-card elevated">
          <div className="overflow-x-auto">
            <table className="w-full text-[14px]">
              <thead>
                <tr className="bg-muted/70 text-[11px] uppercase tracking-[0.1em] text-ink-faint border-b border-border">
                  <th className="text-left font-semibold px-4 py-3.5">Matrícula</th>
                  <th className="text-left font-semibold px-4 py-3.5">Modelo</th>
                  <th className="text-left font-semibold px-4 py-3.5">Estado</th>
                  <th className="text-right font-semibold px-4 py-3.5">Despachos</th>
                  <th className="text-left font-semibold px-4 py-3.5">Creada</th>
                  <th className="w-10 px-4 py-3.5" />
                </tr>
              </thead>
              <tbody>
                {aircraft.map((a) => (
                  <tr
                    key={a.id}
                    className={cn(
                      "border-t border-border/70 first:border-t-0 hover:bg-accent/60 transition-colors",
                      !a.active && "opacity-55",
                    )}
                  >
                    <td className="px-4 py-3 align-middle">
                      <span className="font-data text-[13.5px] text-ink">
                        {a.registration}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle text-ink-muted">
                      {a.model ?? "—"}
                    </td>
                    <td className="px-4 py-3 align-middle">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 text-[12.5px]",
                          a.active ? "text-tag-svc-foreground" : "text-ink-faint",
                        )}
                      >
                        <span
                          className={cn(
                            "size-1.5 rounded-full",
                            a.active ? "bg-tag-svc-foreground" : "bg-ink-faint",
                          )}
                        />
                        {a.active ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                    <td className="px-4 py-3 align-middle text-right tnum text-ink-muted">
                      {a.dispatchCount}
                    </td>
                    <td className="px-4 py-3 align-middle text-ink-muted text-[13px] tnum">
                      {formatDate(new Date(a.createdAt))}
                    </td>
                    <td className="px-4 py-3 align-middle text-right">
                      <RowMenu
                        row={a}
                        onEdit={() => setDialog({ type: "edit", row: a })}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {dialog?.type === "create" && (
        <AircraftFormDialog onClose={() => setDialog(null)} />
      )}
      {dialog?.type === "edit" && (
        <AircraftFormDialog row={dialog.row} onClose={() => setDialog(null)} />
      )}
    </div>
  );
}

function RowMenu({ row, onEdit }: { row: AircraftRow; onEdit: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const hasDispatches = row.dispatchCount > 0;

  function toggleActive() {
    startTransition(async () => {
      const r = await setAircraftActive(row.id, !row.active);
      if (r.ok) {
        toast.success(row.active ? "Aeronave desactivada" : "Aeronave activada");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  function remove() {
    startTransition(async () => {
      const r = await deleteAircraft(row.id);
      if (r.ok) {
        toast.success("Aeronave eliminada");
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-sm"
            data-press
            disabled={isPending}
            aria-label="Acciones"
          >
            <MoreHorizontal className="size-4" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-[180px]">
        <DropdownMenuItem onClick={onEdit}>
          <Pencil className="size-4" />
          Editar
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={toggleActive}
          variant={row.active ? "destructive" : "default"}
        >
          <Power className="size-4" />
          {row.active ? "Desactivar" : "Activar"}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={remove}
          disabled={hasDispatches}
          variant="destructive"
        >
          <Trash2 className="size-4" />
          {hasDispatches ? "Con despachos (usa desactivar)" : "Eliminar"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function AircraftFormDialog({
  row,
  onClose,
}: {
  row?: AircraftRow;
  onClose: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const editing = !!row;

  const [registration, setRegistration] = useState(row?.registration ?? "");
  const [model, setModel] = useState(row?.model ?? "");

  function submit() {
    startTransition(async () => {
      const payload = { registration, model };
      const r = editing
        ? await updateAircraft(row!.id, payload)
        : await createAircraft(payload);
      if (r.ok) {
        toast.success(editing ? "Aeronave actualizada" : "Aeronave creada");
        onClose();
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[420px]">
        <DialogHeader>
          <p className="font-data text-[10.5px] uppercase tracking-[0.16em] text-primary/60">
            Administración · Aeronave
          </p>
          <DialogTitle className="font-display text-[18px]">
            {editing ? "Editar aeronave" : "Nueva aeronave"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-1">
          <Small label="Matrícula *">
            <Input
              value={registration}
              onChange={(e) => setRegistration(e.target.value.toUpperCase())}
              autoCapitalize="characters"
              autoComplete="off"
              className="font-data"
              placeholder="YV-1234"
            />
          </Small>
          <Small label="Modelo / descripción">
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Ej. Cessna 172, opcional"
            />
          </Small>
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isPending}
            data-press
          >
            Cancelar
          </Button>
          <Button size="sm" onClick={submit} disabled={isPending} data-press>
            {isPending ? "Guardando…" : editing ? "Guardar" : "Crear aeronave"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Small({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11.5px] uppercase tracking-[0.12em] text-ink-muted font-medium">
        {label}
      </Label>
      {children}
    </div>
  );
}
