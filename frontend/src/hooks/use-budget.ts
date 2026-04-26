"use client";

import { useQuery } from '@tanstack/react-query';
import { getBudgetOptions } from '@/src/gen/api/@tanstack/react-query.gen';
import type { BudgetSummary } from './use-agent-chat';

export function useBudget() {
  const { data, isLoading, error } = useQuery(getBudgetOptions());

  return {
    budget: data as unknown as BudgetSummary,
    isLoading,
    error,
  };
}
