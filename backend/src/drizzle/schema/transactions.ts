import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { bankAccounts } from './bankAccounts';
import { budgetCategories } from './budgetCategories';

export const transactions = sqliteTable('transactions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  description: text('description').notNull(),
  amount: real('amount').notNull(),
  bankAccountId: integer('bank_account_id')
    .notNull()
    .references(() => bankAccounts.id),
  categoryId: integer('category_id')
    .references(() => budgetCategories.id),
  source: text('source', { enum: ['voice', 'text', 'manual'] }).notNull().default('manual'),
  date: text('date').notNull().$defaultFn(() => new Date().toISOString()),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);

export type Transaction = typeof transactions.$inferSelect;
export type NewTransaction = typeof transactions.$inferInsert;
