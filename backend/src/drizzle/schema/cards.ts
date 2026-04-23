import { sqliteTable, integer, text } from "drizzle-orm/sqlite-core";

export const cards = sqliteTable("credit_cards", {
	// SQLite Primary Key with Auto-Increment
	id: integer("id").primaryKey({ autoIncrement: true }),

	// The Secure Token
	cardToken: text("card_token").notNull().unique(),

	// Card Details
	cardholderName: text("cardholder_name").notNull(),
	lastFour: text("last_four").notNull(),
	brand: text("brand").notNull(), // e.g., 'Visa'

	// Dates and Booleans are stored as Integers in SQLite
	expMonth: integer("exp_month").notNull(),
	expYear: integer("exp_year").notNull(),

	// 0 for false, 1 for true
	isDefault: integer("is_default", { mode: "boolean" }).default(false),

	// Timestamps (stored as ISO strings or Unix integers)
	createdAt: text("created_at").$defaultFn(() => new Date().toISOString()),
});
