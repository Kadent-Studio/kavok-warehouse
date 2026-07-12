"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { computeExpiration } from "@/lib/dates";

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  return session.user;
}

const entrySchema = z
  .object({
    type: z.enum(["receipt", "initial_stock"]),
    partId: z.string().min(1, "Selecciona una parte"),
    serialNumber: z.string().trim().max(64).optional(),
    lotNumber: z.string().trim().max(64).optional(),
    quantity: z.coerce.number().positive("La cantidad debe ser mayor a 0"),
    zone: z.string().trim().min(1, "Zona requerida").max(64),
    shelf: z.string().trim().min(1, "Estante requerido").max(64),
    status: z.enum(["serviceable", "unserviceable", "scrap"]),
    receiptDate: z.string().min(1, "Fecha requerida"),
    supplier: z.string().trim().max(128).optional(),
    referenceNumber: z.string().trim().max(64).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .transform((v) => ({
    ...v,
    serialNumber: v.serialNumber || undefined,
    lotNumber: v.lotNumber || undefined,
    supplier: v.supplier || undefined,
    referenceNumber: v.referenceNumber || undefined,
    notes: v.notes || undefined,
  }));

function revalidateStock(id: string) {
  revalidatePath("/stock");
  revalidatePath(`/stock/${id}`);
  revalidatePath("/movements");
  revalidatePath("/dashboard");
}

// ── Transferencia ─────────────────────────────────────────────
const transferSchema = z.object({
  toZone: z.string().trim().min(1, "Zona destino requerida").max(64),
  toShelf: z.string().trim().min(1, "Estante destino requerido").max(64),
  notes: z.string().trim().max(500).optional(),
});

export async function transferStock(itemId: string, raw: unknown) {
  const user = await requireUser();
  const parsed = transferSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  const data = parsed.data;

  const item = await prisma.stockItem.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false as const, error: "Ítem no encontrado" };

  if (item.zone === data.toZone && item.shelf === data.toShelf)
    return { ok: false as const, error: "El destino es igual a la ubicación actual" };

  await prisma.$transaction(async (tx) => {
    await tx.stockItem.update({
      where: { id: itemId },
      data: { zone: data.toZone, shelf: data.toShelf },
    });
    await tx.stockMovement.create({
      data: {
        stockItemId: itemId,
        type: "transfer",
        quantity: item.quantity,
        userId: user.id,
        fromZone: item.zone,
        fromShelf: item.shelf,
        toZone: data.toZone,
        toShelf: data.toShelf,
        notes: data.notes ?? null,
      },
    });
  });

  revalidateStock(itemId);
  return { ok: true as const };
}

// ── Cambio de estado ──────────────────────────────────────────
const statusSchema = z.object({
  newStatus: z.enum(["serviceable", "unserviceable", "scrap"]),
  reason: z.string().trim().min(1, "El motivo es obligatorio").max(500),
  notes: z.string().trim().max(500).optional(),
});

export async function changeStockStatus(itemId: string, raw: unknown) {
  const user = await requireUser();
  const parsed = statusSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  const data = parsed.data;

  const item = await prisma.stockItem.findUnique({ where: { id: itemId } });
  if (!item) return { ok: false as const, error: "Ítem no encontrado" };
  if (item.status === data.newStatus)
    return { ok: false as const, error: "El ítem ya está en ese estado" };

  await prisma.$transaction(async (tx) => {
    await tx.stockItem.update({
      where: { id: itemId },
      data: { status: data.newStatus },
    });
    await tx.stockMovement.create({
      data: {
        stockItemId: itemId,
        type: "status_change",
        quantity: item.quantity,
        userId: user.id,
        previousStatus: item.status,
        newStatus: data.newStatus,
        reason: data.reason,
        notes: data.notes ?? null,
      },
    });
  });

  revalidateStock(itemId);
  return { ok: true as const };
}

export async function createStockEntry(raw: unknown) {
  const user = await requireUser();
  const parsed = entrySchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }
  const data = parsed.data;

  const part = await prisma.part.findUnique({ where: { id: data.partId } });
  if (!part) return { ok: false as const, error: "La parte no existe" };
  if (part.archived)
    return { ok: false as const, error: "La parte está archivada" };

  // Serial-tracked: exactly one unit, serial required.
  if (part.trackingType === "serial") {
    if (!data.serialNumber)
      return {
        ok: false as const,
        error: "Esta parte requiere número de serial",
      };
    if (data.quantity !== 1)
      return {
        ok: false as const,
        error: "Las partes por serial tienen cantidad 1",
      };
  }

  const receiptDate = new Date(`${data.receiptDate}T12:00:00.000Z`);
  if (Number.isNaN(receiptDate.getTime()))
    return { ok: false as const, error: "Fecha inválida" };

  const expirationDate = computeExpiration(receiptDate, part.shelfLifeDays);

  try {
    const item = await prisma.$transaction(async (tx) => {
      const created = await tx.stockItem.create({
        data: {
          partId: part.id,
          serialNumber: part.trackingType === "serial" ? data.serialNumber : null,
          lotNumber: part.trackingType === "lot" ? data.lotNumber ?? null : null,
          quantity: new Prisma.Decimal(data.quantity),
          zone: data.zone,
          shelf: data.shelf,
          status: data.status,
          receiptDate,
          expirationDate,
          notes: data.notes ?? null,
        },
      });

      await tx.stockMovement.create({
        data: {
          stockItemId: created.id,
          type: data.type,
          quantity: new Prisma.Decimal(data.quantity),
          userId: user.id,
          toZone: data.zone,
          toShelf: data.shelf,
          supplier: data.type === "receipt" ? data.supplier ?? null : null,
          referenceNumber:
            data.type === "receipt" ? data.referenceNumber ?? null : null,
          newStatus: data.status,
          notes: data.notes ?? null,
        },
      });

      return created;
    });

    revalidatePath("/stock");
    revalidatePath("/dashboard");
    return { ok: true as const, id: item.id };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
      return {
        ok: false as const,
        error: "Ya existe un ítem con ese serial para esta parte",
      };
    }
    throw e;
  }
}
