import { PageHeader } from "@/components/page-header";
import { PartForm } from "../part-form";

export const metadata = { title: "Nueva parte" };

export default function NewPartPage() {
  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <PageHeader
        eyebrow="03 · Catálogo / Nueva"
        title="Nueva parte"
        description="Crea la ficha maestra de un part number. Los datos se toman tal cual del fabricante."
      />
      <PartForm mode="create" />
    </div>
  );
}
