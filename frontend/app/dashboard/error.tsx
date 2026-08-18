"use client";

import { AlertCircle } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
      <EmptyState
        icon={AlertCircle}
        title="The dashboard failed to render"
        description="An unexpected error occurred. Retry — your contracts are stored server-side and are not affected."
        action={<Button onClick={reset}>Try again</Button>}
      />
    </div>
  );
}
