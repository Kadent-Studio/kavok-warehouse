import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-7 rise-in">
        <div className="flex flex-col items-center text-center gap-3">
          <span className="inline-flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground font-display font-bold text-[20px] elevated">
            K
          </span>
          <div className="space-y-1">
            <h1 className="font-display text-[22px] font-semibold tracking-tight text-ink">
              Kavok Warehouse
            </h1>
            <p className="text-[13px] text-ink-muted">
              Control de almacén aeronáutico
            </p>
          </div>
        </div>
        <LoginForm />
        <p className="text-center font-data text-[10.5px] uppercase tracking-[0.14em] text-ink-faint/70">
          Acceso restringido · YV
        </p>
      </div>
    </div>
  );
}
