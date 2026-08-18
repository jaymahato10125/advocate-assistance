import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <p className="font-display text-7xl font-semibold tracking-tight text-primary">
        404
      </p>
      <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">
        This page is not on the record
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        The route you asked for does not exist. Head back to the dashboard to
        review your contracts, or to the landing page.
      </p>
      <div className="mt-6 flex gap-2">
        <Button asChild>
          <Link href="/dashboard">Open dashboard</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Back home</Link>
        </Button>
      </div>
    </div>
  );
}
