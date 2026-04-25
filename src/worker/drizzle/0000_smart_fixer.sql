CREATE TABLE `credit_cards` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`card_token` text NOT NULL,
	`cardholder_name` text NOT NULL,
	`last_four` text NOT NULL,
	`brand` text NOT NULL,
	`exp_month` integer NOT NULL,
	`exp_year` integer NOT NULL,
	`is_default` integer DEFAULT false,
	`created_at` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_cards_card_token_unique` ON `credit_cards` (`card_token`);