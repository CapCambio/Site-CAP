import { readFileSync, writeFileSync, existsSync, mkdirSync, unlinkSync } from 'fs';
import { join } from 'path';
import type { Currency, CurrencyHistory, User, InsertCurrency, InsertCurrencyHistory, InsertUser } from '../shared/schema';

const DATA_DIR = './data';
const CURRENCIES_FILE = join(DATA_DIR, 'currencies.json');
const HISTORY_FILE = join(DATA_DIR, 'history.json');
const EMAILS_FILE = join(DATA_DIR, 'emails.json');
const LOCK_FILE = join(DATA_DIR, 'storage.lock');

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
          lastUpdate: new Date(c.lastUpdate).toISOString()
        }));
      }

      if (existsSync(HISTORY_FILE)) {
        const history = JSON.parse(readFileSync(HISTORY_FILE, 'utf8'));
        defaultData.history = history.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp).toISOString()
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

  private async saveData(): Promise<void> {
    const maxRetries = 10;
    const retryDelay = 100; // 100ms
    const lockTimeout = 30000; // 30 segundos
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Verificar se existe lock e se não está expirado
        if (existsSync(LOCK_FILE)) {
          const lockTime = parseInt(readFileSync(LOCK_FILE, 'utf8'));
          const now = Date.now();
          
          // Se lock está expirado, remover
          if (now - lockTime > lockTimeout) {
            console.log('🔓 Lock expirado, removendo...');
            unlinkSync(LOCK_FILE);
          } else {
            // Lock válido, esperar e tentar novamente
            if (attempt === 0) {
              console.log('⏳ Aguardando liberação do lock...');
            }
            await new Promise(resolve => setTimeout(resolve, retryDelay));
            continue;
          }
        }
        
        // Criar lock
        writeFileSync(LOCK_FILE, Date.now().toString());
        
        try {
          // Salvar dados com segurança
          writeFileSync(CURRENCIES_FILE, JSON.stringify(this.data.currencies, null, 2));
          writeFileSync(HISTORY_FILE, JSON.stringify(this.data.history, null, 2));
          writeFileSync(EMAILS_FILE, JSON.stringify(this.data.emails, null, 2));
          
          console.log('✅ Dados salvos com sucesso');
          return;
        } finally {
          // SEMPRE remover lock
          if (existsSync(LOCK_FILE)) {
            unlinkSync(LOCK_FILE);
          }
        }
      } catch (error) {
        // Limpar lock em caso de erro
        if (existsSync(LOCK_FILE)) {
          try {
            unlinkSync(LOCK_FILE);
          } catch (cleanupError) {
            console.error('❌ Erro ao limpar lock:', cleanupError);
          }
        }
        
        if (attempt === maxRetries - 1) {
          console.error('❌ Erro ao salvar dados após', maxRetries, 'tentativas:', error);
          throw error;
        }
        
        console.log(`⚠️ Tentativa ${attempt + 1} falhou, tentando novamente...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
      }
    }
  }

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
      change: currency.change ?? undefined, // Usar undefined em vez de null para o tipo number | undefined
      displayOrder: currency.displayOrder ?? 999,
      lastUpdate: new Date(currency.lastUpdate).toISOString() // Garantir que é uma string
    };

    if (existingIndex >= 0) {
      this.data.currencies[existingIndex] = currencyWithId;
    } else {
      this.data.currencies.push(currencyWithId);
    }

    await this.saveData();
    return currencyWithId;
  }

  // Currency history operations
  async getCurrencyHistory(code: string, startDate?: Date, endDate?: Date): Promise<CurrencyHistory[]> {
    let filtered = this.data.history.filter(h => h.code === code);

    if (startDate) {
      const startDateStr = startDate.toISOString();
      filtered = filtered.filter(h => h.timestamp >= startDateStr);
    }
    if (endDate) {
      const endDateStr = endDate.toISOString();
      filtered = filtered.filter(h => h.timestamp <= endDateStr);
    }

    // Ordenar por timestamp (mais antigo primeiro)
    return filtered.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  async addCurrencyHistory(history: InsertCurrencyHistory): Promise<CurrencyHistory> {
    const now = new Date();
    const historyWithId: CurrencyHistory = {
      id: this.nextHistoryId++,
      ...history,
      timestamp: now.toISOString()
    };

    console.log(`\n📝 Adicionando histórico para ${historyWithId.code}:`);
    console.log(`- ID: ${historyWithId.id}`);
    console.log(`- Compra: R$ ${historyWithId.buyPrice.toFixed(4)}`);
    console.log(`- Venda: R$ ${historyWithId.sellPrice.toFixed(4)}`);
    console.log(`- Timestamp: ${historyWithId.timestamp}`);

    // Verificar duplicatas exatas no histórico (últimos 5 minutos)
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000).toISOString();
    const duplicate = this.data.history.some(h => 
      h.code === historyWithId.code && 
      h.buyPrice === historyWithId.buyPrice && 
      h.sellPrice === historyWithId.sellPrice &&
      h.timestamp >= fiveMinutesAgo
    );

    if (duplicate) {
      console.log('⚠️  Histórico duplicado detectado, ignorando...');
      // Retorna o histórico existente em vez de adicionar um novo
      const existing = this.data.history.find(h => 
        h.code === historyWithId.code && 
        h.buyPrice === historyWithId.buyPrice && 
        h.sellPrice === historyWithId.sellPrice &&
        h.timestamp >= fiveMinutesAgo
      );
      
      if (!existing) {
        // Se por algum motivo não encontrou o duplicado, retorna o que seria adicionado
        return historyWithId;
      }
      return existing;
    }

    this.data.history.push(historyWithId);
    await this.saveData();
    
    // Limitar o histórico a no máximo 1 ano por moeda
    const historyForCurrency = this.data.history.filter(h => h.code === historyWithId.code);
    
    // Calcular data de 1 ano atrás
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    
    // Filtrar registros mais recentes que 1 ano
    const recentHistory = historyForCurrency.filter(h => new Date(h.timestamp) >= oneYearAgo);
    
    // Se houver registros antigos, remover eles
    if (recentHistory.length < historyForCurrency.length) {
      this.data.history = [
        ...this.data.history.filter(h => h.code !== historyWithId.code),
        ...recentHistory
      ];
      await this.saveData();
      console.log(`🗑️ Removidos ${historyForCurrency.length - recentHistory.length} registros antigos de ${historyWithId.code} (mais de 1 ano)`);
    }
    
    return historyWithId;
  }

  async cleanupOldHistory(olderThan: Date): Promise<number> {
    const initialCount = this.data.history.length;
    this.data.history = this.data.history.filter(h => new Date(h.timestamp) >= olderThan);
    const removedCount = initialCount - this.data.history.length;
    if (removedCount > 0) {
      await this.saveData();
    }
    return removedCount;
  }

  async getLastCurrencyHistory(code: string): Promise<CurrencyHistory | undefined> {
    const history = this.data.history
      .filter(h => h.code === code)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return history[0];
  }

  async getPreviousDifferentPrice(code: string, currentPrice: number): Promise<CurrencyHistory | undefined> {
    const history = this.data.history
      .filter(h => h.code === code && h.sellPrice !== currentPrice)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return history[0];
  }
}

export const jsonStorage = new JSONStorage();