"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { useState, type ReactNode } from "react";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ApiError } from "@/lib/api-client";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000,
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              // Client errors (4xx) are never transient — don't retry them.
              if (
                error instanceof ApiError &&
                error.status >= 400 &&
                error.status < 500
              ) {
                return false;
              }
              return failureCount < 2;
            },
          },
        },
      }),
  );

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
    >
      <QueryClientProvider client={queryClient}>
        {/* reducedMotion="user" honors prefers-reduced-motion globally. */}
        <MotionConfig reducedMotion="user">
          <TooltipProvider delayDuration={200}>
            {children}
            <Toaster />
          </TooltipProvider>
        </MotionConfig>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
