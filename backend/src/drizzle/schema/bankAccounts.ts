import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const bankAccounts = sqliteTable('bank_accounts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  bank: text('bank').notNull(),
  balance: real('balance').notNull(),
  currency: text('currency').notNull().default('USD'),
  type: text('type', { enum: ['checking', 'savings', 'remittance'] }).notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const insertBankAccountSchema = createInsertSchema(bankAccounts);
export const selectBankAccountSchema = createSelectSchema(bankAccounts);

export type BankAccount = typeof bankAccounts.$inferSelect;
export type NewBankAccount = typeof bankAccounts.$inferInsert;
