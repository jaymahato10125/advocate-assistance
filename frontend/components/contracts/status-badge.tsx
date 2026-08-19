import { AlertCircle, CheckCircle2, CircleDashed, FileWarning, Loader2, type LucideIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { ContractStatus } from "@/types/contract";

interface StatusMeta {
  label: string;
  icon: LucideIcon;
  className: string;
  iconClassName?: string;
}

/**
 * Contract status is a state machine:
 * uploaded → analyzing → analyzed | not_a_contract | error.
 * Each state gets a distinct color + icon everywhere a contract appears.
 */
export const CONTRACT_STATUS_META: Record<ContractStatus, StatusMeta> = {
  uploaded: {
    label: "Uploaded",
    icon: CircleDashed,
    className: "border-border bg-secondary text-secondary-foreground",
  },
  analyzing: {
    label: "Analyzing",
    icon: Loader2,
    className: "border-risk-medium/30 bg-risk-medium/10 text-risk-medium",
    iconClassName: "animate-spin",
  },
  analyzed: {
    label: "Analyzed",
    icon: CheckCircle2,
    className: "border-primary/30 bg-primary/10 text-primary",
  },
  not_a_contract: {
    label: "Not a contract",
    icon: FileWarning,
    className: "border-risk-medium/30 bg-risk-medium/10 text-risk-medium",
  },
  error: {
    label: "Error",
    icon: AlertCircle,
    className:
      "border-destructive/30 bg-destructive/10 text-destructive dark:text-risk-critical",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: ContractStatus;
  className?: string;
}) {
  const meta = CONTRACT_STATUS_META[status] ?? CONTRACT_STATUS_META.uploaded;
  const Icon = meta.icon;

  return (
    <Badge variant="outline" className={cn(meta.className, className)}>
      <Icon className={cn(meta.iconClassName)} aria-hidden="true" />
      {meta.label}
    </Badge>
  );
}
