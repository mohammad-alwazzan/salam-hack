import { eq } from 'drizzle-orm';
import { db } from '../../core/db';
import { bills, type NewBill } from '../../drizzle/schema/bills';

export const billsRepository = {
  async getAll() {
    return db.select().from(bills);
  },

  async getById(id: number) {
    const results = await db.select().from(bills).where(eq(bills.id, id));
    return results[0];
  },

  async create(data: NewBill) {
    const results = await db.insert(bills).values(data).returning();
    return results[0];
  },

  async markPaid(id: number, bankAccountId: number) {
    const results = await db
      .update(bills)
      .set({
        status: 'paid',
        bankAccountId,
        paidAt: new Date().toISOString(),
      })
      .where(eq(bills.id, id))
      .returning();
    return results[0];
  },
};
