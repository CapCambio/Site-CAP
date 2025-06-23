import { 
  type User, type InsertUser, 
  type Currency, type InsertCurrency,
  type CurrencyHistory, type InsertCurrencyHistory
} from "@shared/schema";
import { jsonStorage } from './json-storage';

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Currency operations
  getAllCurrencies(): Promise<Currency[]>;
  getCurrencyByCode(code: string): Promise<Currency | undefined>;
  upsertCurrency(currency: InsertCurrency): Promise<Currency>;

  // Currency history operations
  getCurrencyHistory(code: string, startDate?: Date, endDate?: Date): Promise<CurrencyHistory[]>;
  addCurrencyHistory(history: InsertCurrencyHistory): Promise<CurrencyHistory>;
  cleanupOldHistory(olderThan: Date): Promise<number>;
}

class Storage {
  async getAllCurrencies(): Promise<Currency[]> {
    return await db.select().from(currencies).orderBy(currencies.displayOrder);
  }

  async getCurrencyByCode(code: string): Promise<Currency | undefined> {
    const result = await db.select().from(currencies).where(eq(currencies.code, code));
    return result[0];
  }

  async upsertCurrency(insertCurrency: InsertCurrency): Promise<Currency> {
    const existing = await this.getCurrencyByCode(insertCurrency.code);

    if (existing) {
      const [updated] = await db
        .update(currencies)
        .set(insertCurrency)
        .where(eq(currencies.code, insertCurrency.code))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(currencies)
        .values(insertCurrency)
        .returning();
      return created;
    }
  }

  async getCurrencyHistory(code: string, startDate?: Date, endDate?: Date): Promise<CurrencyHistory[]> {
    let query = db.select().from(currencyHistory);

    const filters = [];
    filters.push(eq(currencyHistory.code, code));

    if (startDate) {
      filters.push(gte(currencyHistory.timestamp, startDate));
    }

    if (endDate) {
      filters.push(lte(currencyHistory.timestamp, endDate));
    }

    const result = await query.where(and(...filters)).orderBy(desc(currencyHistory.timestamp));

    return result;
  }

  async addCurrencyHistory(insertHistory: InsertCurrencyHistory): Promise<CurrencyHistory> {
    const [history] = await db
      .insert(currencyHistory)
      .values(insertHistory)
      .returning();

    return history;
  }

  async cleanupOldHistory(olderThan: Date): Promise<number> {
    const result = await db
      .delete(currencyHistory)
      .where(lte(currencyHistory.timestamp, olderThan))
      .returning();

    return result.length;
  }
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getLastCurrencyHistory(code: string): Promise<CurrencyHistory | undefined> {
    const [history] = await db
      .select()
      .from(currencyHistory)
      .where(eq(currencyHistory.code, code))
      .orderBy(desc(currencyHistory.timestamp))
      .limit(1);
    
    return history;
  }

  async getPreviousDifferentPrice(code: string, currentPrice: number): Promise<CurrencyHistory | undefined> {
    const [history] = await db
      .select()
      .from(currencyHistory)
      .where(
        and(
          eq(currencyHistory.code, code),
          not(eq(currencyHistory.sellPrice, currentPrice))
        )
      )
      .orderBy(desc(currencyHistory.timestamp))
      .limit(1);
    
    return history;
  }
}

export const storage = new Storage();