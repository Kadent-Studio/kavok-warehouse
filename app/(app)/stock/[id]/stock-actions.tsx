"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeftRight, RefreshCw } from "lucide-react";
import type { StockStatus } from "@prisma/client";
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
import { stockStatusLabel } from "@/lib/labels";
import { transferStock, changeStockStatus } from "../actions";

type Dlg = "transfer" | "status" | null;

export function StockActions({
  itemId,
  quantity,
  status,
  zone,
  shelf,
}: {
  itemId: string;
  quantity: number;
  status: StockStatus;
  zone: string;
  shelf: string;
}) {
  const [dlg, setDlg] = useState<Dlg>(null);
  const depleted = quantity <= 0;

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        data-press
        disabled={depleted}
        onClick={() => setDlg("transfer")}
      >
        <ArrowLeftRight className="size-3.5" />
        Transferir
      </Button>
      <Button size="sm" data-press onClick={() => setDlg("status")}>
        <RefreshCw className="size-3.5" />
        Cambiar estado
      </Button>

      <TransferDialog
        open={dlg === "transfer"}
        onClose={() => setDlg(null)}
        itemId={itemId}
        zone={zone}
        shelf={shelf}
      />
      <StatusDialog
        open={dlg === "status"}
        onClose={() => setDlg(null)}
        itemId={itemId}
        status={status}
      />
    </>
  );
}

function useAction(onClose: () => void) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  function run(fn: () => Promise<{ ok: boolean; error?: string }>, okMsg: string) {
    startTransition(async () => {
      const r = await fn();
      if (r.ok) {
        toast.success(okMsg);
        onClose();
        router.refresh();
      } else {
        toast.error(r.error);
      }
    });
  }
  return { isPending, run };
}

function TransferDialog({
  open,
  onClose,
  itemId,
  zone,
  shelf,
}: {
  open: boolean;
  onClose: () => void;
  itemId: string;
  zone: string;
  shelf: string;
}) {
  const { isPending, run } = useAction(onClose);
  const [toZone, setToZone] = useState(zone);
  const [toShelf, setToShelf] = useState(shelf);
  const [notes, setNotes] = useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <p className="font-data text-[10.5px] uppercase tracking-[0.16em] text-primary/60">
            Movimiento · Transferencia
          </p>
          <DialogTitle className="font-display text-[18px]">
            Transferir ubicación
          </DialogTitle>
        </DialogHeader>

        <p className="text-[12.5px] text-ink-muted">
          Desde{" "}
          <span className="font-data text-ink">
            {zone}/{shelf}
          </span>
        </p>

        <div className="space-y-4 py-1">
          <Two>
            <Small label="Zona destino *">
              <Input value={toZone} onChange={(e) => setToZone(e.target.value)} />
            </Small>
            <Small label="Estante destino *">
              <Input
                value={toShelf}
                onChange={(e) => setToShelf(e.target.value)}
                className="font-data"
              />
            </Small>
          </Two>
          <Small label="Notas">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Small>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isPending} data-press>
            Cancelar
          </Button>
          <Button
            size="sm"
            data-press
            disabled={isPending}
            onClick={() =>
              run(
                () => transferStock(itemId, { toZone, toShelf, notes }),
                "Transferencia registrada",
              )
            }
          >
            {isPending ? "Transfiriendo…" : "Transferir"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatusDialog({
  open,
  onClose,
  itemId,
  status,
}: {
  open: boolean;
  onClose: () => void;
  itemId: string;
  status: StockStatus;
}) {
  const { isPending, run } = useAction(onClose);
  const [newStatus, setNewStatus] = useState<string>(
    status === "serviceable" ? "unserviceable" : "serviceable",
  );
  const [reason, setReason] = useState("");
  const [notes, setNotes] = useState("");

  const statusOptions = (["serviceable", "unserviceable", "scrap"] as const)
    .filter((s) => s !== status)
    .map((s) => ({ value: s, label: stockStatusLabel[s] }));

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <p className="font-data text-[10.5px] uppercase tracking-[0.16em] text-primary/60">
            Movimiento · Estado
          </p>
          <DialogTitle className="font-display text-[18px]">
            Cambiar estado
          </DialogTitle>
        </DialogHeader>

        <p className="text-[12.5px] text-ink-muted">
          Estado actual:{" "}
          <span className="font-medium text-ink">{stockStatusLabel[status]}</span>
        </p>

        <div className="space-y-4 py-1">
          <Small label="Nuevo estado *">
            <Select
              items={statusOptions}
              value={newStatus}
              onValueChange={(v) => v && setNewStatus(v)}
            >
              <SelectTrigger data-press>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statusOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Small>
          <Small label="Motivo *">
            <Input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Ej. Falló inspección, reparación aprobada…"
            />
          </Small>
          <Small label="Notas">
            <Input value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Small>
        </div>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose} disabled={isPending} data-press>
            Cancelar
          </Button>
          <Button
            size="sm"
            data-press
            disabled={isPending}
            onClick={() =>
              run(
                () =>
                  changeStockStatus(itemId, {
                    newStatus,
                    reason,
                    notes,
                  }),
                "Estado actualizado",
              )
            }
          >
            {isPending ? "Guardando…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Two({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
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
