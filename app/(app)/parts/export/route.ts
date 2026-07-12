import { NextRequest } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { csvResponse, toCsv } from "@/lib/csv";
import { partCategoryLabel, trackingTypeLabel } from "@/lib/labels";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return new Response("Unauthorized", { status: 401 });

  const sp = req.nextUrl.searchParams;
  const q = sp.get("q")?.trim() ?? "";
  const category = sp.get("category");
  const tracking = sp.get("tracking");
  const includeArchived = sp.get("archived") === "1";

  const where: Prisma.PartWhereInput = {
    ...(includeArchived ? {} : { archived: false }),
    ...(category && ["rotable", "consumable", "expendable"].includes(category)
      ? { category: category as Prisma.PartWhereInput["category"] }
      : {}),
    ...(tracking && ["serial", "lot"].includes(tracking)
      ? { trackingType: tracking as Prisma.PartWhereInput["trackingType"] }
      : {}),
    ...(q
      ? {
          OR: [
            { partNumber: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { manufacturer: { contains: q, mode: "insensitive" } },
          ],
        }
      : {}),
  };

  const parts = await prisma.part.findMany({
    where,
    orderBy: [{ archived: "asc" }, { partNumber: "asc" }],
  });

  const csv = toCsv(
    [
      "part_number",
      "descripcion",
      "fabricante",
      "categoria",
      "tracking",
      "unidad",
      "capitulo_ata",
      "vida_util_dias",
      "archivada",
      "creada",
    ],
    parts.map((p) => [
      p.partNumber,
      p.description,
      p.manufacturer,
      partCategoryLabel[p.category],
      trackingTypeLabel[p.trackingType],
      p.unitOfMeasure,
      p.ataChapter ?? "",
      p.shelfLifeDays ?? "",
      p.archived ? "sí" : "no",
      p.createdAt.toISOString().slice(0, 10),
    ]),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  return csvResponse(`kavok-catalogo-${stamp}.csv`, csv);
}
