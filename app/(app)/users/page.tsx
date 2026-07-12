import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { UsersClient } from "./users-client";

export default async function UsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (session.user.role !== "admin") redirect("/dashboard");

  const users = await prisma.user.findMany({
    orderBy: [{ active: "desc" }, { username: "asc" }],
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
      active: true,
      createdAt: true,
    },
  });

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-4xl">
      <PageHeader
        eyebrow="99 · Administración"
        title="Usuarios"
        description="Alta de operadores y administradores, roles y contraseñas."
      />
      <UsersClient
        users={users.map((u) => ({ ...u, createdAt: u.createdAt.toISOString() }))}
        currentUserId={session.user.id}
      />
    </div>
  );
}
