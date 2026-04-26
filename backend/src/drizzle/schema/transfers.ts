import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { bankAccounts } from './bankAccounts';

export const transfers = sqliteTable('transfers', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fromBankAccountId: integer('from_bank_account_id')
    .notNull()
    .references(() => bankAccounts.id),
  amount: real('amount').notNull(),
  recipient: text('recipient').notNull(),
  note: text('note'),
  executedAt: text('executed_at').$defaultFn(() => new Date().toISOString()),
});

export const insertTransferSchema = createInsertSchema(transfers);
export const selectTransferSchema = createSelectSchema(transfers);

export type Transfer = typeof transfers.$inferSelect;
export type NewTransfer = typeof transfers.$inferInsert;
