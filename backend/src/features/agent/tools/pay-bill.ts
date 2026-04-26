import { tool } from 'ai';
import { z } from 'zod';
import { billsService } from '../../bills/bills.service';

export const payBill = tool({
  description: 'Pay a specific bill from a chosen bank account.',
  inputSchema: z.object({
    billId: z.number().describe('The ID of the bill to pay.'),
    bankAccountId: z.number().describe('The ID of the bank account to pay from.'),
  }),
  execute: async ({ billId, bankAccountId }) => {
    const updatedBill = await billsService.payBill(billId, bankAccountId);
    return { success: true, bill: updatedBill };
  },
});
