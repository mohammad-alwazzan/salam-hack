"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getBudgetOptions, getBudgetImpactOptions, postBudgetMutation, getBudgetQueryKey } from "@/gen/api/@tanstack/react-query.gen";
import type { PostBudgetData } from "@/gen/api/types.gen";

export type BudgetCategory = {
  id: number;
  budgetMonthId: number;
  name: string;
  type: "fixed" | "discretionary";
  allocated: number;
  priority: number;
  emoji: string;
  spent: number;
  remaining: number;
};

export type BudgetData = {
  month: string;
  totalIncome: number;
  categories: BudgetCategory[];
};

export function useBudget() {
  const queryClient = useQueryClient();

  const { data: budgetResponse, isLoading, error, refetch } = useQuery(getBudgetOptions());
  const budget = (budgetResponse ?? null) as BudgetData | null;

  const upsertMutation = useMutation({
    ...postBudgetMutation(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: getBudgetQueryKey() });
    },
  });

  const checkImpact = async (amount: number) => {
    // We use fetchQuery here if we want a one-off check, or we could use a separate hook
    const result = await queryClient.fetchQuery(getBudgetImpactOptions({
      query: { amount }
    }));
    return result;
  };

  const handleUpsertBudget = async (budgetData: PostBudgetData['body']) => {
    try {
      const data = await upsertMutation.mutateAsync({
        body: budgetData
      });
      return { success: true, budget: data };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  return {
    budget,
    isLoading,
    error: error ? error.message : null,
    refresh: refetch,
    checkImpact,
    upsertBudget: handleUpsertBudget,
  };
}
