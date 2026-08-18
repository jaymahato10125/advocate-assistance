"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { contractKeys } from "@/hooks/use-contracts";
import { ApiError, api } from "@/lib/api-client";
import type { AnalysisResult } from "@/types/contract";

export const analysisKeys = {
  byContract: (contractId: string) => ["analysis", contractId] as const,
};

export function useCachedAnalysis(contractId: string) {
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
