"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBillsOptions, postBillsMutation, postBillsByIdPayMutation } from "@/src/gen/api/@tanstack/react-query.gen";
import type { PostBillsData, PostBillsByIdPayData } from "@/src/gen/api/types.gen";

export function useBills() {
  const queryClient = useQueryClient();

  const { data: bills = [], isLoading, error, refetch } = useQuery(getBillsOptions());

  const createMutation = useMutation({
    ...postBillsMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getBills'] });
    },
  });

  const payMutation = useMutation({
    ...postBillsByIdPayMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['getBills'] });
      // Also invalidate bank accounts as balance might have changed
      queryClient.invalidateQueries({ queryKey: ['getBankAccounts'] });
    },
  });

  const handlePayBill = async (billId: number, bankAccountId: number) => {
    try {
      const data = await payMutation.mutateAsync({
        path: { id: String(billId) },
        body: { bankAccountId }
      });
      return { success: true, bill: (data as any).bill };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const handleCreateBill = async (bill: PostBillsData['body']) => {
    try {
      const data = await createMutation.mutateAsync({
        body: bill
      });
      return { success: true, bill: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    bills: bills as any[],
    isLoading,
    error: error ? error.message : null,
    refresh: refetch,
    payBill: handlePayBill,
    createBill: handleCreateBill,
  };
}
