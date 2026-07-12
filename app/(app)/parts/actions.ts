"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

const partSchema = z.object({
  partNumber: z.string().trim().min(1, "Requerido").max(64),
  description: z.string().trim().min(1, "Requerido").max(255),
  trackingType: z.enum(["serial", "lot"]),
  manufacturer: z.string().trim().min(1, "Requerido").max(128),
  unitOfMeasure: z.string().trim().min(1, "Requerido").max(16),
  ataChapter: z
    .string()
    .trim()
    .max(16)
    .optional()
    .transform((v) => (v ? v : undefined)),
  category: z.enum(["rotable", "consumable", "expendable"]),
  shelfLifeDays: z
    .union([z.coerce.number().int().nonnegative(), z.literal("")])
    .optional()
    .transform((v) => (typeof v === "number" ? v : undefined)),
});

export type PartInput = z.infer<typeof partSchema>;

async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  return session.user;
}

export async function createPart(raw: unknown) {
  await requireUser();
  const parsed = partSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  try {
    const part = await prisma.part.create({
      data: {
        partNumber: parsed.data.partNumber.toUpperCase(),
        description: parsed.data.description,
        trackingType: parsed.data.trackingType,
        manufacturer: parsed.data.manufacturer,
        unitOfMeasure: parsed.data.unitOfMeasure.toUpperCase(),
        ataChapter: parsed.data.ataChapter,
        category: parsed.data.category,
        shelfLifeDays: parsed.data.shelfLifeDays ?? null,
      },
    });
    revalidatePath("/parts");
    return { ok: true as const, id: part.id };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false as const, error: "Ese Part Number ya existe" };
    }
    throw e;
  }
}

export async function updatePart(id: string, raw: unknown) {
  await requireUser();
  const parsed = partSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };
  }

  try {
    await prisma.part.update({
      where: { id },
      data: {
        partNumber: parsed.data.partNumber.toUpperCase(),
        description: parsed.data.description,
        trackingType: parsed.data.trackingType,
        manufacturer: parsed.data.manufacturer,
        unitOfMeasure: parsed.data.unitOfMeasure.toUpperCase(),
        ataChapter: parsed.data.ataChapter,
        category: parsed.data.category,
        shelfLifeDays: parsed.data.shelfLifeDays ?? null,
      },
    });
    revalidatePath("/parts");
    revalidatePath(`/parts/${id}`);
    return { ok: true as const };
  } catch (e) {
    if (
      e instanceof Prisma.PrismaClientKnownRequestError &&
      e.code === "P2002"
    ) {
      return { ok: false as const, error: "Ese Part Number ya existe" };
    }
    throw e;
  }
}

export async function archivePart(id: string) {
  await requireUser();
  await prisma.part.update({ where: { id }, data: { archived: true } });
  revalidatePath("/parts");
  revalidatePath(`/parts/${id}`);
  return { ok: true as const };
}

export async function unarchivePart(id: string) {
  await requireUser();
  await prisma.part.update({ where: { id }, data: { archived: false } });
  revalidatePath("/parts");
  revalidatePath(`/parts/${id}`);
  return { ok: true as const };
}

export async function addAlternate(partId: string, alternateId: string) {
  await requireUser();
  if (partId === alternateId) {
    return { ok: false as const, error: "Una parte no puede ser alterna de sí misma" };
  }
  try {
    await prisma.$transaction([
      prisma.partAlternate.upsert({
        where: { partId_alternateId: { partId, alternateId } },
        create: { partId, alternateId },
        update: {},
      }),
      prisma.partAlternate.upsert({
        where: { partId_alternateId: { partId: alternateId, alternateId: partId } },
        create: { partId: alternateId, alternateId: partId },
        update: {},
      }),
    ]);
    revalidatePath(`/parts/${partId}`);
    revalidatePath(`/parts/${alternateId}`);
    return { ok: true as const };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError) {
      return { ok: false as const, error: "No se pudo agregar la alternativa" };
    }
    throw e;
  }
}

export async function removeAlternate(partId: string, alternateId: string) {
  await requireUser();
  await prisma.$transaction([
    prisma.partAlternate.deleteMany({
      where: { partId, alternateId },
    }),
    prisma.partAlternate.deleteMany({
      where: { partId: alternateId, alternateId: partId },
    }),
  ]);
  revalidatePath(`/parts/${partId}`);
  revalidatePath(`/parts/${alternateId}`);
  return { ok: true as const };
}

export async function createPartAndRedirect(raw: unknown) {
  const result = await createPart(raw);
  if (result.ok) redirect(`/parts/${result.id}`);
  return result;
}
