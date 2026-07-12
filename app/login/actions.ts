"use server";

import { signIn } from "@/auth";
import { AuthError } from "next-auth";

export async function signInAction(input: { username: string; password: string }) {
  try {
    await signIn("credentials", {
      username: input.username.trim().toLowerCase(),
      password: input.password,
      redirect: false,
    });
    return { ok: true as const };
  } catch (err) {
    if (err instanceof AuthError) {
      return { ok: false as const, error: "Usuario o contraseña incorrectos" };
    }
    throw err;
  }
}
