import { tool } from 'ai';
import { z } from 'zod';
import { budgetService } from '../../budget/budget.service';

export const checkPurchaseImpact = tool({
  description:
    "Calculate the impact of a potential purchase on the user's current budget. Use this when the user asks 'can I afford X?' or 'should I buy Y?' — returns remaining balance before and after, a verdict (comfortable / tight / over), and which budget category would be most affected. Never make a judgment — just present the honest numbers and ask how the user feels.",
  inputSchema: z.object({
    amount: z
      .number()
      .describe('The price of the item or service the user is considering'),
  }),
  execute: async ({ amount }) => {
    return await budgetService.getPurchaseImpact(amount);
  },
});
