import { PageHeader } from "@/components/page-header";
import { StockEntryForm } from "./stock-entry-form";

export default function NewStockPage() {
  const today = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Caracas",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());

  return (
    <div className="p-6 lg:p-8 space-y-6 max-w-3xl">
      <PageHeader
        eyebrow="01 · Inventario / Entrada"
        title="Recibir o cargar stock"
        description="Registra una recepción nueva o carga tu inventario inicial (digitalización del papel)."
      />
      <StockEntryForm today={today} />
    </div>
  );
}
