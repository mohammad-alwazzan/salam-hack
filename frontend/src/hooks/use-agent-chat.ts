'use client';

import { useChat } from '@ai-sdk/react';
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';
import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import {
  getBankAccountsQueryKey,
  getBillsQueryKey,
  getBudgetQueryKey,
  getTransactionsQueryKey,
} from '@/gen/api/@tanstack/react-query.gen';

// ── Shared primitives ─────────────────────────────────────────────────────────

export type BankAccount = {
  id: number;
  bankName: string;
  accountName: string;
  accountNumber: string;
  balance: number;
  currency: string;
  createdAt: string | null;
};

export type BudgetCategory = {
  id: number;
  budgetMonthId: number;
  name: string;
  type: 'fixed' | 'discretionary';
  allocated: number;
  priority: number;
  emoji: string;
  spent: number;
};

export type BudgetSummary = {
  month: string;
  totalIncome: number;
  currency: string;
  totalSpent: number;
  remaining: number;
  categories: BudgetCategory[];
} | null;

export type Alert = {
  type: 'bill_due' | 'over_budget' | 'recurring_pattern';
  severity: 'high' | 'medium' | 'low';
  message: string;
  data: Record<string, unknown>;
};

export type Transaction = {
  id: number;
  description: string;
  amount: number;
  categoryId: number | null;
  bankAccountId: number | null;
  source: 'voice' | 'text' | 'manual';
  date: string;
  createdAt: string | null;
};

// ── Tool inputs ───────────────────────────────────────────────────────────────

export type GetFinancialSummaryInput = Record<string, never>;

export type LogTransactionInput = {
  description: string;
  amount: number;
  categoryId?: number;
  bankAccountId?: number;
  source: 'voice' | 'text' | 'manual';
  date: string;
};

export type ExecuteTransferInput = {
  fromBankAccountId: number;
  amount: number;
  recipient: string;
  note?: string;
};

export type CheckPurchaseImpactInput = {
  amount: number;
};

export type GetAlertsInput = Record<string, never>;

export type ShowOptionsInput = {
  title: string;
  options: Array<{
    label: string;
    value: string;
  }>;
};

// ── Tool results ──────────────────────────────────────────────────────────────

export type GetFinancialSummaryResult = {
  accounts: BankAccount[];
  budget: BudgetSummary;
  alerts: Alert[];
};

export type LogTransactionResult = {
  transaction: Transaction;
};

export type ExecuteTransferResult =
  | { success: true; account: BankAccount; transaction: Transaction }
  | { success: false; error: string };

export type CheckPurchaseImpactResult =
  | {
      purchaseAmount: number;
      remainingBefore: number;
      remainingAfter: number;
      percentOfBudgetUsedAfter: number;
      verdict: 'comfortable' | 'tight' | 'over';
      mostImpactedCategory: { name: string; remaining: number } | null;
    }
  | { error: string };

export type GetAlertsResult = {
  alerts: Alert[];
};

export type ShowOptionsResult = {
  selectedLabel: string;
  selectedValue: string;
};

// ── Discriminated union of all tool calls ─────────────────────────────────────

export type AgentToolCall = { toolCallId: string } & (
  | {
      toolName: 'getFinancialSummary';
      input: GetFinancialSummaryInput;
    }
  | {
      toolName: 'logTransaction';
      input: LogTransactionInput;
    }
  | {
      toolName: 'executeTransfer';
      input: ExecuteTransferInput;
    }
  | {
      toolName: 'checkPurchaseImpact';
      input: CheckPurchaseImpactInput;
    }
  | { toolName: 'getAlerts'; input: GetAlertsInput }
  | { toolName: 'showOptions'; input: ShowOptionsInput }
  | { toolName: 'payBill'; input: { billId: number; bankAccountId: number } }
);

const MUTATION_TOOLS = new Set([
  'logTransaction',
  'initiateTransfer',
  'payBill',
]);

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAgentChat() {
  const [currentTool, setCurrentTool] = useState<AgentToolCall | null>(null);
  const queryClient = useQueryClient();

  const { messages, sendMessage, status, error, addToolOutput } = useChat({
    transport: new DefaultChatTransport({
      api: 'http://localhost:3001/agent/chat',
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    onToolCall({ toolCall }) {
      const tool = toolCall as AgentToolCall;
      setCurrentTool(tool);

      if (MUTATION_TOOLS.has(tool.toolName)) {
        queryClient.invalidateQueries({ queryKey: getBankAccountsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getBillsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getBudgetQueryKey() });
        queryClient.invalidateQueries({ queryKey: getTransactionsQueryKey() });
      }
    },
  });

  useEffect(() => {
    if (status !== 'ready') return;
    if (currentTool?.toolName === 'showOptions') return;
    setCurrentTool(null);
  }, [status, currentTool]);

  return {
    messages,
    sendMessage,
    status,
    error,
    isLoading: status === 'streaming' || status === 'submitted',
    currentTool,
    addToolOutput,
    setCurrentTool,
  };
}
