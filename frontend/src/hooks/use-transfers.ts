"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getTransfersOptions, postTransfersMutation } from "@/gen/api/@tanstack/react-query.gen";
import type { PostTransfersData } from "@/gen/api/types.gen";

export function useTransfers() {
  const queryClient = useQueryClient();

  const { data: transfers = [], isLoading, error, refetch } = useQuery(getTransfersOptions());

  const executeMutation = useMutation({
    ...postTransfersMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getTransfers'] });
      // Transfers affect balances and transactions
      queryClient.invalidateQueries({ queryKey: ['getBankAccounts'] });
      queryClient.invalidateQueries({ queryKey: ['getTransactions'] });
    },
  });

  const handleExecuteTransfer = async (transfer: PostTransfersData['body']) => {
    try {
      const data = await executeMutation.mutateAsync({
        body: transfer
      });
      return { success: true, result: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    transfers: transfers as any[],
    isLoading,
    error: error ? error.message : null,
    refresh: refetch,
    executeTransfer: handleExecuteTransfer,
  };
}
