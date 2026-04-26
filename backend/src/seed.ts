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
  const monthlySpendingProfiles: Record<
    string,
    {
      groceries: number;
      remittances?: number;
      transport?: number;
      wedding?: number;
    }
  > = {
    '2025-05': { groceries: 1680, remittances: 2400, transport: 620 },
    '2025-06': { groceries: 2100, remittances: 4300, transport: 1800, wedding: 2800 }, // over budget
    '2025-07': { groceries: 1720, remittances: 2300, transport: 700 },
    '2025-08': { groceries: 1850, remittances: 2550, transport: 780 },
    '2025-09': { groceries: 1760, remittances: 2250, transport: 650 },
    '2025-10': { groceries: 1820, remittances: 2380, transport: 760 },
    '2025-11': { groceries: 1790, remittances: 2460, transport: 730 },
    '2025-12': { groceries: 1980, remittances: 2550, transport: 950 },
    '2026-01': { groceries: 1690, remittances: 2280, transport: 680 },
    '2026-02': { groceries: 1930, remittances: 2620, transport: 1020 },
    '2026-03': { groceries: 1980, remittances: 3600, transport: 1700, wedding: 3400 }, // over budget
  };

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

    // Add historical transactions for each month so charts show real trends.
    if (month !== '2026-04') {
      const profile = monthlySpendingProfiles[month] ?? { groceries: 1700 };
      const remittanceCatId = categories[0].id;
      const foodCatId = categories[2].id;
      const transportCatId = categories[3].id;
      const weddingCatId = categories[4].id;
      const rentCatId = categories[1].id;

      const historicalTransactions: Array<typeof schema.transactions.$inferInsert> = [
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
          amount: -profile.groceries,
          bankAccountId: checkingId,
          categoryId: foodCatId,
          source: 'manual',
          date: `${month}-15T15:30:00Z`,
        },
      ];

      if (profile.remittances) {
        historicalTransactions.push({
          description: `Family Transfer - ${month}`,
          amount: -profile.remittances,
          bankAccountId: checkingId,
          categoryId: remittanceCatId,
          source: 'manual',
          date: `${month}-07T11:45:00Z`,
        });
      }

      if (profile.transport) {
        historicalTransactions.push({
          description: `Transport - ${month}`,
          amount: -profile.transport,
          bankAccountId: checkingId,
          categoryId: transportCatId,
          source: 'manual',
          date: `${month}-21T13:20:00Z`,
        });
      }

      if (profile.wedding) {
        historicalTransactions.push({
          description: `Wedding Fund - ${month}`,
          amount: -profile.wedding,
          bankAccountId: checkingId,
          categoryId: weddingCatId,
          source: 'manual',
          date: `${month}-25T10:10:00Z`,
        });
      }

      await db.insert(schema.transactions).values(historicalTransactions);
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
