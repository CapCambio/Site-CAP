import { 
  users, currencies, currencyHistory,
  type User, type InsertUser, 
  type Currency, type InsertCurrency,
  type CurrencyHistory, type InsertCurrencyHistory
} from "@shared/schema";
import { db } from './db';
import { eq, and, gte, lte, desc } from 'drizzle-orm';

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
    return await db.select().from(currencies);
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
          lastUpdate: insertCurrency.lastUpdate
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
    // Constrói a consulta base
    let query = db
      .select()
      .from(currencyHistory)
      .where(eq(currencyHistory.code, code));
    
    // Adiciona filtros de data se fornecidos
    if (startDate) {
      query = query.where(gte(currencyHistory.timestamp, startDate));
    }
    
    if (endDate) {
      query = query.where(lte(currencyHistory.timestamp, endDate));
    }
    
    // Ordena por timestamp em ordem decrescente (mais recente primeiro)
    return await query.orderBy(desc(currencyHistory.timestamp));
  }

  async addCurrencyHistory(insertHistory: InsertCurrencyHistory): Promise<CurrencyHistory> {
    const [history] = await db
      .insert(currencyHistory)
      .values(insertHistory)
      .returning();
    
    return history;
  }

  async cleanupOldHistory(olderThan: Date): Promise<number> {
    // Obtém o número de registros antes da limpeza
    const [{ count: beforeCount }] = await db
      .select({ count: db.fn.count() })
      .from(currencyHistory);
    
    // Exclui registros mais antigos que a data especificada
    await db
      .delete(currencyHistory)
      .where(lte(currencyHistory.timestamp, olderThan));
    
    // Obtém o número de registros após a limpeza
    const [{ count: afterCount }] = await db
      .select({ count: db.fn.count() })
      .from(currencyHistory);
    
    // Retorna a diferença (número de registros excluídos)
    return Number(beforeCount) - Number(afterCount);
  }
}

export const storage = new DatabaseStorage();
