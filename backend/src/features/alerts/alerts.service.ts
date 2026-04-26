import { billsService } from '../bills/bills.service';
import { budgetService } from '../budget/budget.service';
import { transactionsService } from '../transactions/transactions.service';

// Known upcoming Eid dates — lunar calendar approximations
const EID_DATES: { date: string; name: string }[] = [
  { date: '2026-06-06', name: 'Eid al-Adha' },
  { date: '2027-03-20', name: 'Eid al-Fitr' },
  { date: '2027-05-27', name: 'Eid al-Adha' },
];

function daysUntilNextEid(today: Date): { days: number; name: string } | null {
  for (const eid of EID_DATES) {
    const eidDate = new Date(eid.date);
    const diff = Math.floor((eidDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diff > 0 && diff <= 45) {
      return { days: diff, name: eid.name };
    }
  }
  return null;
}

const REMITTANCE_KEYWORDS = ['transfer', 'remit', 'home', 'family', 'send'];

function looksLikeRemittance(description: string): boolean {
  const lower = description.toLowerCase();
  return REMITTANCE_KEYWORDS.some(k => lower.includes(k));
}

export const alertsService = {
  async getAlerts() {
    const alerts: {
      type: 'bill_due' | 'bill_overdue' | 'over_budget' | 'recurring_pattern' | 'eid_reminder';
      message: string;
      data: any;
    }[] = [];

    const bills = await billsService.getAllBills();
    const now = new Date();
    const sevenDaysLater = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    for (const bill of bills) {
      if (bill.status === 'pending') {
        const dueDate = new Date(bill.dueDate);
        if (dueDate < now) {
          // Overdue — higher severity than upcoming
          alerts.push({
            type: 'bill_overdue',
            message: `"${bill.title}" was due on ${bill.dueDate} and hasn't been paid yet.`,
            data: bill,
          });
        } else if (dueDate <= sevenDaysLater) {
          alerts.push({
            type: 'bill_due',
            message: `"${bill.title}" is due on ${bill.dueDate}.`,
            data: bill,
          });
        }
      }
    }

    // Budget categories at 90%+ of allocation
    const budget = await budgetService.getCurrentBudget();
    if (budget) {
      for (const cat of budget.categories) {
        if (cat.allocated > 0 && cat.spent / cat.allocated >= 0.9) {
          alerts.push({
            type: 'over_budget',
            message: `You've used ${Math.round((cat.spent / cat.allocated) * 100)}% of your ${cat.name} budget this month.`,
            data: cat,
          });
        }
      }
    }

    // Recurring transaction patterns
    const patterns = await transactionsService.detectPatterns();
    for (const pattern of patterns) {
      alerts.push({
        type: 'recurring_pattern',
        message: `Recurring transaction detected: ${pattern.description} (${Math.abs(pattern.amount)} — appears ${pattern.count} times).`,
        data: pattern,
      });
    }

    // Eid seasonal alert — if Eid is approaching and a remittance pattern exists
    const eidInfo = daysUntilNextEid(now);
    if (eidInfo) {
      const remittancePattern = patterns.find(p => looksLikeRemittance(p.description));
      if (remittancePattern) {
        alerts.push({
          type: 'eid_reminder',
          message: `${eidInfo.name} is in ${eidInfo.days} days — you usually send money home around the 25th. Want to schedule it early so it arrives before the holiday?`,
          data: { eidName: eidInfo.name, daysUntil: eidInfo.days, pattern: remittancePattern },
        });
      }
    }

    return alerts;
  },
};
