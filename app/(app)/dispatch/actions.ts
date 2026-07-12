"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { destinationLabel, formatFolio } from "@/lib/dispatch";

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  return session.user;
}

export type AvailableStockItem = {
  id: string;
  partId: string;
  partNumber: string;
  description: string;
  category: "rotable" | "consumable" | "expendable";
  trackingType: "serial" | "lot";
  unitOfMeasure: string;
  serialNumber: string | null;
  lotNumber: string | null;
  zone: string;
  shelf: string;
  quantity: number;
};

/** Search serviceable stock (qty > 0) by part number or description. */
export async function searchAvailableStock(
  query: string,
): Promise<AvailableStockItem[]> {
  await requireUser();
  const q = query.trim();
  if (q.length < 2) return [];

  const items = await prisma.stockItem.findMany({
    where: {
      status: "serviceable",
      quantity: { gt: 0 },
      part: {
        OR: [
          { partNumber: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      },
    },
    select: {
      id: true,
      partId: true,
      serialNumber: true,
      lotNumber: true,
      quantity: true,
      zone: true,
      shelf: true,
      part: {
        select: {
          partNumber: true,
          description: true,
          category: true,
          trackingType: true,
          unitOfMeasure: true,
        },
      },
    },
    orderBy: [{ part: { partNumber: "asc" } }, { zone: "asc" }],
    take: 12,
  });

  return items.map((i) => ({
    id: i.id,
    partId: i.partId,
    partNumber: i.part.partNumber,
    description: i.part.description,
    category: i.part.category,
    trackingType: i.part.trackingType,
    unitOfMeasure: i.part.unitOfMeasure,
    serialNumber: i.serialNumber,
    lotNumber: i.lotNumber,
    zone: i.zone,
    shelf: i.shelf,
    quantity: Number(i.quantity),
  }));
}

const dispatchSchema = z
  .object({
    requestedBy: z.string().trim().min(1, "Indica quién solicitó").max(128),
    deliveredBy: z.string().trim().min(1, "Indica quién entregó").max(128),
    destinationType: z.enum(["aircraft", "other"]),
    aircraftId: z.string().trim().optional(),
    destinationText: z.string().trim().max(128).optional(),
    notes: z.string().trim().max(500).optional(),
    lines: z
      .array(
        z.object({
          stockItemId: z.string().min(1),
          quantity: z.coerce.number().positive("Cantidad inválida"),
        }),
      )
      .min(1, "Agrega al menos un artículo"),
  })
  .refine(
    (v) => v.destinationType !== "aircraft" || !!v.aircraftId,
    { message: "Selecciona la aeronave de destino", path: ["aircraftId"] },
  )
  .refine(
    (v) =>
      v.destinationType !== "other" ||
      !!(v.destinationText && v.destinationText.length > 0),
    { message: "Indica el destino", path: ["destinationText"] },
  );

export async function createDispatch(raw: unknown) {
  const user = await requireUser();
  const parsed = dispatchSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  const data = parsed.data;

  // Resolve destination.
  let aircraftId: string | null = null;
  let destinationText: string | null = null;
  let aircraft: { registration: string } | null = null;
  if (data.destinationType === "aircraft") {
    const found = await prisma.aircraft.findUnique({
      where: { id: data.aircraftId! },
      select: { id: true, registration: true, active: true },
    });
    if (!found) return { ok: false as const, error: "La aeronave no existe" };
    if (!found.active)
      return { ok: false as const, error: "La aeronave está inactiva" };
    aircraftId = found.id;
    aircraft = { registration: found.registration };
  } else {
    destinationText = data.destinationText ?? null;
  }

  // Aggregate quantities per stock item to avoid double-decrement on dup lines.
  const wanted = new Map<string, number>();
  for (const line of data.lines) {
    wanted.set(line.stockItemId, (wanted.get(line.stockItemId) ?? 0) + line.quantity);
  }

  const label = destinationLabel({
    destinationType: data.destinationType,
    aircraft,
    destinationText,
  });

  try {
    const order = await prisma.$transaction(async (tx) => {
      // Re-read items inside the transaction for a fresh availability check.
      const ids = [...wanted.keys()];
      const items = await tx.stockItem.findMany({
        where: { id: { in: ids } },
        select: {
          id: true,
          quantity: true,
          status: true,
          zone: true,
          shelf: true,
          part: { select: { partNumber: true } },
        },
      });
      const byId = new Map(items.map((i) => [i.id, i]));

      for (const [itemId, qty] of wanted) {
        const item = byId.get(itemId);
        if (!item) throw new Error("Un artículo ya no existe en stock");
        if (item.status !== "serviceable")
          throw new Error(
            `El artículo ${item.part.partNumber} ya no está serviciable`,
          );
        const available = Number(item.quantity);
        if (qty > available)
          throw new Error(
            `Stock insuficiente de ${item.part.partNumber}: piden ${qty}, hay ${available}`,
          );
      }

      const created = await tx.dispatchOrder.create({
        data: {
          requestedBy: data.requestedBy,
          deliveredBy: data.deliveredBy,
          destinationType: data.destinationType,
          aircraftId,
          destinationText,
          notes: data.notes ?? null,
          userId: user.id,
        },
      });
      const folio = formatFolio(created.number);

      for (const [itemId, qty] of wanted) {
        const item = byId.get(itemId)!;
        await tx.stockItem.update({
          where: { id: itemId },
          data: { quantity: new Prisma.Decimal(Number(item.quantity) - qty) },
        });
        await tx.stockMovement.create({
          data: {
            stockItemId: itemId,
            type: "dispatch",
            quantity: new Prisma.Decimal(qty),
            userId: user.id,
            fromZone: item.zone,
            fromShelf: item.shelf,
            recipient: label,
            referenceNumber: folio,
            dispatchOrderId: created.id,
            notes: data.notes ?? null,
          },
        });
      }

      return created;
    });

    revalidatePath("/dispatch");
    revalidatePath("/stock");
    revalidatePath("/movements");
    revalidatePath("/dashboard");
    return { ok: true as const, id: order.id };
  } catch (e) {
    if (e instanceof Error) return { ok: false as const, error: e.message };
    throw e;
  }
}
