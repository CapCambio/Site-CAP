
import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Currency model
export const currencies = sqliteTable("currencies", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  buyPrice: real("buy_price").notNull(),
  sellPrice: real("sell_price").notNull(),
  change: real("change"),
  lastUpdate: integer("last_update", { mode: 'timestamp' }).notNull(),
  displayOrder: integer("display_order").notNull().default(999),
});

// Currency history model
export const currencyHistory = sqliteTable("currency_history", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  buyPrice: real("buy_price").notNull(),
  sellPrice: real("sell_price").notNull(),
  timestamp: integer("timestamp", { mode: 'timestamp' }).notNull(),
});

export const insertCurrencySchema = createInsertSchema(currencies).pick({
  name: true,
  code: true,
  buyPrice: true,
  sellPrice: true,
  change: true,
  lastUpdate: true,
  displayOrder: true,
});

export const insertCurrencyHistorySchema = createInsertSchema(currencyHistory).pick({
  code: true,
  buyPrice: true,
  sellPrice: true,
  timestamp: true,
});

export type InsertCurrency = z.infer<typeof insertCurrencySchema>;
export type Currency = typeof currencies.$inferSelect;
export type CurrencyHistory = typeof currencyHistory.$inferSelect;
export type InsertCurrencyHistory = z.infer<typeof insertCurrencyHistorySchema>;
