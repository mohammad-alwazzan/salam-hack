import { tool } from 'ai';
import { z } from 'zod';
import { transfersService } from '../../transfers/transfers.service';

export const executeTransfer = tool({
  description:
    'Execute a money transfer after the user has explicitly confirmed it via the approval screen. Never call this tool until the user has given clear confirmation. Deducts the amount from the specified bank account and logs it as a transaction.',
  inputSchema: z.object({
    fromBankAccountId: z
      .number()
      .describe('ID of the bank account to deduct from'),
    amount: z.number().describe('Amount to transfer — must be positive'),
    recipient: z
      .string()
      .describe(
        "Name or description of the recipient (e.g. 'Mama', 'Ahmed', 'landlord')",
      ),
    note: z.string().optional().describe('Optional memo for the transfer'),
  }),
  execute: async (params) => {
    try {
      const result = await transfersService.execute(params);

      return {
        success: true,
        account: result.account,
        transaction: result.transaction,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'An unknown error occurred during transfer',
      };
    }
  },
});
