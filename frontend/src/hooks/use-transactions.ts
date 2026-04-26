"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  getTransactionsOptions, 
  postTransactionsMutation,
  getTransactionsQueryKey,
  getBudgetQueryKey,
  getBankAccountsQueryKey
} from "@/gen/api/@tanstack/react-query.gen";
import type { PostTransactionsData } from "@/gen/api/types.gen";

export function useTransactions() {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading, error, refetch } = useQuery(getTransactionsOptions());

  const logMutation = useMutation({
    ...postTransactionsMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getTransactionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getBudgetQueryKey() });
      queryClient.invalidateQueries({ queryKey: getBankAccountsQueryKey() });
    },
  });

  const handleLogTransaction = async (transaction: PostTransactionsData['body']) => {
    try {
      const data = await logMutation.mutateAsync({
        body: transaction
      });
      return { success: true, transaction: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    transactions: transactions as any[],
    isLoading,
    error: error ? error.message : null,
    refresh: refetch,
    logTransaction: handleLogTransaction,
  };
}
