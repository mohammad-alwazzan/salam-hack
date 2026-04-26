import { budgetRepository } from './budget.repository';
import { type NewBudgetMonth } from '../../drizzle/schema/budgetMonths';
import { type NewBudgetCategory } from '../../drizzle/schema/budgetCategories';

export const budgetService = {
  async getCurrentBudget() {
    const month = await budgetRepository.getCurrentMonth();
    if (!month) return null;

    const categories = await budgetRepository.getCategories(month.id);
    const spentData = await budgetRepository.getSpentByCategory(month.id);

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

    // For simplicity, we compare against the category with the most remaining balance or a general discretionary category
    const discretionary = budget.categories.find(c => c.type === 'discretionary') || budget.categories[0];
    
    const remainingBefore = discretionary.remaining;
    const remainingAfter = remainingBefore - amount;
    const percentOfBudgetUsedAfter = (discretionary.spent + amount) / discretionary.allocated;

    let verdict = 'You can afford this!';
    if (remainingAfter < 0) verdict = 'This will put you over budget for this category.';
    else if (percentOfBudgetUsedAfter > 0.9) verdict = 'This is within budget but getting close to your limit.';

    return {
      remainingBefore,
      remainingAfter,
      percentOfBudgetUsedAfter,
      verdict,
      mostImpactedCategory: discretionary.name,
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
