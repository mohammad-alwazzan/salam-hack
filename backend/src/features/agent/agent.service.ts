import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { createGroq, GroqLanguageModelOptions } from '@ai-sdk/groq';
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
import { bankAccountService } from '../bankAccounts/bankAccounts.service';
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
  async streamChat(messages: ModelMessage[]) {
    const [accounts, budget, alerts] = await Promise.all([
      bankAccountService.getAllAccounts(),
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
      tools: {
        getFinancialSummary,
        logTransaction,
        executeTransfer,
        checkPurchaseImpact,
        getAlerts,
        showOptions,
        payBill,
      },
      // providerOptions: {
      //   groq: {
      //     reasoningFormat: 'parsed',
      //     reasoningEffort: 'default',
      //   } satisfies GroqLanguageModelOptions,
      // },
      toolChoice: 'auto',
      stopWhen: stepCountIs(20),
      onError({ error }) {
        console.log(error);
      },
    });
  }
}

export const agentService = new AgentService();
