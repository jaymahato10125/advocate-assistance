"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { StatusBadge } from "@/components/contracts/status-badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDate, formatNumber } from "@/lib/utils";
import type { Contract } from "@/types/contract";

export function ContractTable({ contracts }: { contracts: Contract[] }) {
  const router = useRouter();

  return (
    <div className="rounded-xl border border-border/80 bg-card">
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead>Contract</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden sm:table-cell">Pages</TableHead>
            <TableHead className="hidden md:table-cell">Words</TableHead>
            <TableHead className="hidden lg:table-cell">Uploaded</TableHead>
            <TableHead className="w-10">
              <span className="sr-only">Open contract</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contracts.map((contract) => (
            <TableRow
              key={contract.id}
              className="cursor-pointer"
              onClick={() => router.push(`/dashboard/contracts/${contract.id}`)}
            >
              <TableCell>
                <Link
                  href={`/dashboard/contracts/${contract.id}`}
                  className="block rounded-sm font-medium outline-none hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  {contract.original_name}
                </Link>
                <span className="mt-0.5 block max-w-56 truncate font-mono text-xs text-muted-foreground">
                  {contract.filename}
                </span>
              </TableCell>
              <TableCell>
                <StatusBadge status={contract.status} />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {formatNumber(contract.page_count)}
              </TableCell>
              <TableCell className="hidden md:table-cell">
                {formatNumber(contract.word_count)}
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                {formatDate(contract.upload_date)}
              </TableCell>
              <TableCell>
                <ChevronRight
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
