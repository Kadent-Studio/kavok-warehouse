import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { AircraftClient } from "./aircraft-client";

export const metadata = { title: "Aeronaves" };

export default async function AircraftPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  const aircraft = await prisma.aircraft.findMany({
    orderBy: [{ active: "desc" }, { registration: "asc" }],
    select: {
      id: true,
      registration: true,
      model: true,
      active: true,
      createdAt: true,
      _count: { select: { dispatches: true } },
    },
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <PageHeader
        eyebrow="98 · Administración"
        title="Aeronaves"
        description="Registro de aeronaves disponibles como destino de despacho."
      />
      <AircraftClient
        aircraft={aircraft.map((a) => ({
          id: a.id,
          registration: a.registration,
          model: a.model,
          active: a.active,
          createdAt: a.createdAt.toISOString(),
          dispatchCount: a._count.dispatches,
        }))}
      />
    </div>
  );
}
