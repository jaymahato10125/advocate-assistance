import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="h-4 w-72" />
        </div>
        <Skeleton className="h-9 w-36" />
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="flex items-center gap-3 p-4">
            <Skeleton className="size-9 rounded-lg" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-10" />
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex gap-3">
        <Skeleton className="h-9 flex-1" />
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>

      <div className="mt-6 rounded-xl border border-border/80 bg-card p-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 border-b border-border/60 px-4 py-4 last:border-0"
          >
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/5" />
              <Skeleton className="h-3 w-1/4" />
            </div>
            <Skeleton className="h-5 w-20 rounded-full" />
            <Skeleton className="hidden h-4 w-14 md:block" />
          </div>
        ))}
      </div>
    </div>
  );
}
