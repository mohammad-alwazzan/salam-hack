CREATE TABLE `bank_accounts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`bank` text NOT NULL,
	`balance` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`type` text NOT NULL,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `budget_months` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`month` text NOT NULL,
	`total_income` real NOT NULL,
	`created_at` text
);
--> statement-breakpoint
CREATE TABLE `budget_categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`budget_month_id` integer NOT NULL,
	`name` text NOT NULL,
	`type` text NOT NULL,
	`allocated` real NOT NULL,
	`priority` integer NOT NULL,
	`emoji` text NOT NULL,
	FOREIGN KEY (`budget_month_id`) REFERENCES `budget_months`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`description` text NOT NULL,
	`amount` real NOT NULL,
	`bank_account_id` integer NOT NULL,
	`category_id` integer,
	`source` text DEFAULT 'manual' NOT NULL,
	`date` text NOT NULL,
	`created_at` text,
	FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`category_id`) REFERENCES `budget_categories`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `bills` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`category_id` integer,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`due_date` text NOT NULL,
	`bank_account_id` integer,
	`paid_at` text,
	`created_at` text,
	FOREIGN KEY (`category_id`) REFERENCES `budget_categories`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`bank_account_id`) REFERENCES `bank_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `transfers` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`from_bank_account_id` integer NOT NULL,
	`amount` real NOT NULL,
	`recipient` text NOT NULL,
	`note` text,
	`executed_at` text,
	FOREIGN KEY (`from_bank_account_id`) REFERENCES `bank_accounts`(`id`) ON UPDATE no action ON DELETE no action
);
