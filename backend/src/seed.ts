import { eq } from 'drizzle-orm';
import { db } from './core/db';
import * as schema from './drizzle/schema';

async function seed() {
  console.log('🌱 Cleaning up old data...');
  
  await db.delete(schema.transfers);
  await db.delete(schema.transactions);
  await db.delete(schema.bills);
  await db.delete(schema.budgetCategories);
  await db.delete(schema.budgetMonths);
  await db.delete(schema.bankAccounts);

  console.log('🌱 Seeding bank accounts...');

  const accounts = await db.insert(schema.bankAccounts).values([
    {
      name: 'Main Checking',
      bank: 'Arab Bank',
      balance: 15000,
      currency: 'USD',
      type: 'checking',
    },
    {
      name: 'Family Remittance',
      bank: 'Housing Bank',
      balance: 2500,
      currency: 'USD',
      type: 'remittance',
    },
  ]).returning();

  const checkingId = accounts[0].id;

  console.log('🌱 Seeding 12 months of budget data...');

  const months = [
    '2025-05', '2025-06', '2025-07', '2025-08', '2025-09', '2025-10',
    '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04'
  ];

  let lastMonthId = 0;

  for (const month of months) {
    const budgetMonth = await db.insert(schema.budgetMonths).values({
      month,
      totalIncome: 12000,
    }).returning();

    const monthId = budgetMonth[0].id;
    lastMonthId = monthId;

    const categories = await db.insert(schema.budgetCategories).values([
      {
        budgetMonthId: monthId,
        name: 'Remittances',
        type: 'fixed',
        allocated: 3000,
        priority: 1,
        emoji: '💸',
      },
      {
        budgetMonthId: monthId,
        name: 'Rent',
        type: 'fixed',
        allocated: 4000,
        priority: 1,
        emoji: '🏠',
      },
      {
        budgetMonthId: monthId,
        name: 'Food',
        type: 'discretionary',
        allocated: 2000,
        priority: 2,
        emoji: '🍲',
      },
      {
        budgetMonthId: monthId,
        name: 'Transport',
        type: 'discretionary',
        allocated: 1000,
        priority: 3,
        emoji: '🚗',
      },
      {
        budgetMonthId: monthId,
        name: 'Wedding Fund',
        type: 'fixed',
        allocated: 2000,
        priority: 2,
        emoji: '💍',
      },
    ]).returning();

    // Add some historical transactions for each month to show "spent" progress
    if (month !== '2026-04') {
      const foodCatId = categories[2].id;
      const rentCatId = categories[1].id;

      await db.insert(schema.transactions).values([
        {
          description: `Rent - ${month}`,
          amount: -4000,
          bankAccountId: checkingId,
          categoryId: rentCatId,
          source: 'manual',
          date: `${month}-01T10:00:00Z`,
        },
        {
          description: `Groceries - ${month}`,
          amount: -(1500 + Math.random() * 400),
          bankAccountId: checkingId,
          categoryId: foodCatId,
          source: 'manual',
          date: `${month}-15T15:30:00Z`,
        }
      ]);
    }
  }

  const currentMonthCategories = await db.select().from(schema.budgetCategories)
    .where(eq(schema.budgetCategories.budgetMonthId, lastMonthId));

  const rentCatId = currentMonthCategories.find(c => c.name === 'Rent')?.id;
  const foodCatId = currentMonthCategories.find(c => c.name === 'Food')?.id;

  console.log('🌱 Seeding current month bills and transactions...');

  await db.insert(schema.bills).values([
    {
      title: 'Monthly Rent',
      category: 'Rent',
      categoryId: rentCatId,
      amount: 4000,
      currency: 'USD',
      status: 'pending',
      dueDate: '2026-05-01',
    },
    {
      title: 'Internet Subscription',
      category: 'Utilities',
      amount: 80,
      currency: 'USD',
      status: 'pending',
      dueDate: '2026-04-28',
    },
  ]);

  await db.insert(schema.transactions).values([
    {
      description: 'Grocery Store',
      amount: -120,
      bankAccountId: checkingId,
      categoryId: foodCatId,
      source: 'manual',
      date: '2026-04-22T15:30:00Z',
    },
    {
      description: 'Salary Deposit',
      amount: 12000,
      bankAccountId: checkingId,
      source: 'manual',
      date: '2026-04-01T08:00:00Z',
    },
  ]);

  console.log('✅ Seeding complete!');
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
