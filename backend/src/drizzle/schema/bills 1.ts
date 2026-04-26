import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { bankAccounts } from './bankAccounts';
import { budgetCategories } from './budgetCategories';

export const bills = sqliteTable('bills', {
  id: integer('id').primaryKey({ autoIncrement: true }),

  // Bill details
  title: text('title').notNull(),
  description: text('description'),
  category: text('category').notNull(), // e.g. "Electricity", "Water", "Internet", "Rent"
  categoryId: integer('category_id').references(() => budgetCategories.id),
  amount: real('amount').notNull(),
  currency: text('currency').notNull().default('USD'),

  // Status: "pending" | "paid" | "overdue"
  status: text('status').notNull().default('pending'),

  // Due date stored as ISO string
  dueDate: text('due_date').notNull(),

  // Payment info — set when the bill is paid
  bankAccountId: integer('bank_account_id').references(() => bankAccounts.id),
  paidAt: text('paid_at'),

  // Timestamps
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

// Auto-generated schemas for validation & types
export const insertBillSchema = createInsertSchema(bills);
export const selectBillSchema = createSelectSchema(bills);

export type Bill = typeof bills.$inferSelect;
export type NewBill = typeof bills.$inferInsert;
