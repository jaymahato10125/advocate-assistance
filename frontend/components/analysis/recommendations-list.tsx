"use client";

export function RecommendationsList({ recommendations }: { recommendations: string[] }) {
  if (recommendations.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        No recommendations were generated for this contract.
      </p>
    );
  }

  return (
    <ol className="space-y-2.5">
      {recommendations.map((recommendation, index) => (
        <li key={index} className="flex items-start gap-3 text-sm leading-relaxed">
          <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-[10px] font-semibold text-primary">
            {index + 1}
          </span>
          <span>{recommendation}</span>
        </li>
      ))}
    </ol>
  );
}
