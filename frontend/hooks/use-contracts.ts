"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

export const contractKeys = {
  all: ["contracts"] as const,
  detail: (id: string) => ["contracts", id] as const,
};

/**
 * How often to re-fetch contracts while a background analysis is running
 * server-side, so status badges flip from "analyzing" on their own.
 */
export const CONTRACT_STATUS_POLL_INTERVAL_MS = 3000;

export function useContracts() {
  return useQuery({
    queryKey: contractKeys.all,
    queryFn: api.listContracts,
    refetchInterval: (query) =>
      query.state.data?.some((contract) => contract.status === "analyzing")
        ? CONTRACT_STATUS_POLL_INTERVAL_MS
        : false,
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => api.getContract(id),
    refetchInterval: (query) =>
      query.state.data?.status === "analyzing"
        ? CONTRACT_STATUS_POLL_INTERVAL_MS
        : false,
  });
}

interface UploadVariables {
  file: File;
  onProgress?: (percent: number) => void;
}

export function useUploadContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ file, onProgress }: UploadVariables) =>
      api.uploadContract(file, onProgress),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}

export function useDeleteContract() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => api.deleteContract(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: contractKeys.detail(id) });
      void queryClient.invalidateQueries({ queryKey: contractKeys.all });
    },
  });
}
