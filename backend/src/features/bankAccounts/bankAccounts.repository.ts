import { eq, sql } from 'drizzle-orm';
import { db } from '../../core/db';
import { bankAccounts, type NewBankAccount } from '../../drizzle/schema/bankAccounts';

export const bankAccountsRepository = {
  async getAll() {
    return db.select().from(bankAccounts);
  },

  async getById(id: number) {
    const results = await db.select().from(bankAccounts).where(eq(bankAccounts.id, id));
    return results[0];
  },

  async create(data: NewBankAccount) {
    const results = await db.insert(bankAccounts).values(data).returning();
    return results[0];
  },

  async updateBalance(id: number, delta: number) {
    const results = await db
      .update(bankAccounts)
      .set({
        balance: sql`${bankAccounts.balance} + ${delta}`,
      })
      .where(eq(bankAccounts.id, id))
      .returning();
    return results[0];
  },
};
