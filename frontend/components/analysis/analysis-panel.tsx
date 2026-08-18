"use client";

import { motion, type Variants } from "framer-motion";
import { ListChecks, RefreshCw, ScrollText, ShieldAlert, Sparkles, TriangleAlert } from "lucide-react";
import { useEffect } from "react";
import { toast } from "sonner";

import { KeyClauseList } from "@/components/analysis/key-clause-list";
import { RecommendationsList } from "@/components/analysis/recommendations-list";
import { RiskFlagList } from "@/components/analysis/risk-flag-list";
import { RiskGauge } from "@/components/analysis/risk-gauge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useAnalyzeContract, useCachedAnalysis } from "@/hooks/use-analysis";
import { ApiError } from "@/lib/api-client";
import type { Contract } from "@/types/contract";

const staggerContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const staggerItem: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" } },
};

/**
 * Analysis results are loaded from the API and cached client-side for the
 * current session. A POST analysis response updates the same query cache.
 */
export function AnalysisPanel({ contract }: { contract: Contract }) {
  const { data: cached } = useCachedAnalysis(contract.id);
  const analyze = useAnalyzeContract(contract.id);

  useEffect(() => {
    if (analyze.isError) {
      toast.error("Analysis failed", {
        description:
          analyze.error instanceof ApiError
            ? analyze.error.detail
            : "Something went wrong while running the analysis.",
      });
    }
  }, [analyze.isError, analyze.error]);

  const runAnalysis = () => {
    analyze.mutate(undefined, {
      onSuccess: () =>
        toast.success("Analysis complete", {
          description: "Key clauses, risk flags, and recommendations are ready.",
        }),
    });
  };

  return (
    <div className="space-y-6">
      {analyze.isError ? (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/[0.06] p-4"
        >
          <TriangleAlert
            className="mt-0.5 size-5 shrink-0 text-destructive dark:text-risk-critical"
            aria-hidden="true"
          />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-destructive dark:text-risk-critical">
              Analysis failed
            </p>
            <p className="mt-1 text-sm break-words text-muted-foreground">
              {analyze.error instanceof ApiError
                ? analyze.error.detail
                : "Something went wrong while running the analysis."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0"
            onClick={runAnalysis}
            disabled={analyze.isPending}
          >
            <RefreshCw aria-hidden="true" />
            Retry
          </Button>
        </div>
      ) : null}

      {analyze.isPending ? (
        <AnalysisInProgress />
      ) : cached ? (
        <motion.div
          key="results"
          variants={staggerContainer}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          <div className="grid gap-6 lg:grid-cols-5">
            <motion.div variants={staggerItem} className="lg:col-span-3">
              <Card className="h-full">
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <CardTitle className="flex items-center gap-2">
                      <ScrollText className="size-4 text-primary" aria-hidden="true" />
                      Summary
                    </CardTitle>
                    {cached.contract_type ? (
                      <Badge variant="secondary" className="capitalize">
                        {cached.contract_type}
                      </Badge>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {cached.summary}
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div variants={staggerItem} className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="size-4 text-primary" aria-hidden="true" />
                    Overall risk
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <RiskGauge level={cached.overall_risk_level} />
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <motion.div variants={staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle>Key clauses</CardTitle>
              </CardHeader>
              <CardContent>
                <KeyClauseList clauses={cached.key_clauses} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle>Risk flags</CardTitle>
              </CardHeader>
              <CardContent>
                <RiskFlagList flags={cached.risk_flags} />
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={staggerItem}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListChecks className="size-4 text-primary" aria-hidden="true" />
                  Recommendations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecommendationsList recommendations={cached.recommendations} />
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>
      ) : (
        <EmptyState
          icon={Sparkles}
          title="Not analyzed yet"
          description={
            contract.status === "analyzed"
              ? "This contract was analyzed in a previous session, but the API can't serve past results yet. Run the analysis again to view them."
              : "Run a Gemini analysis to surface the summary, key clauses, severity-tagged risk flags, and recommendations for this contract."
          }
          action={
            <Button size="lg" onClick={runAnalysis}>
              <Sparkles aria-hidden="true" />
              Analyze with Gemini
            </Button>
          }
        />
      )}
    </div>
  );
}

/** Skeleton mirrors the results layout while Gemini runs — no bare spinner. */
function AnalysisInProgress() {
  return (
    <div className="space-y-6" aria-live="polite" aria-busy="true">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <Sparkles className="size-4 animate-pulse-soft text-primary" aria-hidden="true" />
        Gemini is reading the contract — this can take up to a minute…
      </p>
      <div className="grid gap-6 lg:grid-cols-5">
        <Card className="lg:col-span-3">
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="space-y-2.5">
            <Skeleton className="h-3.5 w-full" />
            <Skeleton className="h-3.5 w-11/12" />
            <Skeleton className="h-3.5 w-4/5" />
            <Skeleton className="h-3.5 w-2/3" />
          </CardContent>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader>
            <Skeleton className="h-4 w-24" />
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3 pb-8">
            <Skeleton className="h-24 w-48 rounded-t-full rounded-b-none" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-3 w-40" />
          </CardContent>
        </Card>
      </div>
      {["Key clauses", "Risk flags", "Recommendations"].map((section) => (
        <Card key={section}>
          <CardHeader>
            <Skeleton className="h-4 w-28" />
          </CardHeader>
          <CardContent className="space-y-3">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
