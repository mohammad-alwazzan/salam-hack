"use client";

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTransactionsOptions,
  postTransactionsMutation,
  getTransactionsQueryKey,
  getBudgetQueryKey,
} from '@/src/gen/api/@tanstack/react-query.gen';
import type { PostTransactionsData } from '@/src/gen/api/types.gen';
import type { Transaction } from './use-agent-chat';

export function useTransactions() {
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery(getTransactionsOptions());

  const logMutation = useMutation({
    ...postTransactionsMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getTransactionsQueryKey() });
      queryClient.invalidateQueries({ queryKey: getBudgetQueryKey() });
      // Also invalidate bank accounts as balance might have changed
      queryClient.invalidateQueries({ queryKey: ['getBankAccounts'] });
    },
  });

  const handleLogTransaction = async (data: PostTransactionsData['body']) => {
    try {
      const result = await logMutation.mutateAsync({
        body: data,
      });
      return { success: true, transaction: result };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    transactions: data as unknown as Transaction[],
    isLoading,
    error,
    logTransaction: handleLogTransaction,
  };
}
