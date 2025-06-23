CREATE TABLE `currencies` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`code` text NOT NULL,
	`buy_price` real NOT NULL,
	`sell_price` real NOT NULL,
	`change` real,
	`last_update` integer NOT NULL,
	`display_order` integer DEFAULT 999 NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `currencies_code_unique` ON `currencies` (`code`);--> statement-breakpoint
CREATE TABLE `currency_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`buy_price` real NOT NULL,
	`sell_price` real NOT NULL,
	`timestamp` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`username` text NOT NULL,
	`password` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);