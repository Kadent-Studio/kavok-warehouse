import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { LoginForm } from "./login-form";
import { ThemeToggleCompact } from "@/components/theme-toggle";

const MANIFEST = [
  { label: "Estación", value: "YV · Hangar 01" },
  { label: "Módulos", value: "Inventario · Movimientos" },
] as const;

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/dashboard");

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left — hangar manifest panel */}
      <aside className="hangar-panel relative hidden overflow-hidden border-r border-sidebar-border lg:flex lg:flex-col lg:justify-between lg:p-12 xl:p-16">
        {/* registration marks */}
        <span
          aria-hidden
          className="pointer-events-none absolute left-7 top-7 size-3 border-l border-t border-ink-faint/30"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute right-7 top-7 size-3 border-r border-t border-ink-faint/30"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-7 left-7 size-3 border-b border-l border-ink-faint/30"
        />
        <span
          aria-hidden
          className="pointer-events-none absolute bottom-7 right-7 size-3 border-b border-r border-ink-faint/30"
        />

        {/* ghost wordmark */}
        <span
          aria-hidden
          className="hangar-ghost pointer-events-none absolute -bottom-24 -right-6 z-0 text-[26rem]"
        >
          K
        </span>

        {/* brand */}
        <div className="rise-in relative z-10 flex items-center gap-3">
          <span className="elevated inline-flex size-10 items-center justify-center rounded-xl bg-primary font-display text-[19px] font-bold text-primary-foreground">
            K
          </span>
          <div className="leading-tight">
            <p className="font-display text-[15px] font-semibold tracking-tight text-ink">
              Kavok Warehouse
            </p>
            <p className="font-data text-[10.5px] uppercase tracking-[0.16em] text-ink-faint">
              Sistema de control
            </p>
          </div>
        </div>

        {/* headline */}
        <div className="relative z-10 max-w-md">
          <p
            className="rise-in mb-4 font-data text-[11px] uppercase tracking-[0.2em] text-primary/70"
            style={{ animationDelay: "60ms" }}
          >
            Control de almacén · Aeronáutico
          </p>
          <h1
            className="rise-in font-display text-[40px] font-semibold leading-[1.02] tracking-tight text-ink xl:text-[46px]"
            style={{ animationDelay: "120ms" }}
          >
            Cada parte,
            <br />
            bajo control.
          </h1>
          <p
            className="rise-in mt-5 max-w-sm text-[14.5px] leading-relaxed text-ink-muted"
            style={{ animationDelay: "180ms" }}
          >
            Trazabilidad de piezas, existencias y movimientos para tu operación
            aeronáutica — en un solo lugar.
          </p>
        </div>

        {/* manifest strip */}
        <div
          className="rise-in relative z-10 border-t border-ink-faint/15"
          style={{ animationDelay: "260ms" }}
        >
          {MANIFEST.map((row) => (
            <div
              key={row.label}
              className="flex items-center justify-between gap-4 border-b border-dashed border-ink-faint/15 py-2.5"
            >
              <span className="font-data text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">
                {row.label}
              </span>
              <span className="font-data text-[11.5px] tracking-tight text-ink-muted">
                {row.value}
              </span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 py-2.5">
            <span className="font-data text-[10.5px] uppercase tracking-[0.14em] text-ink-faint">
              Estado
            </span>
            <span className="flex items-center gap-2 font-data text-[11.5px] tracking-tight text-ink-muted">
              <span className="status-live inline-block size-1.5 rounded-full bg-tag-svc-foreground" />
              Operativo
            </span>
          </div>
        </div>
      </aside>

      {/* Right — access form */}
      <main className="relative flex items-center justify-center px-6 py-12 sm:px-10">
        <div className="absolute right-5 top-5 sm:right-8 sm:top-8">
          <ThemeToggleCompact />
        </div>
        <div className="w-full max-w-sm">
          {/* mobile brand */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <span className="elevated inline-flex size-10 items-center justify-center rounded-xl bg-primary font-display text-[19px] font-bold text-primary-foreground">
              K
            </span>
            <div className="leading-tight">
              <p className="font-display text-[15px] font-semibold tracking-tight text-ink">
                Kavok Warehouse
              </p>
              <p className="font-data text-[10.5px] uppercase tracking-[0.16em] text-ink-faint">
                Control de almacén
              </p>
            </div>
          </div>

          <LoginForm />

          <p className="mt-9 text-center font-data text-[10.5px] uppercase tracking-[0.14em] text-ink-faint/70">
            Acceso restringido · YV
          </p>
        </div>
      </main>
    </div>
  );
}
