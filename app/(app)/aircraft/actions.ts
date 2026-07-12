"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if (session.user.role !== "admin") throw new Error("Solo administradores");
  return session.user;
}

const aircraftSchema = z.object({
  registration: z
    .string()
    .trim()
    .toUpperCase()
    .min(2, "Matrícula requerida")
    .max(16, "Máximo 16 caracteres")
    .regex(/^[A-Z0-9-]+$/, "Solo letras, números y guiones"),
  model: z
    .string()
    .trim()
    .max(64)
    .optional()
    .transform((v) => v || undefined),
});

export async function createAircraft(raw: unknown) {
  await requireAdmin();
  const parsed = aircraftSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };

  try {
    await prisma.aircraft.create({
      data: {
        registration: parsed.data.registration,
        model: parsed.data.model ?? null,
      },
    });
    revalidatePath("/aircraft");
    revalidatePath("/dispatch");
    return { ok: true as const };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { ok: false as const, error: "Ya existe una aeronave con esa matrícula" };
    throw e;
  }
}

export async function updateAircraft(id: string, raw: unknown) {
  await requireAdmin();
  const parsed = aircraftSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };

  const target = await prisma.aircraft.findUnique({ where: { id } });
  if (!target) return { ok: false as const, error: "Aeronave no encontrada" };

  try {
    await prisma.aircraft.update({
      where: { id },
      data: {
        registration: parsed.data.registration,
        model: parsed.data.model ?? null,
      },
    });
    revalidatePath("/aircraft");
    revalidatePath("/dispatch");
    return { ok: true as const };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { ok: false as const, error: "Ya existe una aeronave con esa matrícula" };
    throw e;
  }
}

export async function setAircraftActive(id: string, active: boolean) {
  await requireAdmin();
  const target = await prisma.aircraft.findUnique({ where: { id } });
  if (!target) return { ok: false as const, error: "Aeronave no encontrada" };

  await prisma.aircraft.update({ where: { id }, data: { active } });
  revalidatePath("/aircraft");
  revalidatePath("/dispatch");
  return { ok: true as const };
}

export async function deleteAircraft(id: string) {
  await requireAdmin();
  const count = await prisma.dispatchOrder.count({ where: { aircraftId: id } });
  if (count > 0)
    return {
      ok: false as const,
      error:
        "La aeronave tiene despachos registrados; desactívala en lugar de borrarla",
    };

  await prisma.aircraft.delete({ where: { id } });
  revalidatePath("/aircraft");
  revalidatePath("/dispatch");
  return { ok: true as const };
}
