import { Boxes, PackageSearch, Clock3, TriangleAlert } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";

export default async function DashboardPage() {
  const session = await auth();

  const [partCount, stockCount, expiringSoon, unserviceableCount] = await Promise.all([
    prisma.part.count({ where: { archived: false } }),
    prisma.stockItem.count(),
    prisma.stockItem.count({
      where: {
        expirationDate: {
          gte: new Date(),
          lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        },
      },
    }),
    prisma.stockItem.count({ where: { status: "unserviceable" } }),
  ]);

  const kpis = [
    {
      label: "Partes en catálogo",
      value: partCount,
      icon: PackageSearch,
      tone: "neutral" as const,
    },
    {
      label: "Ítems en stock",
      value: stockCount,
      icon: Boxes,
      tone: "neutral" as const,
    },
    {
      label: "Por vencer (30 días)",
      value: expiringSoon,
      icon: Clock3,
      tone: expiringSoon > 0 ? ("warn" as const) : ("neutral" as const),
    },
    {
      label: "No serviciables",
      value: unserviceableCount,
      icon: TriangleAlert,
      tone: unserviceableCount > 0 ? ("alert" as const) : ("neutral" as const),
    },
  ];

  const firstName = (session?.user.name ?? session?.user.username ?? "").split(" ")[0];

  return (
    <div className="p-6 lg:p-8 space-y-8">
      <PageHeader
        eyebrow="00 · Panel"
        title={`Hola, ${firstName}`}
        description="Resumen del estado actual del almacén."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="rise-in rounded-xl border border-border bg-card p-6 elevated"
              style={{ animationDelay: `${i * 55}ms` }}
            >
              <div className="flex items-start justify-between gap-3">
                <p className="text-[13.5px] font-medium text-ink-muted leading-snug">
                  {kpi.label}
                </p>
                <span
                  className={cn(
                    "inline-flex size-9 shrink-0 items-center justify-center rounded-lg",
                    kpi.tone === "neutral" && "bg-accent text-primary",
                    kpi.tone === "warn" &&
                      "bg-tag-uns text-tag-uns-foreground",
                    kpi.tone === "alert" &&
                      "bg-tag-scr text-tag-scr-foreground",
                  )}
                >
                  <Icon className="size-[18px]" />
                </span>
              </div>
              <p className="mt-5 font-display text-[42px] font-semibold tracking-tight tnum text-ink leading-none">
                {kpi.value}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
