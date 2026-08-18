"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { contractKeys } from "@/hooks/use-contracts";
import { api } from "@/lib/api-client";
import type { AnalysisResult } from "@/types/contract";

export const analysisKeys = {
  byContract: (contractId: string) => ["analysis", contractId] as const,
};

/**
 * The backend has no GET endpoint for analysis results yet, so the only
 * place an analysis exists on the client is in this in-memory cache, keyed
 * by contract id, for the duration of the session. The query never fetches
 * (enabled: false) — it is populated exclusively by useAnalyzeContract's
 * onSuccess via setQueryData.
 */
export function useCachedAnalysis(contractId: string) {
  return useQuery<AnalysisResult>({
    queryKey: analysisKeys.byContract(contractId),
    // Never fires (enabled: false) — data only enters this cache via
    // queryClient.setQueryData in useAnalyzeContract's onSuccess.
    queryFn: () =>
      Promise.reject(
        new Error(
          "Analysis results cannot be re-fetched yet — run the analysis to view them.",
        ),
      ),
    enabled: false,
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  });
}

export function useAnalyzeContract(contractId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.analyzeContract(contractId),
    onSuccess: (response) => {
      queryClient.setQueryData(
        analysisKeys.byContract(contractId),
        response.analysis,
      );
      // The contract status flips to "analyzed" server-side — refresh it.
      void queryClient.invalidateQueries({
        queryKey: contractKeys.detail(contractId),
      });
      void queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}
