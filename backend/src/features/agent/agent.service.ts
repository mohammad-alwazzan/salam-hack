import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createGroq } from '@ai-sdk/groq';
import { streamText, ModelMessage, stepCountIs } from 'ai';
import { readFileSync } from 'fs';
import { join } from 'path';
import {
  getFinancialSummary,
  logTransaction,
  executeTransfer,
  checkPurchaseImpact,
  getAlerts,
  showOptions,
  payBill,
} from './tools';
import { bankAccountsService } from '../bankAccounts/bankAccounts.service';
import { budgetService } from '../budget/budget.service';
import { alertsService } from '../alerts/alerts.service';

const openrouter = createOpenRouter({
  apiKey: process.env.OPENROUTER_API_KEY,
});

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
});

let SYSTEM_PROMPT = readFileSync(
  join(import.meta.dir, 'SYSTEM_PROMPT.md'),
  'utf-8',
);

export class AgentService {
  async streamChat(messages: ModelMessage[], abortSignal?: AbortSignal) {
    const [accounts, budget, alerts] = await Promise.all([
      bankAccountsService.getAllAccounts(),
      budgetService.getCurrentBudget(),
      alertsService.getAlerts(),
    ]);

    const contextualPrompt =
      SYSTEM_PROMPT +
      `\n\nHere is the financial summary: ${JSON.stringify({ accounts, budget, alerts })}`;

    return streamText({
      model: groq('openai/gpt-oss-120b'),
      system: contextualPrompt,
      messages,
      abortSignal,
      stopWhen: stepCountIs(50),
      maxRetries: 3,
      tools: {
        getFinancialSummary,
        logTransaction,
        executeTransfer,
        checkPurchaseImpact,
        getAlerts,
        showOptions,
        payBill,
      },
      toolChoice: 'auto',
      onError({ error }) {
        console.error('Stream error:', error);
      },
    });
  }
}

export const agentService = new AgentService();
