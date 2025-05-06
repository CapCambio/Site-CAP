import { 
  users, currencies, currencyHistory,
  type User, type InsertUser, 
  type Currency, type InsertCurrency,
  type CurrencyHistory, type InsertCurrencyHistory
} from "@shared/schema";
import { db } from './db';
import { eq, and, gte, lte, desc, not } from 'drizzle-orm';

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

export class DatabaseStorage implements IStorage {
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

  async getAllCurrencies(): Promise<Currency[]> {
    // Retorna todas as moedas ordenadas pelo campo displayOrder (ordem exata da página fonte)
    return await db.select().from(currencies).orderBy(currencies.displayOrder);
  }

  async getCurrencyByCode(code: string): Promise<Currency | undefined> {
    const [currency] = await db.select().from(currencies).where(eq(currencies.code, code));
    return currency || undefined;
  }

  async upsertCurrency(insertCurrency: InsertCurrency): Promise<Currency> {
    // Tenta encontrar a moeda existente
    const existingCurrency = await this.getCurrencyByCode(insertCurrency.code);
    
    if (existingCurrency) {
      // Atualiza a moeda existente
      const [updatedCurrency] = await db
        .update(currencies)
        .set({
          name: insertCurrency.name,
          buyPrice: insertCurrency.buyPrice,
          sellPrice: insertCurrency.sellPrice,
          change: insertCurrency.change,
          lastUpdate: insertCurrency.lastUpdate,
          displayOrder: insertCurrency.displayOrder
        })
        .where(eq(currencies.code, insertCurrency.code))
        .returning();
      
      return updatedCurrency;
    } else {
      // Insere uma nova moeda
      const [newCurrency] = await db
        .insert(currencies)
        .values(insertCurrency)
        .returning();
      
      return newCurrency;
    }
  }

  async getCurrencyHistory(code: string, startDate?: Date, endDate?: Date): Promise<CurrencyHistory[]> {
    // Construa a consulta inicial
    let query = db.select().from(currencyHistory);
    
    // Aplica os filtros um por um
    const filters = [];
    filters.push(eq(currencyHistory.code, code));
    
    // Adiciona filtros de data se fornecidos
    if (startDate) {
      filters.push(gte(currencyHistory.timestamp, startDate));
    }
    
    if (endDate) {
      filters.push(lte(currencyHistory.timestamp, endDate));
    }
    
    // Aplica todos os filtros
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
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    const result = await db
      .delete(currencyHistory)
      .where(lte(currencyHistory.timestamp, oneYearAgo))
      .returning();
    
    return result.length;
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
    // Busca histórico ordenado por timestamp decrescente
    const histories = await db
      .select()
      .from(currencyHistory)
      .where(eq(currencyHistory.code, code))
      .orderBy(desc(currencyHistory.timestamp))
      .limit(10);
    
    // Encontra manualmente o primeiro preço diferente
    for (const history of histories) {
      if (history.buyPrice !== currentPrice) {
        return history;
      }
    }
    
    return undefined;
  }
}

export const storage = new DatabaseStorage();
