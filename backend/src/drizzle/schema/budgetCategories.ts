import { sqliteTable, integer, text, real } from 'drizzle-orm/sqlite-core';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';
import { budgetMonths } from './budgetMonths';

export const budgetCategories = sqliteTable('budget_categories', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  budgetMonthId: integer('budget_month_id')
    .notNull()
    .references(() => budgetMonths.id),
  name: text('name').notNull(),
  type: text('type', { enum: ['fixed', 'discretionary'] }).notNull(),
  allocated: real('allocated').notNull(),
  priority: integer('priority').notNull(),
  emoji: text('emoji').notNull(),
});

export const insertBudgetCategorySchema = createInsertSchema(budgetCategories);
export const selectBudgetCategorySchema = createSelectSchema(budgetCategories);

export type BudgetCategory = typeof budgetCategories.$inferSelect;
export type NewBudgetCategory = typeof budgetCategories.$inferInsert;
