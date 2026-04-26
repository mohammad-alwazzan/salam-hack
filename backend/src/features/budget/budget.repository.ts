import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../core/db';
import { budgetMonths, type NewBudgetMonth } from '../../drizzle/schema/budgetMonths';
import { budgetCategories, type NewBudgetCategory } from '../../drizzle/schema/budgetCategories';
import { transactions } from '../../drizzle/schema/transactions';

export const budgetRepository = {
  async getCurrentMonth() {
    const results = await db.select().from(budgetMonths).orderBy(desc(budgetMonths.month)).limit(1);
    return results[0];
  },

  async upsertMonth(data: NewBudgetMonth) {
    const existing = await db.select().from(budgetMonths).where(eq(budgetMonths.month, data.month));
    if (existing.length > 0) {
      const results = await db.update(budgetMonths).set(data).where(eq(budgetMonths.month, data.month)).returning();
      return results[0];
    }
    const results = await db.insert(budgetMonths).values(data).returning();
    return results[0];
  },

  async getCategories(budgetMonthId: number) {
    return db.select().from(budgetCategories).where(eq(budgetCategories.budgetMonthId, budgetMonthId));
  },

  async upsertCategory(data: NewBudgetCategory) {
    // Basic upsert based on name and month
    const existing = await db.select().from(budgetCategories)
      .where(sql`${budgetCategories.budgetMonthId} = ${data.budgetMonthId} AND ${budgetCategories.name} = ${data.name}`);
    
    if (existing.length > 0) {
      const results = await db.update(budgetCategories).set(data).where(eq(budgetCategories.id, existing[0].id)).returning();
      return results[0];
    }
    const results = await db.insert(budgetCategories).values(data).returning();
    return results[0];
  },

  async getSpentByCategory(budgetMonthId: number) {
    // This is a simplified join. In a real app, you'd filter transactions by the month's date range.
    return db.select({
      categoryId: transactions.categoryId,
      spent: sql<number>`abs(sum(case when ${transactions.amount} < 0 then ${transactions.amount} else 0 end))`,
    })
    .from(transactions)
    .groupBy(transactions.categoryId);
  }
};
