import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { csvResponse, toCsv } from "@/lib/csv";
import { partCategoryLabel, stockStatusLabel } from "@/lib/labels";
import { formatDate } from "@/lib/dates";

const STATUSES = ["serviceable", "unserviceable", "scrap"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const showDepleted = sp.get("depleted") === "1";
  const status = sp.get("status");
  const category = sp.get("category");
  const zone = sp.get("zone");
  const expiry = sp.get("expiry");
  const now = new Date();

  const where: Prisma.StockItemWhereInput = {
    ...(showDepleted ? {} : { quantity: { gt: 0 } }),
    ...(status && STATUSES.includes(status)
      ? { status: status as Prisma.StockItemWhereInput["status"] }
      : {}),
    ...(zone ? { zone } : {}),
    ...(category && ["rotable", "consumable", "expendable"].includes(category)
      ? { part: { category: category as never } }
      : {}),
    ...(expiry === "expired"
      ? { expirationDate: { lt: now } }
      : expiry === "soon"
        ? {
            expirationDate: {
              gte: now,
              lte: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
            },
          }
        : {}),
    ...(q
      ? {
          OR: [
            { serialNumber: { contains: q, mode: "insensitive" } },
            { lotNumber: { contains: q, mode: "insensitive" } },
            { part: { partNumber: { contains: q, mode: "insensitive" } } },
            { part: { description: { contains: q, mode: "insensitive" } } },
          ],
        }
      : {}),
  };

  const items = await prisma.stockItem.findMany({
    where,
    include: { part: true },
    orderBy: [{ createdAt: "desc" }],
  });

  const csv = toCsv(
    [
      "part_number",
      "descripcion",
      "categoria",
      "serial",
      "lote",
      "cantidad",
      "unidad",
      "zona",
      "estante",
      "estado",
      "recepcion",
      "vencimiento",
    ],
    items.map((it) => [
      it.part.partNumber,
      it.part.description,
      partCategoryLabel[it.part.category],
      it.serialNumber ?? "",
      it.lotNumber ?? "",
      String(it.quantity),
      it.part.unitOfMeasure,
      it.zone,
      it.shelf,
      stockStatusLabel[it.status],
      formatDate(it.receiptDate) ?? "",
      formatDate(it.expirationDate) ?? "",
    ]),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`kavok-stock-${stamp}.csv`, csv);
}
