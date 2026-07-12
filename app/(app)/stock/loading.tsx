import { Skeleton } from "@/components/ui/skeleton";

export default function StockLoading() {
  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between border-b border-border pb-7">
        <div className="space-y-2.5">
          <Skeleton className="h-3 w-24 rounded-full" />
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-3.5 w-56" />
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-8 w-28 rounded-lg" />
          <Skeleton className="h-8 w-36 rounded-lg" />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-5 border-b border-border pb-2.5">
        {[64, 80, 96, 92].map((w, i) => (
          <Skeleton key={i} className="h-4 rounded-full" style={{ width: w }} />
        ))}
      </div>

      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-border bg-card p-2 elevated">
        <Skeleton className="h-9 flex-1 min-w-[220px] rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-full" />
        <Skeleton className="h-9 w-28 rounded-full" />
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border bg-card elevated overflow-hidden">
        <div className="h-11 border-b border-border bg-muted/70" />
        {Array.from({ length: 8 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-t border-border/70 px-4 py-3.5 first:border-t-0"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
