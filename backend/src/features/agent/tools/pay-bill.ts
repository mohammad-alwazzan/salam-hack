import { tool } from 'ai';
import { z } from 'zod';
import { billsService } from '../../bills/bills.service';

export const payBill = tool({
  description:
    'Pay a specific bill from a chosen bank account. Only call this after the user has explicitly confirmed the payment — show the bill details and account balance impact via showOptions first, then call this once the user taps Confirm. Never execute a payment based on intent alone.',
  inputSchema: z.object({
    billId: z.number().describe('The ID of the bill to pay.'),
    bankAccountId: z.number().describe('The ID of the bank account to pay from.'),
  }),
  execute: async ({ billId, bankAccountId }) => {
    try {
      const updatedBill = await billsService.payBill(billId, bankAccountId);
      return { success: true, bill: updatedBill };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'An unknown error occurred while paying the bill',
      };
    }
  },
});
