"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { contractKeys } from "@/hooks/use-contracts";
import { ApiError, api } from "@/lib/api-client";
import type { AnalysisResult } from "@/types/contract";

export const analysisKeys = {
  byContract: (contractId: string) => ["analysis", contractId] as const,
};

/** How often to re-check for a saved analysis while Gemini runs server-side. */
export const ANALYSIS_POLL_INTERVAL_MS = 3000;

export function useCachedAnalysis(contractId: string, polling = false) {
  return useQuery<AnalysisResult | null>({
    queryKey: analysisKeys.byContract(contractId),
    queryFn: async () => {
      try {
        return await api.getAnalysisByContract(contractId);
      } catch (error) {
        // A contract without a saved analysis is an expected empty state.
        if (error instanceof ApiError && error.status === 404) return null;
        throw error;
      }
    },
    enabled: Boolean(contractId),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
    // While a background analysis runs, poll for the saved result so the
    // report appears on its own the moment Gemini finishes.
    refetchInterval: polling ? ANALYSIS_POLL_INTERVAL_MS : false,
  });
}

export function useAnalyzeContract(contractId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => api.analyzeContract(contractId),
    onSuccess: () => {
      // The endpoint answers 202 immediately and analyzes in the background;
      // the contract status is now "analyzing" — refresh it so the polling
      // in useContract / useContracts takes over until it flips to
      // "analyzed" or "error".
      void queryClient.invalidateQueries({
        queryKey: contractKeys.detail(contractId),
      });
      void queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}
