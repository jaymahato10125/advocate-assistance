"use client";

import { BadgeCheck, CircleAlert } from "lucide-react";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { ClauseAnalysis } from "@/types/contract";

export function KeyClauseList({ clauses }: { clauses: ClauseAnalysis[] }) {
  if (clauses.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Gemini did not identify any key clauses in this contract.
      </p>
    );
  }

  return (
    <Accordion type="multiple" className="w-full">
      {clauses.map((clause, index) => (
        <AccordionItem key={`${clause.clause_title}-${index}`} value={`clause-${index}`}>
          <AccordionTrigger>
            <span className="flex min-w-0 flex-1 items-center gap-3">
              <span
                className="font-mono text-xs text-muted-foreground"
                aria-hidden="true"
              >
                {String(index + 1).padStart(2, "0")}
              </span>
              <span className="truncate">{clause.clause_title}</span>
              <Badge
                variant="outline"
                className={
                  clause.is_standard
                    ? "ml-auto shrink-0 border-primary/30 bg-primary/10 text-primary"
                    : "ml-auto shrink-0 border-risk-medium/30 bg-risk-medium/10 text-risk-medium"
                }
              >
                {clause.is_standard ? (
                  <>
                    <BadgeCheck aria-hidden="true" /> Standard
                  </>
                ) : (
                  <>
                    <CircleAlert aria-hidden="true" /> Non-standard
                  </>
                )}
              </Badge>
            </span>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 pl-7">
              <blockquote className="rounded-r-lg border-l-2 border-gold/60 bg-muted/50 px-4 py-3 font-mono text-xs leading-relaxed text-muted-foreground">
                {clause.clause_text}
              </blockquote>
              <p className="text-sm leading-relaxed">{clause.explanation}</p>
            </div>
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
