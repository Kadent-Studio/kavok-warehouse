import { NextRequest } from "next/server";
import { Prisma, type MovementType } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { csvResponse, toCsv } from "@/lib/csv";
import { movementTypeLabel, stockStatusLabel } from "@/lib/labels";
import { formatDateTime } from "@/lib/dates";

const TYPES: MovementType[] = [
  "initial_stock",
  "receipt",
  "dispatch",
  "transfer",
  "status_change",
];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const type = sp.get("type");
  const from = sp.get("from") ? new Date(`${sp.get("from")}T00:00:00.000Z`) : null;
  const to = sp.get("to") ? new Date(`${sp.get("to")}T23:59:59.999Z`) : null;

  const where: Prisma.StockMovementWhereInput = {
    ...(type && TYPES.includes(type as MovementType)
      ? { type: type as MovementType }
      : {}),
    ...(from || to
      ? { timestamp: { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) } }
      : {}),
    ...(q
      ? {
          OR: [
            { stockItem: { part: { partNumber: { contains: q, mode: "insensitive" } } } },
            { stockItem: { part: { description: { contains: q, mode: "insensitive" } } } },
            { stockItem: { serialNumber: { contains: q, mode: "insensitive" } } },
            { stockItem: { lotNumber: { contains: q, mode: "insensitive" } } },
            { recipient: { contains: q, mode: "insensitive" } },
            { supplier: { contains: q, mode: "insensitive" } },
            { referenceNumber: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const movements = await prisma.stockMovement.findMany({
    where,
    include: {
      stockItem: {
        select: {
          serialNumber: true,
          lotNumber: true,
          part: { select: { partNumber: true, unitOfMeasure: true } },
        },
      },
      user: { select: { fullName: true, username: true } },
    },
    orderBy: { timestamp: "desc" },
    take: 5000,
  });

  const csv = toCsv(
    [
      "fecha",
      "tipo",
      "part_number",
      "serial",
      "lote",
      "cantidad",
      "unidad",
      "desde",
      "hasta",
      "proveedor",
      "destinatario",
      "referencia",
      "estado_anterior",
      "estado_nuevo",
      "motivo",
      "usuario",
      "notas",
    ],
    movements.map((m) => [
      formatDateTime(m.timestamp) ?? "",
      movementTypeLabel[m.type],
      m.stockItem.part.partNumber,
      m.stockItem.serialNumber ?? "",
      m.stockItem.lotNumber ?? "",
      String(m.quantity),
      m.stockItem.part.unitOfMeasure,
      m.fromZone ? `${m.fromZone}/${m.fromShelf ?? ""}` : "",
      m.toZone ? `${m.toZone}/${m.toShelf ?? ""}` : "",
      m.supplier ?? "",
      m.recipient ?? "",
      m.referenceNumber ?? "",
      m.previousStatus ? stockStatusLabel[m.previousStatus] : "",
      m.newStatus ? stockStatusLabel[m.newStatus] : "",
      m.reason ?? "",
      m.user.fullName || m.user.username,
      m.notes ?? "",
    ]),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`kavok-movimientos-${stamp}.csv`, csv);
}
