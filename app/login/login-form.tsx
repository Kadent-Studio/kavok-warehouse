"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { signInAction } from "./actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

export function LoginForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

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
    <Card className="elevated rounded-xl">
      <CardContent className="pt-6">
        <form onSubmit={onSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="username">Usuario</Label>
            <Input
              id="username"
              name="username"
              autoComplete="username"
              autoCapitalize="off"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isPending}
              className="font-data"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isPending}
            />
          </div>
          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Ingresando..." : "Ingresar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
