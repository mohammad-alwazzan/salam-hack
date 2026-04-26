import { desc } from 'drizzle-orm';
import { db } from '../../core/db';
import { transfers, type NewTransfer } from '../../drizzle/schema/transfers';

export const transfersRepository = {
  async getAll() {
    return db.select().from(transfers).orderBy(desc(transfers.executedAt));
  },

  async create(data: NewTransfer) {
    const results = await db.insert(transfers).values(data).returning();
    return results[0];
  },
};
