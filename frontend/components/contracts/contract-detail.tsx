"use client";

import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpenText,
  Calendar,
  Check,
  Copy,
  FileText,
  Hash,
  LayoutDashboard,
  Loader2,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { AnalysisPanel } from "@/components/analysis/analysis-panel";
import { SEVERITY_META } from "@/components/analysis/severity";
import { StatusBadge } from "@/components/contracts/status-badge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCachedAnalysis } from "@/hooks/use-analysis";
import { useContract } from "@/hooks/use-contracts";
import { ApiError } from "@/lib/api-client";
import { formatDateTime, formatNumber } from "@/lib/utils";
import type { Contract } from "@/types/contract";

export function ContractDetail({ id }: { id: string }) {
  const { data: contract, isPending, isError, error, refetch, isRefetching } =
    useContract(id);
  const [tab, setTab] = useState("overview");

  if (isPending) return <ContractDetailSkeleton />;

  if (isError || !contract) {
    const notFound = error instanceof ApiError && error.status === 404;
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <BackLink />
        <div className="mt-8">
          <EmptyState
            icon={AlertCircle}
            title={notFound ? "Contract not found" : "Could not load this contract"}
            description={
              error instanceof ApiError ? error.detail : "Something went wrong."
            }
            action={
              notFound ? (
                <Button asChild variant="outline">
                  <Link href="/dashboard">Back to dashboard</Link>
                </Button>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => refetch()}
                  disabled={isRefetching}
                >
                  {isRefetching ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : null}
                  Try again
                </Button>
              )
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <BackLink />

      <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-display text-3xl font-semibold tracking-tight break-all">
              {contract.original_name}
            </h1>
            <StatusBadge status={contract.status} />
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <Calendar className="size-3.5" aria-hidden="true" />
              {formatDateTime(contract.upload_date)}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <BookOpenText className="size-3.5" aria-hidden="true" />
              {formatNumber(contract.page_count)}{" "}
              {contract.page_count === 1 ? "page" : "pages"}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Hash className="size-3.5" aria-hidden="true" />
              {formatNumber(contract.word_count)} words
            </span>
          </div>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab} className="mt-8">
        <TabsList>
          <TabsTrigger value="overview">
            <LayoutDashboard aria-hidden="true" /> Overview
          </TabsTrigger>
          <TabsTrigger value="document">
            <FileText aria-hidden="true" /> Document
          </TabsTrigger>
          <TabsTrigger value="analysis">
            <Sparkles aria-hidden="true" /> Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab contract={contract} onAnalyzeClick={() => setTab("analysis")} />
        </TabsContent>
        <TabsContent value="document">
          <DocumentTab contract={contract} />
        </TabsContent>
        <TabsContent value="analysis">
          <AnalysisPanel contract={contract} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/dashboard"
      className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40"
    >
      <ArrowLeft className="size-4" aria-hidden="true" />
      All contracts
    </Link>
  );
}

function OverviewTab({
  contract,
  onAnalyzeClick,
}: {
  contract: Contract;
  onAnalyzeClick: () => void;
}) {
  const { data: cached } = useCachedAnalysis(contract.id);

  const fields = [
    { label: "Original filename", value: contract.original_name },
    { label: "Stored as", value: contract.filename, mono: true },
    { label: "Uploaded", value: formatDateTime(contract.upload_date) },
    {
      label: "Length",
      value: `${formatNumber(contract.page_count)} ${contract.page_count === 1 ? "page" : "pages"} · ${formatNumber(contract.word_count)} words`,
    },
    { label: "Contract ID", value: contract.id, mono: true },
  ];

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Metadata</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="divide-y divide-border/60">
            {fields.map((field) => (
              <div
                key={field.label}
                className="flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
              >
                <dt className="shrink-0 text-sm text-muted-foreground">
                  {field.label}
                </dt>
                <dd
                  className={
                    field.mono
                      ? "min-w-0 text-right font-mono text-xs break-all"
                      : "min-w-0 text-right text-sm font-medium break-all"
                  }
                >
                  {field.value}
                </dd>
              </div>
            ))}
            <div className="flex items-center justify-between gap-4 py-3">
              <dt className="text-sm text-muted-foreground">Status</dt>
              <dd>
                <StatusBadge status={contract.status} />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Risk snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          {cached ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Badge
                  variant="outline"
                  className={`capitalize ${SEVERITY_META[cached.overall_risk_level].badgeClass}`}
                >
                  {SEVERITY_META[cached.overall_risk_level].label} risk
                </Badge>
                {cached.contract_type ? (
                  <Badge variant="secondary" className="capitalize">
                    {cached.contract_type}
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">
                {cached.key_clauses.length} key{" "}
                {cached.key_clauses.length === 1 ? "clause" : "clauses"} ·{" "}
                {cached.risk_flags.length} risk{" "}
                {cached.risk_flags.length === 1 ? "flag" : "flags"} ·{" "}
                {cached.recommendations.length}{" "}
                {cached.recommendations.length === 1 ? "recommendation" : "recommendations"}
              </p>
              <Button variant="outline" onClick={onAnalyzeClick}>
                View full analysis
                <ArrowRight aria-hidden="true" />
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {contract.status === "analyzed"
                  ? "This contract was analyzed in a previous session — the API cannot serve past results yet, so run the analysis again to view them."
                  : "No analysis has been run in this session. Gemini will summarize the contract, extract key clauses, and flag risks by severity."}
              </p>
              <Button onClick={onAnalyzeClick}>
                <Sparkles aria-hidden="true" />
                Analyze with Gemini
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function DocumentTab({ contract }: { contract: Contract }) {
  const [copied, setCopied] = useState(false);

  const copyText = async () => {
    try {
      await navigator.clipboard.writeText(contract.text_content);
      setCopied(true);
      toast.success("Extracted text copied to clipboard.");
      setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Could not copy the text.");
    }
  };

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-4 space-y-0">
        <div>
          <CardTitle>Extracted text</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNumber(contract.word_count)} words across{" "}
            {formatNumber(contract.page_count)}{" "}
            {contract.page_count === 1 ? "page" : "pages"}, as parsed from the
            uploaded file.
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={copyText}
          disabled={!contract.text_content}
          aria-label="Copy extracted text to clipboard"
        >
          {copied ? (
            <Check className="text-primary" aria-hidden="true" />
          ) : (
            <Copy aria-hidden="true" />
          )}
          {copied ? "Copied" : "Copy"}
        </Button>
      </CardHeader>
      <CardContent>
        {contract.text_content ? (
          <ScrollArea className="h-[60vh] rounded-lg border border-border/70 bg-muted/30">
            <pre className="p-5 font-mono text-[13px] leading-relaxed whitespace-pre-wrap text-foreground/90">
              {contract.text_content}
            </pre>
          </ScrollArea>
        ) : (
          <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            No text could be extracted from this file.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

/** Skeleton mirrors the detail layout — header, tabs, and content cards. */
function ContractDetailSkeleton() {
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
            <Skeleton className="h-9 w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}
