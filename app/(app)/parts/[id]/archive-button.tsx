"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Archive, ArchiveRestore } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { archivePart, unarchivePart } from "../actions";

export function ArchiveButton({
  partId,
  archived,
  hasStock,
}: {
  partId: string;
  archived: boolean;
  hasStock: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function doArchive() {
    startTransition(async () => {
      await archivePart(partId);
      toast.success("Parte archivada");
      setOpen(false);
      router.refresh();
    });
  }

  function doUnarchive() {
    startTransition(async () => {
      await unarchivePart(partId);
      toast.success("Parte reactivada");
      router.refresh();
    });
  }

  if (archived) {
    return (
      <Button
        variant="outline"
        size="sm"
        data-press
        onClick={doUnarchive}
        disabled={isPending}
      >
        <ArchiveRestore className="size-3.5" />
        Reactivar
      </Button>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger
        render={
          <Button variant="outline" size="sm" data-press>
            <Archive className="size-3.5" />
            Archivar
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <p className="font-data text-[10.5px] uppercase tracking-[0.18em] text-ink-faint">
            Confirmar acción
          </p>
          <DialogTitle className="text-[16px]">Archivar esta parte</DialogTitle>
          <DialogDescription className="text-[12.5px] leading-relaxed">
            La parte dejará de aparecer en búsquedas nuevas y no podrá recibir
            stock. El historial se preserva completo.
            {hasStock && (
              <span className="block mt-2 text-[color:var(--tag-uns-fg)] font-medium">
                Atención: aún hay stock físico asociado a esta parte.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setOpen(false)}
            data-press
            disabled={isPending}
          >
            Cancelar
          </Button>
          <Button
            size="sm"
            onClick={doArchive}
            data-press
            disabled={isPending}
          >
            {isPending ? "Archivando…" : "Archivar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
