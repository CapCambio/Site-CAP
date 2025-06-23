import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import type { Currency, CurrencyHistory, User, InsertCurrency, InsertCurrencyHistory, InsertUser } from '../shared/schema';

const DATA_DIR = './data';
const CURRENCIES_FILE = join(DATA_DIR, 'currencies.json');
const HISTORY_FILE = join(DATA_DIR, 'history.json');
const EMAILS_FILE = join(DATA_DIR, 'emails.json');

interface JSONData {
  currencies: Currency[];
  history: CurrencyHistory[];
  emails: {
    authorized: Array<{ email: string; name: string; isAdmin: boolean; lastAccess?: string }>;
    admin: Array<{ email: string; name: string; isAdmin: boolean; lastAccess?: string }>;
  };
}

class JSONStorage {
  private data: JSONData;
  private nextCurrencyId = 1;
  private nextHistoryId = 1;
  private nextUserId = 1;

  constructor() {
    this.ensureDataDirectory();
    this.data = this.loadData();
    this.updateNextIds();
  }

  private ensureDataDirectory() {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): JSONData {
    const defaultData: JSONData = {
      currencies: [],
      history: [],
      emails: {
        authorized: [
          { email: "capcambiocx@gmail.com", name: "CAP Câmbio Admin", isAdmin: true }
        ],
        admin: [
          { email: "capcambiocx@gmail.com", name: "CAP Câmbio Admin", isAdmin: true }
        ]
      }
    };

    try {
      if (existsSync(CURRENCIES_FILE)) {
        const currencies = JSON.parse(readFileSync(CURRENCIES_FILE, 'utf8'));
        defaultData.currencies = currencies.map((c: any) => ({
          ...c,
          lastUpdate: new Date(c.lastUpdate)
        }));
      }

      if (existsSync(HISTORY_FILE)) {
        const history = JSON.parse(readFileSync(HISTORY_FILE, 'utf8'));
        defaultData.history = history.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp)
        }));
      }

      if (existsSync(EMAILS_FILE)) {
        const emails = JSON.parse(readFileSync(EMAILS_FILE, 'utf8'));
        defaultData.emails = emails;
      }
    } catch (error) {
      console.log('📦 Inicializando armazenamento JSON com dados padrão');
    }

    return defaultData;
  }

  private updateNextIds() {
    this.nextCurrencyId = this.data.currencies.length > 0 
      ? Math.max(...this.data.currencies.map(c => c.id || 0)) + 1 
      : 1;
    
    this.nextHistoryId = this.data.history.length > 0 
      ? Math.max(...this.data.history.map(h => h.id || 0)) + 1 
      : 1;
  }

  private saveData() {
    try {
      writeFileSync(CURRENCIES_FILE, JSON.stringify(this.data.currencies, null, 2));
      writeFileSync(HISTORY_FILE, JSON.stringify(this.data.history, null, 2));
      writeFileSync(EMAILS_FILE, JSON.stringify(this.data.emails, null, 2));
    } catch (error) {
      console.error('❌ Erro ao salvar dados:', error);
    }
  }

  // Currency operations
  async getAllCurrencies(): Promise<Currency[]> {
    return [...this.data.currencies].sort((a, b) => (a.displayOrder || 999) - (b.displayOrder || 999));
  }

  async getCurrencyByCode(code: string): Promise<Currency | undefined> {
    return this.data.currencies.find(c => c.code === code);
  }

  async upsertCurrency(currency: InsertCurrency): Promise<Currency> {
    const existingIndex = this.data.currencies.findIndex(c => c.code === currency.code);
    
    const currencyWithId: Currency = {
      id: existingIndex >= 0 ? this.data.currencies[existingIndex].id! : this.nextCurrencyId++,
      name: currency.name,
      code: currency.code,
      buyPrice: currency.buyPrice,
      sellPrice: currency.sellPrice,
      change: currency.change ?? null,
      displayOrder: currency.displayOrder ?? 999,
      lastUpdate: new Date(currency.lastUpdate)
    };

    if (existingIndex >= 0) {
      this.data.currencies[existingIndex] = currencyWithId;
    } else {
      this.data.currencies.push(currencyWithId);
    }

    this.saveData();
    return currencyWithId;
  }

  // Currency history operations
  async getCurrencyHistory(code: string, startDate?: Date, endDate?: Date): Promise<CurrencyHistory[]> {
    let filtered = this.data.history.filter(h => h.code === code);

    if (startDate) {
      filtered = filtered.filter(h => h.timestamp >= startDate);
    }
    if (endDate) {
      filtered = filtered.filter(h => h.timestamp <= endDate);
    }

    return filtered.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
  }

  async addCurrencyHistory(history: InsertCurrencyHistory): Promise<CurrencyHistory> {
    const historyWithId: CurrencyHistory = {
      id: this.nextHistoryId++,
      ...history,
      timestamp: new Date(history.timestamp)
    };

    this.data.history.push(historyWithId);
    this.saveData();
    return historyWithId;
  }

  async cleanupOldHistory(olderThan: Date): Promise<number> {
    const initialLength = this.data.history.length;
    this.data.history = this.data.history.filter(h => h.timestamp >= olderThan);
    const removed = initialLength - this.data.history.length;
    
    if (removed > 0) {
      this.saveData();
    }
    
    return removed;
  }

  async getLastCurrencyHistory(code: string): Promise<CurrencyHistory | undefined> {
    const histories = this.data.history
      .filter(h => h.code === code)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return histories[0];
  }

  async getPreviousDifferentPrice(code: string, currentPrice: number): Promise<CurrencyHistory | undefined> {
    const histories = this.data.history
      .filter(h => h.code === code && h.buyPrice !== currentPrice)
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return histories[0];
  }

  // User operations (for compatibility)
  async getUser(id: number): Promise<User | undefined> {
    return undefined; // Not implemented in JSON version
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return undefined; // Not implemented in JSON version
  }

  async createUser(user: InsertUser): Promise<User> {
    throw new Error('User creation not implemented in JSON storage');
  }

  // Email management
  getAuthorizedEmails() {
    return this.data.emails.authorized;
  }

  addAuthorizedEmail(email: string, name: string, isAdmin: boolean = false) {
    const newEmail = { email, name, isAdmin };
    
    if (isAdmin) {
      this.data.emails.admin.push(newEmail);
    } else {
      this.data.emails.authorized.push(newEmail);
    }
    
    this.saveData();
  }

  removeAuthorizedEmail(email: string) {
    this.data.emails.authorized = this.data.emails.authorized.filter(e => e.email !== email);
    this.data.emails.admin = this.data.emails.admin.filter(e => e.email !== email);
    this.saveData();
  }

  updateLastAccess(email: string, isAdmin: boolean) {
    const lastAccess = new Date().toISOString();
    
    if (isAdmin) {
      const adminIndex = this.data.emails.admin.findIndex(e => e.email === email);
      if (adminIndex >= 0) {
        this.data.emails.admin[adminIndex].lastAccess = lastAccess;
      }
    } else {
      const authIndex = this.data.emails.authorized.findIndex(e => e.email === email);
      if (authIndex >= 0) {
        this.data.emails.authorized[authIndex].lastAccess = lastAccess;
      }
    }
    
    this.saveData();
  }

  // Migration helper - import data from PostgreSQL
  async importFromPostgreSQL(currencies: Currency[], history: CurrencyHistory[]) {
    console.log('📦 Migrando dados do PostgreSQL para JSON...');
    
    this.data.currencies = currencies.map(c => ({
      ...c,
      lastUpdate: new Date(c.lastUpdate)
    }));
    
    this.data.history = history.map(h => ({
      ...h,
      timestamp: new Date(h.timestamp)
    }));
    
    this.updateNextIds();
    this.saveData();
    
    console.log(`✅ Migração concluída: ${currencies.length} moedas, ${history.length} registros históricos`);
  }
}

export const jsonStorage = new JSONStorage();