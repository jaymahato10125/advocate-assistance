"use client";

import { AlertCircle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function RootError({
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
    <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="size-6 text-destructive" aria-hidden="true" />
      </span>
      <h1 className="mt-5 font-display text-3xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        An unexpected error occurred while rendering this page. You can retry
        without losing any server-side data.
      </p>
      <div className="mt-6 flex gap-2">
        <Button onClick={reset}>Try again</Button>
        <Button asChild variant="outline">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </div>
  );
}
