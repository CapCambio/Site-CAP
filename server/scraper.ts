import { createHash } from 'node:crypto';
import path from 'path';
import fs from 'fs/promises';
import { Currency } from '../shared/schema';
import { getLatestCurrencyHistory } from './db';

// Interface para os dados extraídos do scraping
export interface ScrapedCurrency {
  name: string;
  code: string;
  buyPrice: number;
  sellPrice: number;
}

// URL da fonte de dados - Google Sheets
const SPREADSHEET_ID = '1FUFonvyBaF5kIpbKuAB53n_FEMZ1QDo1piI9JpsVsUk';
const SOURCE_URL = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=0`;

// Arquivo para armazenar o último hash
const HASH_FILE_PATH = path.join(process.cwd(), 'server', 'config', 'last-hash.json');

// Arquivo para cache dos dados de moedas
const CACHE_FILE_PATH = path.join(process.cwd(), 'server', 'config', 'currency-cache.json');

interface HashData {
  lastHash: string;
  lastUpdate: string;
}

interface CacheData {
  lastUpdate: string | null;
  currencies: ScrapedCurrency[];
}

/**
 * Gera um hash MD5 do conteúdo da tabela de preços
 */
function generateContentHash(tableContent: string): string {
  return createHash('md5').update(tableContent).digest('hex');
}

/**
 * Carrega o último hash salvo
 */
async function getLastHash(): Promise<string | null> {
  try {
    const data = await fs.readFile(HASH_FILE_PATH, 'utf-8');
    const hashData: HashData = JSON.parse(data);
    return hashData.lastHash;
  } catch (error) {
    console.log('Arquivo de hash não encontrado, será criado na primeira execução.');
    return null;
  }
}

/**
 * Salva o hash atual
 */
async function saveHash(hash: string): Promise<void> {
  try {
    const hashData: HashData = {
      lastHash: hash,
      lastUpdate: new Date().toISOString()
    };
    
    // Garante que o diretório existe
    const dir = path.dirname(HASH_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    
    await fs.writeFile(HASH_FILE_PATH, JSON.stringify(hashData, null, 2));
    console.log('Hash salvo com sucesso.');
  } catch (error) {
    console.error('Erro ao salvar hash:', error);
  }
}

// Cache em memória para performance
let memoryCache: { data: ScrapedCurrency[]; timestamp: number } | null = null;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Carrega dados do cache (memória primeiro, depois arquivo)
 */
async function getCachedData(): Promise<ScrapedCurrency[]> {
  const now = Date.now();
  
  // Verifica cache em memória primeiro
  if (memoryCache && (now - memoryCache.timestamp) < CACHE_TTL) {
    console.log(`⚡ Cache memória: ${memoryCache.data.length} moedas (idade: ${Math.round((now - memoryCache.timestamp) / 1000)}s)`);
    return memoryCache.data;
  }
  
  try {
    const data = await fs.readFile(CACHE_FILE_PATH, 'utf-8');
    const cacheData: CacheData = JSON.parse(data);
    
    if (cacheData.currencies && cacheData.currencies.length > 0) {
      // Atualiza cache em memória
      memoryCache = {
        data: cacheData.currencies,
        timestamp: now
      };
      
      console.log(`📦 Cache arquivo: ${cacheData.currencies.length} moedas (última atualização: ${cacheData.lastUpdate})`);
      return cacheData.currencies;
    }
  } catch (error) {
    console.log('Cache não encontrado ou inválido.');
  }
  
  return [];
}

/**
 * Salva dados no cache (memória + arquivo)
 */
async function saveCachedData(currencies: ScrapedCurrency[]): Promise<void> {
  try {
    const now = Date.now();
    
    // Atualiza cache em memória primeiro
    memoryCache = {
      data: currencies,
      timestamp: now
    };
    
    const cacheData: CacheData = {
      lastUpdate: new Date().toISOString(),
      currencies
    };
    
    // Garante que o diretório existe
    const dir = path.dirname(CACHE_FILE_PATH);
    await fs.mkdir(dir, { recursive: true });
    
    // Salva em arquivo de forma assíncrona (não bloqueia)
    fs.writeFile(CACHE_FILE_PATH, JSON.stringify(cacheData, null, 2))
      .then(() => console.log(`💾 Cache atualizado com ${currencies.length} moedas.`))
      .catch(error => console.error('Erro ao salvar cache:', error));
      
  } catch (error) {
    console.error('Erro ao salvar cache:', error);
  }
}

/**
 * Verifica se houve mudança no conteúdo do Google Sheets
 */
export async function hasContentChanged(): Promise<{ changed: boolean; csvContent?: string }> {
  console.log('Verificando mudanças no conteúdo do Google Sheets...');

  try {
    // Busca conteúdo do Google Sheets como CSV
    console.log(`🌐 Buscando CSV: ${SOURCE_URL}`);
    const response = await fetch(SOURCE_URL, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/csv,application/csv',
      },
      redirect: 'follow'
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const csvContent = await response.text();
    console.log(`📄 CSV recebido com ${csvContent.length} caracteres`);

    // Gera o hash do conteúdo
    const currentHash = generateContentHash(csvContent);
    console.log(`Hash atual: ${currentHash}`);

    // Compara com o último hash salvo
    const lastHash = await getLastHash();
    console.log(`Último hash: ${lastHash || 'N/A'}`);

    const changed = currentHash !== lastHash;

    if (changed) {
      console.log('🔄 Conteúdo do Google Sheets mudou! Iniciando parsing...');
      await saveHash(currentHash);
      return { changed: true, csvContent };
    } else {
      console.log('✅ Nenhuma mudança detectada no conteúdo.');
      return { changed: false };
    }

  } catch (error) {
    console.error('Erro ao verificar mudanças:', error);
    // Em caso de erro, assume que houve mudança para tentar fazer o scraping
    return { changed: true };
  }
}

/**
 * Função para extrair dados de câmbio do Google Sheets CSV
 */
export async function scrapeCurrencyData(): Promise<ScrapedCurrency[]> {
  // Primeiro verifica se houve mudança no conteúdo
  const { changed, csvContent } = await hasContentChanged();

  if (!changed) {
    console.log('📋 Sem mudanças detectadas. Tentando carregar do cache...');

    // Tenta carregar do cache
    const cachedData = await getCachedData();
    if (cachedData.length > 0) {
      return cachedData;
    }

    console.log('Cache vazio, fazendo scraping completo...');
  }

  console.log('🔄 Mudanças detectadas ou cache vazio. Iniciando parsing do CSV...');

  try {
    // Se não recebeu o CSV, busca novamente
    let csv = csvContent;
    if (!csv) {
      console.log(`🌐 Buscando CSV: ${SOURCE_URL}`);
      const response = await fetch(SOURCE_URL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/csv,application/csv',
        },
        redirect: 'follow'
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      csv = await response.text();
    }

    console.log(`📄 CSV recebido com ${csv.length} caracteres`);

    // Parse do CSV
    const results: ScrapedCurrency[] = [];
    const lines = csv.split('\n');

    // Pula cabeçalho (primeira linha)
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Parse da linha CSV (considerando vírgulas dentro de aspas)
      const parseCSVLine = (text: string): string[] => {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let char of text) {
          if (char === '"') {
            inQuotes = !inQuotes;
          } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
          } else {
            current += char;
          }
        }
        result.push(current.trim());
        return result;
      };

      const columns = parseCSVLine(line);

      // Espera: Código, Nome, Compra, Venda (ajuste conforme estrutura do seu Google Sheets)
      if (columns.length >= 4) {
        const code = columns[0].trim();
        const name = columns[1].trim();
        const buyText = columns[2].trim().replace('R$', '').replace(',', '.').replace(/\s/g, '');
        const sellText = columns[3].trim().replace('R$', '').replace(',', '.').replace(/\s/g, '');

        // Converte para números
        const buyPrice = parseFloat(buyText);
        const sellPrice = parseFloat(sellText);

        // Validação
        if (code && name && !isNaN(buyPrice) && !isNaN(sellPrice) && buyPrice > 0 && sellPrice > 0) {
          console.log(`Extraído: ${name} (${code}), Compra: ${buyPrice}, Venda: ${sellPrice}`);
          results.push({
            name,
            code,
            buyPrice,
            sellPrice
          });
        } else {
          console.log(`Linha inválida: ${line}`);
        }
      }
    }

    if (results.length > 0) {
      console.log(`Extração concluída. Encontradas ${results.length} moedas.`);
      await saveCachedData(results);
      return results;
    } else {
      console.log('Nenhuma moeda extraída do CSV.');
    }

  } catch (error) {
    console.error('Erro ao fazer scraping dos dados de moedas:', error);
  }

  // Fallback para cache
  console.log('Tentando usar cache como fallback...');
  const cachedData = await getCachedData();
  if (cachedData.length > 0) {
    console.log('Usando dados do cache como fallback.');
    return cachedData;
  }

  // Fallback para histórico PostgreSQL
  console.log('Tentando usar histórico PostgreSQL como fallback...');
  try {
    const latestHistory = await getLatestCurrencyHistory();

    if (latestHistory.size > 0) {
      console.log(`✅ Usando ${latestHistory.size} moedas do histórico PostgreSQL como fallback`);

      const codeToName: Record<string, string> = {
        'USD': 'Dólar Americano',
        'EUR': 'Euro',
        'GBP': 'Libra Esterlina',
        'CAD': 'Dólar Canadense',
        'AUD': 'Dólar Australiano',
        'ARS': 'Peso Argentino',
        'CLP': 'Peso Chileno',
        'UYU': 'Peso Uruguaio',
        'CHF': 'Franco Suíço',
        'JPY': 'Iene Japonês',
        'CNY': 'Yuan Chinês',
        'MXN': 'Peso Mexicano',
        'PYG': 'Guarani Paraguaio',
        'PEN': 'Novo Sol Peruano',
        'BOB': 'Boliviano',
        'COP': 'Peso Colombiano',
        'NZD': 'Dólar Neozelandês',
        'ZAR': 'Rand Sul-Africano'
      };

      const currencies: ScrapedCurrency[] = [];
      latestHistory.forEach((history, code) => {
        currencies.push({
          name: codeToName[code] || code,
          code: history.code,
          buyPrice: history.buy_price,
          sellPrice: history.sell_price
        });
      });

      await saveCachedData(currencies);
      return currencies;
    }
  } catch (dbError) {
    console.error('Erro ao acessar histórico do PostgreSQL:', dbError);
  }

  // Fallback hardcoded
  console.log('Usando valores de fallback hardcoded.');
  const currencies: ScrapedCurrency[] = [
    { name: "Dólar Americano", code: "USD", buyPrice: 5.55, sellPrice: 5.92 },
    { name: "Euro", code: "EUR", buyPrice: 6.40, sellPrice: 6.81 },
    { name: "Libra Esterlina", code: "GBP", buyPrice: 7.45, sellPrice: 8.19 },
    { name: "Dólar Australiano", code: "AUD", buyPrice: 3.52, sellPrice: 3.96 },
    { name: "Peso Argentino", code: "ARS", buyPrice: 0.004, sellPrice: 0.006 },
    { name: "Dólar Neozelandês", code: "NZD", buyPrice: 3.25, sellPrice: 3.64 },
    { name: "Dólar Canadense", code: "CAD", buyPrice: 4.00, sellPrice: 4.46 },
    { name: "Franco Suíço", code: "CHF", buyPrice: 6.60, sellPrice: 7.40 },
    { name: "Peso Uruguaio", code: "UYU", buyPrice: 0.135, sellPrice: 0.17 },
    { name: "Peso Chileno", code: "CLP", buyPrice: 0.0059, sellPrice: 0.0071 },
    { name: "Peso Mexicano", code: "MXN", buyPrice: 0.28, sellPrice: 0.35 },
    { name: "Peso Colombiano", code: "COP", buyPrice: 0.0014, sellPrice: 0.00185 },
    { name: "Yuan Chinês", code: "CNY", buyPrice: 0.75, sellPrice: 0.90 },
    { name: "Iene Japonês", code: "JPY", buyPrice: 0.032, sellPrice: 0.0453 },
    { name: "Sol Peruano", code: "PEN", buyPrice: 1.63, sellPrice: 1.74 },
    { name: "Rand Africano", code: "ZAR", buyPrice: 0.28, sellPrice: 0.356 }
  ];

  await saveCachedData(currencies);
  return currencies;
}

/**
 * Função auxiliar para calcular a variação percentual entre valores
 */
export function calculateChange(currentValue: number, previousValue: number): number | undefined {
  if (previousValue === 0 || isNaN(previousValue) || !isFinite(previousValue)) {
    return undefined;
  }
  const change = ((currentValue / previousValue) - 1) * 100;
  return isFinite(change) ? change : undefined;
}

/**
 * Função para atualizar moedas com base nos dados extraídos
 */
export function updateCurrenciesWithScrapedData(
  currentCurrencies: Currency[],
  scrapedData: ScrapedCurrency[]
): Omit<Currency, 'id'>[] {
  const now = new Date();

  // Mapeia as moedas existentes pelo código para acesso rápido
  const currencyMap = new Map<string, Currency>();
  currentCurrencies.forEach(currency => {
    currencyMap.set(currency.code, currency);
  });

  // Atualiza ou cria cada moeda com base nos dados extraídos
  return scrapedData.map((scraped, index) => {
    const existing = currencyMap.get(scraped.code);
    // Atribui a ordem de exibição baseada na ordem da lista que vem da página fonte
    const displayOrder = index + 1;

    // Se a moeda existir, calcula a variação em relação à cotação anterior
    if (existing) {
      const change = calculateChange(scraped.buyPrice, existing.buyPrice);

      return {
        // id será gerenciado pelo storage
        name: scraped.name,
        code: existing.code,
        buyPrice: scraped.buyPrice,
        sellPrice: scraped.sellPrice,
        change,
        lastUpdate: now.toISOString(),
        displayOrder // Mantém a ordem da página fonte
      };
    }

    // Se for uma nova moeda, cria sem variação (será undefined)
    return {
      // id será gerenciado pelo storage
      name: scraped.name,
      code: scraped.code,
      buyPrice: scraped.buyPrice,
      sellPrice: scraped.sellPrice,
      // Não definimos change para novas moedas (será undefined por padrão)
      lastUpdate: now.toISOString(),
      displayOrder // Mantém a ordem da página fonte
    };
  });
}