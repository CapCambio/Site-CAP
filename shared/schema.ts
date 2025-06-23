
import { pgTable, text, serial, integer, boolean, timestamp, doublePrecision } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
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
export const currencies = pgTable("currencies", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  buyPrice: doublePrecision("buy_price").notNull(),
  sellPrice: doublePrecision("sell_price").notNull(),
  change: doublePrecision("change"),
  lastUpdate: timestamp("last_update").notNull(),
  displayOrder: integer("display_order").notNull().default(999), // Para manter a ordem exata da página fonte
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

export type InsertCurrency = z.infer<typeof insertCurrencySchema>;
export type Currency = typeof currencies.$inferSelect;

// Historical data model
export const currencyHistory = pgTable("currency_history", {
  id: serial("id").primaryKey(),
  code: text("code").notNull(),
  buyPrice: doublePrecision("buy_price").notNull(),
  sellPrice: doublePrecision("sell_price").notNull(),
  timestamp: timestamp("timestamp").notNull(),
});

export const insertCurrencyHistorySchema = createInsertSchema(currencyHistory).pick({
  code: true,
  buyPrice: true,
  sellPrice: true,
  timestamp: true,
});

export type InsertCurrencyHistory = z.infer<typeof insertCurrencyHistorySchema>;
export type CurrencyHistory = typeof currencyHistory.$inferSelect;

// Tipo para dados raspados da página fonte
export interface ScrapedCurrency {
  name: string;
  code: string;
  buyPrice: number;
  sellPrice: number;
  displayOrder: number;
}
