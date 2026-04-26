import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

export const budgetMonths = sqliteTable('budget_months', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  month: text('month').notNull(), // YYYY-MM
  totalIncome: real('total_income').notNull(),
  createdAt: text('created_at').$defaultFn(() => new Date().toISOString()),
});

export const insertBudgetMonthSchema = createInsertSchema(budgetMonths);
export const selectBudgetMonthSchema = createSelectSchema(budgetMonths);

export type BudgetMonth = typeof budgetMonths.$inferSelect;
export type NewBudgetMonth = typeof budgetMonths.$inferInsert;
