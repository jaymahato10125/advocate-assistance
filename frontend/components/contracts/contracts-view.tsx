"use client";

import {
  AlertCircle,
  ArrowUpDown,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  FileText,
  Files,
  LayoutGrid,
  List,
  Loader2,
  Search,
  SearchX,
  SlidersHorizontal,
  Upload,
} from "lucide-react";
import { useMemo, useState } from "react";

import { ContractCard } from "@/components/contracts/contract-card";
import { CONTRACT_STATUS_META } from "@/components/contracts/status-badge";
import { ContractTable } from "@/components/contracts/contract-table";
import { UploadContractDialog } from "@/components/contracts/upload-dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useContracts } from "@/hooks/use-contracts";
import { ApiError } from "@/lib/api-client";
import { cn, formatNumber } from "@/lib/utils";
import type { Contract, ContractStatus } from "@/types/contract";

type StatusFilter = ContractStatus | "all";
type SortKey = "newest" | "oldest" | "name";
type ViewMode = "table" | "grid";

const SORT_LABELS: Record<SortKey, string> = {
  newest: "Newest first",
  oldest: "Oldest first",
  name: "Name A–Z",
};

const PAGE_SIZE: Record<ViewMode, number> = { table: 10, grid: 9 };

export function ContractsView() {
  const { data, isPending, isError, error, refetch, isRefetching } = useContracts();

  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortKey>("newest");
  const [view, setView] = useState<ViewMode>("table");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const matches = (data ?? []).filter((contract) => {
      const statusOk = statusFilter === "all" || contract.status === statusFilter;
      const queryOk =
        normalized.length === 0 ||
        contract.original_name.toLowerCase().includes(normalized) ||
        contract.filename.toLowerCase().includes(normalized);
      return statusOk && queryOk;
    });

    return [...matches].sort((a, b) => {
      if (sort === "name") return a.original_name.localeCompare(b.original_name);
      const aTime = new Date(a.upload_date).getTime();
      const bTime = new Date(b.upload_date).getTime();
      return sort === "newest" ? bTime - aTime : aTime - bTime;
    });
  }, [data, query, statusFilter, sort]);

  const pageSize = PAGE_SIZE[view];
  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const updateFilters = (fn: () => void) => {
    fn();
    setPage(1);
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold tracking-tight">
            Contracts
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload agreements, extract their text, and run Gemini analysis.
          </p>
        </div>
        <UploadContractDialog
          trigger={
            <Button>
              <Upload aria-hidden="true" />
              Upload contract
            </Button>
          }
        />
      </div>

      <StatsRow contracts={data} loading={isPending} />

      <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => updateFilters(() => setQuery(event.target.value))}
            placeholder="Search by filename…"
            aria-label="Search contracts by filename"
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Filter by status">
                <SlidersHorizontal aria-hidden="true" />
                <span className="hidden sm:inline">
                  {statusFilter === "all"
                    ? "All statuses"
                    : CONTRACT_STATUS_META[statusFilter].label}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Status</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(["all", "uploaded", "analyzing", "analyzed", "not_a_contract", "error"] as const).map(
                (status) => (
                  <DropdownMenuItem
                    key={status}
                    onClick={() => updateFilters(() => setStatusFilter(status))}
                  >
                    <span className="flex-1">
                      {status === "all" ? "All statuses" : CONTRACT_STATUS_META[status].label}
                    </span>
                    {statusFilter === status ? (
                      <Check className="size-4 text-primary" aria-hidden="true" />
                    ) : null}
                  </DropdownMenuItem>
                ),
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" aria-label="Sort contracts">
                <ArrowUpDown aria-hidden="true" />
                <span className="hidden sm:inline">{SORT_LABELS[sort]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Sort by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
                <DropdownMenuItem
                  key={key}
                  onClick={() => updateFilters(() => setSort(key))}
                >
                  <span className="flex-1">{SORT_LABELS[key]}</span>
                  {sort === key ? (
                    <Check className="size-4 text-primary" aria-hidden="true" />
                  ) : null}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div
            className="flex items-center rounded-md border border-input p-0.5"
            role="group"
            aria-label="Toggle list layout"
          >
            {(
              [
                { mode: "table" as const, icon: List, label: "Table view" },
                { mode: "grid" as const, icon: LayoutGrid, label: "Card view" },
              ] as const
            ).map(({ mode, icon: Icon, label }) => (
              <Tooltip key={mode}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={label}
                    aria-pressed={view === mode}
                    onClick={() => updateFilters(() => setView(mode))}
                    className={cn(
                      "flex size-8 items-center justify-center rounded-[5px] text-muted-foreground transition-colors outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40",
                      view === mode && "bg-accent text-foreground shadow-xs",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>{label}</TooltipContent>
              </Tooltip>
            ))}
          </div>
        </div>
      </div>
      <div className="mt-6" aria-live="polite">
        {isPending ? (
          <ContractsSkeleton view={view} />
        ) : isError ? (
          <EmptyState
            icon={AlertCircle}
            title="Could not load contracts"
            description={
              error instanceof ApiError ? error.detail : "Something went wrong."
            }
            action={
              <Button variant="outline" onClick={() => refetch()} disabled={isRefetching}>
                {isRefetching ? (
                  <Loader2 className="animate-spin" aria-hidden="true" />
                ) : null}
                Try again
              </Button>
            }
          />
        ) : (data ?? []).length === 0 ? (
          <EmptyState
            icon={FileText}
            title="No contracts yet"
            description="Upload your first PDF or TXT contract to extract its text and run a Gemini analysis."
            action={
              <UploadContractDialog
                trigger={
                  <Button>
                    <Upload aria-hidden="true" />
                    Upload your first contract
                  </Button>
                }
              />
            }
          />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No contracts match"
            description="Try a different search term or clear the status filter."
            action={
              <Button
                variant="outline"
                onClick={() =>
                  updateFilters(() => {
                    setQuery("");
                    setStatusFilter("all");
                  })
                }
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            {view === "table" ? (
              <ContractTable contracts={visible} />
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {visible.map((contract) => (
                  <ContractCard key={contract.id} contract={contract} />
                ))}
              </div>
            )}

            {pageCount > 1 ? (
              <nav
                className="mt-6 flex items-center justify-between"
                aria-label="Contracts pagination"
              >
                <p className="text-sm text-muted-foreground">
                  Page {currentPage} of {pageCount} · {formatNumber(filtered.length)}{" "}
                  {filtered.length === 1 ? "contract" : "contracts"}
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft aria-hidden="true" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
                    disabled={currentPage === pageCount}
                  >
                    Next
                    <ChevronRight aria-hidden="true" />
                  </Button>
                </div>
              </nav>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
}

function StatsRow({
  contracts,
  loading,
}: {
  contracts: Contract[] | undefined;
  loading: boolean;
}) {
  const stats = [
    {
      label: "Total contracts",
      value: contracts?.length,
      icon: Files,
      iconClass: "bg-primary/10 text-primary",
    },
    {
      label: "Analyzed",
      value: contracts?.filter((c) => c.status === "analyzed").length,
      icon: CheckCircle2,
      iconClass: "bg-primary/10 text-primary",
    },
    {
      label: "In progress",
      value: contracts?.filter((c) => c.status === "analyzing" || c.status === "uploaded").length,
      icon: Loader2,
      iconClass: "bg-risk-medium/10 text-risk-medium",
    },
    {
      label: "Errors",
      value: contracts?.filter(
        (c) => c.status === "error" || c.status === "not_a_contract",
      ).length,
      icon: AlertCircle,
      iconClass: "bg-destructive/10 text-destructive dark:text-risk-critical",
    },
  ];

  return (
    <dl className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="flex items-center gap-3 p-4">
          <span
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-lg",
              stat.iconClass,
            )}
          >
            <stat.icon className="size-4.5" aria-hidden="true" />
          </span>
          <div>
            <dt className="text-xs font-medium tracking-wider text-muted-foreground uppercase">
              {stat.label}
            </dt>
            <dd className="mt-0.5 font-display text-xl font-semibold">
              {loading || stat.value === undefined ? (
                <Skeleton className="inline-block h-6 w-8 align-middle" />
              ) : (
                formatNumber(stat.value)
              )}
            </dd>
          </div>
        </Card>
      ))}
    </dl>
  );
}

/** Skeletons mirror the final layout — never a bare spinner. */
function ContractsSkeleton({ view }: { view: ViewMode }) {
  if (view === "grid") {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i} className="flex h-44 flex-col gap-4 p-5">
            <div className="flex items-start justify-between">
              <Skeleton className="size-10 rounded-lg" />
              <Skeleton className="h-5 w-20 rounded-full" />
            </div>
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <Skeleton className="mt-auto h-3 w-2/3" />
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border/80 bg-card p-2">
      <div className="flex gap-4 border-b border-border px-4 py-3">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-20" />
        <Skeleton className="ml-auto h-3 w-16" />
      </div>
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
          <Skeleton className="hidden h-4 w-10 sm:block" />
          <Skeleton className="hidden h-4 w-14 md:block" />
          <Skeleton className="hidden h-4 w-20 lg:block" />
        </div>
      ))}
    </div>
  );
}
