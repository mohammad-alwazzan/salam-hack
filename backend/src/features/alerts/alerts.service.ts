import { billsService } from '../bills/bills.service';
import { budgetService } from '../budget/budget.service';
import { transactionsService } from '../transactions/transactions.service';

export const alertsService = {
  async getAlerts() {
    const alerts: { type: 'bill_due' | 'over_budget' | 'recurring_pattern'; message: string; data: any }[] = [];

    // 1. Bill due within 7 days
    const bills = await billsService.getAllBills();
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    for (const bill of bills) {
      if (bill.status === 'pending') {
        const dueDate = new Date(bill.dueDate);
        if (dueDate <= sevenDaysLater) {
          alerts.push({
            type: 'bill_due',
            message: `Bill "${bill.title}" is due on ${bill.dueDate}`,
            data: bill,
          });
        }
      }
    }

    // 2. Over budget (90%+)
    const budget = await budgetService.getCurrentBudget();
    if (budget) {
      for (const cat of budget.categories) {
        if (cat.spent / cat.allocated >= 0.9) {
          alerts.push({
            type: 'over_budget',
            message: `You've used ${Math.round((cat.spent / cat.allocated) * 100)}% of your ${cat.name} budget.`,
            data: cat,
          });
        }
      }
    }

    // 3. Recurring patterns
    const patterns = await transactionsService.detectPatterns();
    for (const pattern of patterns) {
      alerts.push({
        type: 'recurring_pattern',
        message: `Detected a recurring transaction for ${pattern.description} (${pattern.amount} USD).`,
        data: pattern,
      });
    }

    return alerts;
  }
};
