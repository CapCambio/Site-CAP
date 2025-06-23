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
    return await jsonStorage.getAllCurrencies();
  }

  async getCurrencyByCode(code: string): Promise<Currency | undefined> {
    return await jsonStorage.getCurrencyByCode(code);
  }

  async upsertCurrency(insertCurrency: InsertCurrency): Promise<Currency> {
    return await jsonStorage.upsertCurrency(insertCurrency);
  }

  async getCurrencyHistory(code: string, startDate?: Date, endDate?: Date): Promise<CurrencyHistory[]> {
    return await jsonStorage.getCurrencyHistory(code, startDate, endDate);
  }

  async addCurrencyHistory(insertHistory: InsertCurrencyHistory): Promise<CurrencyHistory> {
    return await jsonStorage.addCurrencyHistory(insertHistory);
  }

  async cleanupOldHistory(olderThan: Date): Promise<number> {
    return await jsonStorage.cleanupOldHistory(olderThan);
  }

  async getUser(id: number): Promise<User | undefined> {
    return await jsonStorage.getUser(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return await jsonStorage.getUserByUsername(username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    return await jsonStorage.createUser(insertUser);
  }

  async getLastCurrencyHistory(code: string): Promise<CurrencyHistory | undefined> {
    return await jsonStorage.getLastCurrencyHistory(code);
  }

  async getPreviousDifferentPrice(code: string, currentPrice: number): Promise<CurrencyHistory | undefined> {
    return await jsonStorage.getPreviousDifferentPrice(code, currentPrice);
  }
}

export const storage = new Storage();