import { eq, desc, sql } from 'drizzle-orm';
import { db } from '../../core/db';
import { transactions, type NewTransaction } from '../../drizzle/schema/transactions';

export const transactionsRepository = {
  async getAll(filters?: { bankAccountId?: number; categoryId?: number }) {
    let query = db.select().from(transactions).orderBy(desc(transactions.date));
    
    if (filters?.bankAccountId) {
      // @ts-ignore
      query = query.where(eq(transactions.bankAccountId, filters.bankAccountId));
    }
    if (filters?.categoryId) {
      // @ts-ignore
      query = query.where(eq(transactions.categoryId, filters.categoryId));
    }
    
    return query;
  },

  async create(data: NewTransaction) {
    const results = await db.insert(transactions).values(data).returning();
    return results[0];
  },

  async getRecurringPatterns() {
    // Basic pattern detection: group by description and amount, count occurrences
    return db.select({
      description: transactions.description,
      amount: transactions.amount,
      count: sql<number>`count(*)`,
    })
    .from(transactions)
    .groupBy(transactions.description, transactions.amount)
    .having(sql`count(*) > 1`);
  }
};
