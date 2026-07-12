"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { User, Lock, Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { signInAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    startTransition(async () => {
      const result = await signInAction({ username, password });
      if (result.ok) {
        router.replace("/dashboard");
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="rise-in">
      <div className="mb-8 space-y-1.5">
        <p className="font-data text-[11px] uppercase tracking-[0.18em] text-primary/70">
          Acceso · Terminal
        </p>
        <h2 className="font-display text-[26px] font-semibold tracking-tight text-ink">
          Iniciar sesión
        </h2>
        <p className="text-[13.5px] leading-relaxed text-ink-muted">
          Ingresá tus credenciales para entrar al control de almacén.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label
            htmlFor="username"
            className="text-[12px] uppercase tracking-[0.08em] text-ink-muted"
          >
            Usuario
          </Label>
          <div className="relative">
            <User className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              id="username"
              name="username"
              placeholder="usuario"
              autoComplete="username"
              autoCapitalize="off"
              autoFocus
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isPending}
              className="h-11 bg-card pl-9 font-data text-[15px]"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="password"
            className="text-[12px] uppercase tracking-[0.08em] text-ink-muted"
          >
            Contraseña
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="Tu contraseña"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
              className="h-11 bg-card pl-9 pr-10 text-[15px]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              disabled={isPending}
              data-press
              aria-label={
                showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
              }
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-1.5 text-ink-faint transition-colors hover:text-ink disabled:opacity-50"
            >
              {showPassword ? (
                <EyeOff className="size-4" />
              ) : (
                <Eye className="size-4" />
              )}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          disabled={isPending}
          className="group mt-1 h-11 w-full gap-2 text-[14px]"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Ingresando…
            </>
          ) : (
            <>
              Ingresar
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </Button>
      </form>
    </div>
  );
}
