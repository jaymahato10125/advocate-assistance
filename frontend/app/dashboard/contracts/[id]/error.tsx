"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";

export default function ContractDetailError({
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
        title="Something broke on this page"
        description="The contract view failed to render. You can retry — if it keeps happening, the extracted document may be malformed."
        action={
          <div className="flex gap-2">
            <Button onClick={reset}>Try again</Button>
            <Button asChild variant="outline">
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        }
      />
    </div>
  );
}
