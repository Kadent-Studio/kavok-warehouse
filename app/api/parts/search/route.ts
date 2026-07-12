import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) return NextResponse.json([], { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim() ?? "";
  const exclude = req.nextUrl.searchParams.get("exclude") ?? undefined;

  if (q.length < 2) return NextResponse.json([]);

  const results = await prisma.part.findMany({
    where: {
      archived: false,
      ...(exclude ? { id: { not: exclude } } : {}),
      OR: [
        { partNumber: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } },
      ],
    },
    select: {
      id: true,
      partNumber: true,
      description: true,
      trackingType: true,
      unitOfMeasure: true,
      shelfLifeDays: true,
      category: true,
    },
    orderBy: { partNumber: "asc" },
    take: 8,
  });

  return NextResponse.json(results);
}
