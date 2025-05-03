import { 
  users, currencies, currencyHistory,
  type User, type InsertUser, 
  type Currency, type InsertCurrency,
  type CurrencyHistory, type InsertCurrencyHistory
} from "@shared/schema";

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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private currenciesMap: Map<string, Currency>;
  private currencyHistoryList: CurrencyHistory[];
  private userId: number;
  private currencyId: number;
  private historyId: number;

  constructor() {
    this.users = new Map();
    this.currenciesMap = new Map();
    this.currencyHistoryList = [];
    this.userId = 1;
    this.currencyId = 1;
    this.historyId = 1;

    // Initialize with some default currencies
    this.initializeDefaultCurrencies();
  }

  private initializeDefaultCurrencies() {
    const defaultCurrencies: InsertCurrency[] = [
      {
        name: "Dólar Americano",
        code: "USD",
        buyPrice: 5.25,
        sellPrice: 5.45,
        change: 0.42,
        lastUpdate: new Date()
      },
      {
        name: "Euro",
        code: "EUR",
        buyPrice: 5.75,
        sellPrice: 5.95,
        change: -0.18,
        lastUpdate: new Date()
      },
      {
        name: "Libra Esterlina",
        code: "GBP",
        buyPrice: 6.65,
        sellPrice: 6.85,
        change: 0.35,
        lastUpdate: new Date()
      },
      {
        name: "Dólar Canadense",
        code: "CAD",
        buyPrice: 3.85,
        sellPrice: 4.05,
        change: 0.22,
        lastUpdate: new Date()
      },
      {
        name: "Dólar Australiano",
        code: "AUD",
        buyPrice: 3.45,
        sellPrice: 3.65,
        change: -0.15,
        lastUpdate: new Date()
      },
      {
        name: "Iene",
        code: "JPY",
        buyPrice: 0.035,
        sellPrice: 0.037,
        change: 0.17,
        lastUpdate: new Date()
      }
    ];

    defaultCurrencies.forEach(currency => {
      this.upsertCurrency(currency);
    });

    // Add some historical data
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date();
      date.setDate(today.getDate() - i);
      
      defaultCurrencies.forEach(currency => {
        // Add small random variations for historical data
        const randomChange = (Math.random() * 0.4 - 0.2) / 100;
        const historicalEntry: InsertCurrencyHistory = {
          code: currency.code,
          buyPrice: currency.buyPrice * (1 + (i === 0 ? 0 : randomChange)),
          sellPrice: currency.sellPrice * (1 + (i === 0 ? 0 : randomChange)),
          timestamp: date
        };
        this.addCurrencyHistory(historicalEntry);
      });
    }
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getAllCurrencies(): Promise<Currency[]> {
    return Array.from(this.currenciesMap.values());
  }

  async getCurrencyByCode(code: string): Promise<Currency | undefined> {
    return this.currenciesMap.get(code);
  }

  async upsertCurrency(insertCurrency: InsertCurrency): Promise<Currency> {
    const existingCurrency = await this.getCurrencyByCode(insertCurrency.code);
    let currency: Currency;

    if (existingCurrency) {
      currency = {
        ...existingCurrency,
        ...insertCurrency,
      };
    } else {
      const id = this.currencyId++;
      currency = { ...insertCurrency, id };
    }

    this.currenciesMap.set(currency.code, currency);
    return currency;
  }

  async getCurrencyHistory(code: string, startDate?: Date, endDate?: Date): Promise<CurrencyHistory[]> {
    return this.currencyHistoryList.filter(history => {
      if (history.code !== code) return false;
      
      if (startDate && history.timestamp < startDate) return false;
      if (endDate && history.timestamp > endDate) return false;
      
      return true;
    }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Sort by timestamp descending
  }

  async addCurrencyHistory(insertHistory: InsertCurrencyHistory): Promise<CurrencyHistory> {
    const id = this.historyId++;
    const history: CurrencyHistory = { ...insertHistory, id };
    this.currencyHistoryList.push(history);
    return history;
  }

  async cleanupOldHistory(olderThan: Date): Promise<number> {
    const initialLength = this.currencyHistoryList.length;
    this.currencyHistoryList = this.currencyHistoryList.filter(
      history => history.timestamp >= olderThan
    );
    return initialLength - this.currencyHistoryList.length;
  }
}

export const storage = new MemStorage();
