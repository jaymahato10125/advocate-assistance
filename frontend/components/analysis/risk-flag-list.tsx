"use client";

import { AlertTriangle, ArrowRight, OctagonAlert, ShieldAlert, ShieldCheck, type LucideIcon } from "lucide-react";

import { SEVERITY_META } from "@/components/analysis/severity";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { RiskFlag, RiskLevel } from "@/types/contract";

const SEVERITY_ICONS: Record<RiskLevel, LucideIcon> = {
  low: ShieldCheck,
  medium: ShieldAlert,
  high: AlertTriangle,
  critical: OctagonAlert,
};

const SEVERITY_BORDER: Record<RiskLevel, string> = {
  low: "border-l-risk-low",
  medium: "border-l-risk-medium",
  high: "border-l-risk-high",
  critical: "border-l-risk-critical",
};

export function RiskFlagList({ flags }: { flags: RiskFlag[] }) {
  if (flags.length === 0) {
    return (
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <ShieldCheck className="size-4 text-risk-low" aria-hidden="true" />
        No risk flags were raised for this contract.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {flags.map((flag, index) => {
        const meta = SEVERITY_META[flag.risk_level] ?? SEVERITY_META.low;
        const Icon = SEVERITY_ICONS[flag.risk_level] ?? ShieldCheck;
        return (
          <li
            key={`${flag.risk_title}-${index}`}
            className={cn(
              "rounded-lg rounded-l-none border border-l-4 border-border/80 bg-card p-4",
              SEVERITY_BORDER[flag.risk_level] ?? SEVERITY_BORDER.low,
            )}
          >
            <div className="flex flex-wrap items-center gap-2">
              <Icon className={cn("size-4 shrink-0", meta.textClass)} aria-hidden="true" />
              <h4 className="text-sm font-semibold">{flag.risk_title}</h4>
              <Badge variant="outline" className={cn("ml-auto capitalize", meta.badgeClass)}>
                {meta.label}
              </Badge>
            </div>

            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              {flag.description}
            </p>

            {flag.recommendation ? (
              <p className="mt-3 flex items-start gap-2 rounded-md bg-muted/60 px-3 py-2 text-sm">
                <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
                <span>
                  <span className="font-medium">Recommendation:</span>{" "}
                  {flag.recommendation}
                </span>
              </p>
            ) : null}

            {flag.clause_reference ? (
              <p className="mt-2 font-mono text-xs text-muted-foreground">
                Ref: {flag.clause_reference}
              </p>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
