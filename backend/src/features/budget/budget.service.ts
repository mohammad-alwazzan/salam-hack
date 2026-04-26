import { budgetRepository } from './budget.repository';
import { type NewBudgetMonth } from '../../drizzle/schema/budgetMonths';
import { type NewBudgetCategory } from '../../drizzle/schema/budgetCategories';

export const budgetService = {
  async getCurrentBudget() {
    const month = await budgetRepository.getCurrentMonth();
    if (!month) return null;

    const categories = await budgetRepository.getCategories(month.id);
    const spentData = await budgetRepository.getSpentByCategory(month.id, month.month);

    const categoriesWithSpent = categories.map(cat => {
      const spent = spentData.find(s => s.categoryId === cat.id)?.spent || 0;
      return {
        ...cat,
        spent,
        remaining: cat.allocated - spent,
      };
    });

    return {
      month: month.month,
      totalIncome: month.totalIncome,
      categories: categoriesWithSpent,
    };
  },

  async getPurchaseImpact(amount: number) {
    const budget = await this.getCurrentBudget();
    if (!budget) throw new Error('No budget found');

    const discretionaryCategories = budget.categories.filter(c => c.type === 'discretionary');
    // Savings goals: fixed categories that are not top-priority obligations (remittances/rent)
    const savingsGoals = budget.categories.filter(c => c.type === 'fixed' && c.priority > 1);

    const totalDiscretionaryRemaining = discretionaryCategories.reduce((sum, c) => sum + c.remaining, 0);
    const remainingBefore = totalDiscretionaryRemaining;
    const remainingAfter = remainingBefore - amount;

    // Most impacted: discretionary category with most remaining balance
    const sortedDiscretionary = [...discretionaryCategories].sort((a, b) => b.remaining - a.remaining);
    const mostImpacted = sortedDiscretionary[0] ?? budget.categories[0];

    let verdict: 'comfortable' | 'tight' | 'over';
    if (remainingAfter < 0) {
      verdict = 'over';
    } else if (remainingAfter < totalDiscretionaryRemaining * 0.15) {
      verdict = 'tight';
    } else {
      verdict = 'comfortable';
    }

    // Show impact on the primary savings goal (e.g. wedding fund)
    const primaryGoal = savingsGoals[0] ?? null;
    const goalImpact = primaryGoal ? {
      goalName: primaryGoal.name,
      goalAllocated: primaryGoal.allocated,
      goalSpent: primaryGoal.spent,
      goalRemaining: primaryGoal.remaining,
      atRisk: amount > totalDiscretionaryRemaining,
    } : null;

    return {
      remainingBefore,
      remainingAfter,
      percentOfBudgetUsedAfter: mostImpacted
        ? (mostImpacted.spent + amount) / mostImpacted.allocated
        : 1,
      verdict,
      mostImpactedCategory: mostImpacted?.name ?? 'General',
      goalImpact,
    };
  },

  async upsertBudget(monthData: NewBudgetMonth, categories: Omit<NewBudgetCategory, 'budgetMonthId'>[]) {
    const month = await budgetRepository.upsertMonth(monthData);
    for (const cat of categories) {
      await budgetRepository.upsertCategory({ ...cat, budgetMonthId: month.id });
    }
    return this.getCurrentBudget();
  }
};
