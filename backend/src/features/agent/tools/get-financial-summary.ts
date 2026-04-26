import { tool } from 'ai';
import { z } from 'zod';
import { bankAccountService } from '../../bankAccounts/bankAccounts.service';
import { budgetService } from '../../budget/budget.service';
import { alertsService } from '../../alerts/alerts.service';

export const getFinancialSummary = tool({
  description:
    "Load the user's complete financial snapshot: all bank accounts with balances, current month budget summary with per-category spent vs allocated, and any active alerts. Call this silently at session start and whenever you need up-to-date context before answering a financial question.",
  inputSchema: z.object({}),
  execute: async () => {
    const [accounts, budget, alerts] = await Promise.all([
      bankAccountService.getAllAccounts(),
      budgetService.getCurrentBudget(),
      alertsService.getAlerts(),
    ]);

    return { accounts, budget, alerts };
  },
});
