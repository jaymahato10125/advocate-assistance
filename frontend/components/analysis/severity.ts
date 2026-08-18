import type { RiskLevel } from "@/types/contract";

interface SeverityMeta {
  label: string;
  /** 0–100 position on the risk gauge. */
  gaugeValue: number;
  badgeClass: string;
  textClass: string;
  blurb: string;
}

export const SEVERITY_ORDER: RiskLevel[] = ["low", "medium", "high", "critical"];

export const SEVERITY_META: Record<RiskLevel, SeverityMeta> = {
  low: {
    label: "Low",
    gaugeValue: 16,
    badgeClass: "border-risk-low/30 bg-risk-low/10 text-risk-low",
    textClass: "text-risk-low",
    blurb: "Standard terms — nothing unusual detected.",
  },
  medium: {
    label: "Medium",
    gaugeValue: 44,
    badgeClass: "border-risk-medium/30 bg-risk-medium/10 text-risk-medium",
    textClass: "text-risk-medium",
    blurb: "Some terms deserve a closer look before signing.",
  },
  high: {
    label: "High",
    gaugeValue: 72,
    badgeClass: "border-risk-high/30 bg-risk-high/10 text-risk-high",
    textClass: "text-risk-high",
    blurb: "Material exposure — negotiate the flagged clauses.",
  },
  critical: {
    label: "Critical",
    gaugeValue: 94,
    badgeClass: "border-risk-critical/30 bg-risk-critical/10 text-risk-critical",
    textClass: "text-risk-critical",
    blurb: "Severe exposure — do not sign without legal counsel.",
  },
};
