import { Skeleton } from "@/components/ui/skeleton";

export default function ContractDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <Skeleton className="h-4 w-28" />
      <div className="mt-6 space-y-3">
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-6 w-24 rounded-full" />
        </div>
        <Skeleton className="h-4 w-64" />
      </div>
      <Skeleton className="mt-8 h-10 w-72 rounded-lg" />
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {[0, 1].map((i) => (
          <div
            key={i}
            className="space-y-3 rounded-xl border border-border/80 bg-card p-6"
          >
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-5/6" />
            <Skeleton className="h-3.5 w-2/3" />
          </div>
        ))}
      </div>
    </div>
  );
}
