"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBankAccountsOptions, postBankAccountsMutation, getBankAccountsQueryKey } from "@/gen/api/@tanstack/react-query.gen";
import type { PostBankAccountsData } from "@/gen/api/types.gen";

export function useBankAccounts() {
  const queryClient = useQueryClient();

  const { data: accounts = [], isLoading, error, refetch } = useQuery(getBankAccountsOptions());

  const createMutation = useMutation({
    ...postBankAccountsMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getBankAccountsQueryKey() });
    },
  });

  const handleCreateAccount = async (account: PostBankAccountsData['body']) => {
    try {
      const data = await createMutation.mutateAsync({
        body: account
      });
      return { success: true, account: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    accounts: accounts as any[],
    isLoading,
    error: error ? error.message : null,
    refresh: refetch,
    createAccount: handleCreateAccount,
  };
}
