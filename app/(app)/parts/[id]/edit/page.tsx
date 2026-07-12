import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/page-header";
import { PartForm } from "../../part-form";

export default async function EditPartPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const part = await prisma.part.findUnique({ where: { id } });
  if (!part) notFound();

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <PageHeader
        eyebrow="03 · Catálogo / Editar"
        title={part.description}
        description={
          <span className="font-data text-[13px] text-ink-muted tracking-tight">
            {part.partNumber}
          </span>
        }
      />
      <PartForm mode="edit" part={part} />
    </div>
  );
}
