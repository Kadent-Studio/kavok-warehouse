"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user) throw new Error("No autenticado");
  if (session.user.role !== "admin")
    throw new Error("Solo administradores");
  return session.user;
}

const usernameSchema = z
  .string()
  .trim()
  .min(3, "Mínimo 3 caracteres")
  .max(32, "Máximo 32 caracteres")
  .regex(/^[a-zA-Z0-9._-]+$/, "Solo letras, números, punto, guion y guion bajo");

const passwordSchema = z
  .string()
  .min(6, "La contraseña debe tener al menos 6 caracteres")
  .max(128);

const createSchema = z.object({
  username: usernameSchema,
  fullName: z.string().trim().min(1, "Nombre requerido").max(128),
  role: z.enum(["operator", "admin"]),
  password: passwordSchema,
});

export async function createUser(raw: unknown) {
  await requireAdmin();
  const parsed = createSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  try {
    await prisma.user.create({
      data: {
        username: parsed.data.username.toLowerCase(),
        fullName: parsed.data.fullName,
        role: parsed.data.role,
        passwordHash,
      },
    });
    revalidatePath("/users");
    return { ok: true as const };
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002")
      return { ok: false as const, error: "Ese usuario ya existe" };
    throw e;
  }
}

const updateSchema = z.object({
  fullName: z.string().trim().min(1, "Nombre requerido").max(128),
  role: z.enum(["operator", "admin"]),
});

export async function updateUser(id: string, raw: unknown) {
  const admin = await requireAdmin();
  const parsed = updateSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Datos inválidos",
    };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { ok: false as const, error: "Usuario no encontrado" };

  // Prevent demoting yourself or removing the last active admin.
  if (parsed.data.role === "operator" && target.role === "admin") {
    if (target.id === admin.id)
      return { ok: false as const, error: "No puedes degradar tu propia cuenta" };
    const activeAdmins = await prisma.user.count({
      where: { role: "admin", active: true },
    });
    if (activeAdmins <= 1)
      return {
        ok: false as const,
        error: "Debe quedar al menos un administrador activo",
      };
  }

  await prisma.user.update({
    where: { id },
    data: { fullName: parsed.data.fullName, role: parsed.data.role },
  });
  revalidatePath("/users");
  return { ok: true as const };
}

export async function setUserActive(id: string, active: boolean) {
  const admin = await requireAdmin();
  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { ok: false as const, error: "Usuario no encontrado" };

  if (!active) {
    if (target.id === admin.id)
      return { ok: false as const, error: "No puedes desactivar tu propia cuenta" };
    if (target.role === "admin") {
      const activeAdmins = await prisma.user.count({
        where: { role: "admin", active: true },
      });
      if (activeAdmins <= 1)
        return {
          ok: false as const,
          error: "Debe quedar al menos un administrador activo",
        };
    }
  }

  await prisma.user.update({ where: { id }, data: { active } });
  revalidatePath("/users");
  return { ok: true as const };
}

export async function resetPassword(id: string, raw: unknown) {
  await requireAdmin();
  const parsed = passwordSchema.safeParse(raw);
  if (!parsed.success)
    return {
      ok: false as const,
      error: parsed.error.issues[0]?.message ?? "Contraseña inválida",
    };

  const target = await prisma.user.findUnique({ where: { id } });
  if (!target) return { ok: false as const, error: "Usuario no encontrado" };

  const passwordHash = await bcrypt.hash(parsed.data, 10);
  await prisma.user.update({ where: { id }, data: { passwordHash } });
  revalidatePath("/users");
  return { ok: true as const };
}
