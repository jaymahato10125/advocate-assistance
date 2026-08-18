import { ArrowUpRight, FileText } from "lucide-react";
import Link from "next/link";

import { StatusBadge } from "@/components/contracts/status-badge";
import { Card } from "@/components/ui/card";
import { formatDate, formatNumber } from "@/lib/utils";
import type { Contract } from "@/types/contract";

export function ContractCard({ contract }: { contract: Contract }) {
  return (
    <Link
      href={`/dashboard/contracts/${contract.id}`}
      className="group block rounded-xl outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
      aria-label={`Open ${contract.original_name}`}
    >
      <Card className="flex h-full flex-col gap-4 p-5 transition-colors duration-200 group-hover:border-primary/40">
        <div className="flex items-start justify-between gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <FileText className="size-5" aria-hidden="true" />
          </span>
          <StatusBadge status={contract.status} />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium">{contract.original_name}</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatNumber(contract.page_count)}{" "}
            {contract.page_count === 1 ? "page" : "pages"} ·{" "}
            {formatNumber(contract.word_count)} words
          </p>
        </div>

        <div className="flex items-center justify-between border-t border-border/60 pt-3 text-xs text-muted-foreground">
          <span>Uploaded {formatDate(contract.upload_date)}</span>
          <ArrowUpRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary"
            aria-hidden="true"
          />
        </div>
      </Card>
    </Link>
  );
}
