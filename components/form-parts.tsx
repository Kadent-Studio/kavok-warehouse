import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function FormSection({
  code,
  title,
  description,
  children,
}: {
  code: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-6 md:gap-10">
      <header className="space-y-1.5">
        <p className="font-data text-[10.5px] uppercase tracking-[0.16em] text-primary/60">
          Sección {code}
        </p>
        <h2 className="font-display text-[17px] font-semibold text-ink tracking-tight">
          {title}
        </h2>
        {description && (
          <p className="text-[12.5px] text-ink-muted leading-relaxed">
            {description}
          </p>
        )}
      </header>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </section>
  );
}

export function Field({
  label,
  required,
  htmlFor,
  span = 1,
  children,
}: {
  label: string;
  required?: boolean;
  htmlFor?: string;
  span?: 1 | 2;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", span === 2 && "sm:col-span-2")}>
      <Label
        htmlFor={htmlFor}
        className="text-[11.5px] uppercase tracking-[0.12em] text-ink-muted font-medium"
      >
        {label}
        {required && <span className="ml-1 text-primary/70">*</span>}
      </Label>
      {children}
    </div>
  );
}

export function FieldHint({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11.5px] text-ink-faint leading-relaxed">{children}</p>
  );
}
