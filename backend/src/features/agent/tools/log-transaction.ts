import { tool } from 'ai';
import { z } from 'zod';
import { transactionsService } from '../../transactions/transactions.service';

export const logTransaction = tool({
  description:
    "Log a transaction the user mentions — spending, income, or a transfer they describe in natural speech (e.g. 'I spent 80 riyals at Tamimi' or 'I sent 200 dinars home'). Use a negative amount for expenses and a positive amount for income. Default source to 'voice' when called from a voice session, 'text' from chat. If the user does not specify a date, use today.",
  inputSchema: z.object({
    description: z
      .string()
      .describe(
        'Plain-language description of the transaction, as the user stated it',
      ),
    amount: z.number().describe('Positive for income, negative for expense'),
    categoryId: z
      .number()
      .optional()
      .describe('Budget category ID if you can infer it from context'),
    bankAccountId: z
      .number()
      .describe('Bank account ID to deduct from or credit'),
    source: z
      .enum(['voice', 'text', 'manual'])
      .describe('How the transaction was logged'),
    date: z.string().describe('Date in YYYY-MM-DD format'),
  }),
  execute: async (params) => {
    const transaction = await transactionsService.createTransaction(params);
    return { transaction };
  },
});
