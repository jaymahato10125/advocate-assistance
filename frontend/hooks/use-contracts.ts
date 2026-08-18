"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { api } from "@/lib/api-client";

export const contractKeys = {
  all: ["contracts"] as const,
  detail: (id: string) => ["contracts", id] as const,
};

export function useContracts() {
  return useQuery({
    queryKey: contractKeys.all,
    queryFn: api.listContracts,
  });
}

export function useContract(id: string) {
  return useQuery({
    queryKey: contractKeys.detail(id),
    queryFn: () => api.getContract(id),
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
