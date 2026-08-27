import { createHash } from 'node:crypto';
import path from 'path';
import fs from 'fs/promises';
import { Currency } from '../shared/schema';
import { getLatestCurrencyHistory } from './db';

// Interface para os dados extraídos
export interface ScrapedCurrency {
  name: string;
  code: string;
  buyPrice: number;
  sellPrice: number;
}

// Google Sheets
const SPREADSHEET_ID = '1FUFonvyBaF5kIpbKuAB53n_FEMZ1QDo1piI9JpsVsUk';

const SOURCE_URL =
  `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/gviz/tq?tqx=out:json&gid=0`;

// Arquivos locais
const HASH_FILE_PATH = path.join(
  process.cwd(),
  'server',
  'config',
  'last-hash.json'
);

const CACHE_FILE_PATH = path.join(
  process.cwd(),
  'server',
  'config',
  'currency-cache.json'
);

interface HashData {
  lastHash: string;
  lastUpdate: string;
}

interface CacheData {
  lastUpdate: string | null;
  currencies: ScrapedCurrency[];
}

// Cache em memória
let memoryCache: {
  data: ScrapedCurrency[];
  timestamp: number;
} | null = null;

const CACHE_TTL = 5 * 60 * 1000;

/**
 * Gera hash do conteúdo recebido
 */
function generateContentHash(content: string): string {
  return createHash('md5')
    .update(content)
    .digest('hex');
}

/**
 * Converte valores da planilha em número.
 *
 * Aceita:
 * 5.45
 * "5.45"
 * "5,45"
 * "5.450,25"
 * "5,450.25"
 */
function parsePrice(value: unknown): number {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : 0;
  }

  if (typeof value !== 'string') {
    return 0;
  }

  let normalized = value
    .trim()
    .replace(/[R$\s]/g, '');

  if (!normalized) {
    return 0;
  }

  const hasComma = normalized.includes(',');
  const hasDot = normalized.includes('.');

  // Exemplo: 5.450,25
  if (hasComma && hasDot) {
    if (normalized.lastIndexOf(',') > normalized.lastIndexOf('.')) {
      normalized = normalized
        .replace(/\./g, '')
        .replace(',', '.');
    } else {
      normalized = normalized.replace(/,/g, '');
    }
  }

  // Exemplo: 5,45
  else if (hasComma) {
    normalized = normalized.replace(',', '.');
  }

  const parsed = Number(normalized);

  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Normaliza texto para comparação de cabeçalhos
 */
function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Lê o último hash salvo
 */
async function getLastHash(): Promise<string | null> {
  try {
    const data = await fs.readFile(
      HASH_FILE_PATH,
      'utf-8'
    );

    const hashData: HashData = JSON.parse(data);

    return hashData.lastHash;
  } catch {
    console.log(
      'ℹ️ Arquivo de hash não encontrado. Será criado após a primeira atualização válida.'
    );

    return null;
  }
}

/**
 * Salva o hash somente após sucesso completo
 */
async function saveHash(hash: string): Promise<void> {
  try {
    const dir = path.dirname(HASH_FILE_PATH);

    await fs.mkdir(dir, {
      recursive: true
    });

    const hashData: HashData = {
      lastHash: hash,
      lastUpdate: new Date().toISOString()
    };

    await fs.writeFile(
      HASH_FILE_PATH,
      JSON.stringify(hashData, null, 2),
      'utf-8'
    );

    console.log('💾 Hash salvo com sucesso.');
  } catch (error) {
    console.error(
      '❌ Erro ao salvar hash:',
      error
    );
  }
}

/**
 * Busca cache atual
 */
async function getCachedData(): Promise<ScrapedCurrency[]> {
  const now = Date.now();

  if (
    memoryCache &&
    now - memoryCache.timestamp < CACHE_TTL
  ) {
    console.log(
      `⚡ Usando cache em memória: ${memoryCache.data.length} moedas` 
    );

    return memoryCache.data;
  }

  try {
    const data = await fs.readFile(
      CACHE_FILE_PATH,
      'utf-8'
    );

    const cacheData: CacheData = JSON.parse(data);

    if (
      Array.isArray(cacheData.currencies) &&
      cacheData.currencies.length > 0
    ) {
      memoryCache = {
        data: cacheData.currencies,
        timestamp: now
      };

      console.log(
        `📦 Usando cache em arquivo: ${cacheData.currencies.length} moedas` 
      );

      console.log(
        `📅 Última atualização do cache: ${cacheData.lastUpdate}` 
      );

      return cacheData.currencies;
    }
  } catch {
    console.log(
      'ℹ️ Nenhum cache válido encontrado.'
    );
  }

  return [];
}

/**
 * Salva dados válidos no cache
 */
async function saveCachedData(
  currencies: ScrapedCurrency[]
): Promise<void> {
  try {
    const now = Date.now();

    memoryCache = {
      data: currencies,
      timestamp: now
    };

    const cacheData: CacheData = {
      lastUpdate: new Date().toISOString(),
      currencies
    };

    const dir = path.dirname(CACHE_FILE_PATH);

    await fs.mkdir(dir, {
      recursive: true
    });

    await fs.writeFile(
      CACHE_FILE_PATH,
      JSON.stringify(cacheData, null, 2),
      'utf-8'
    );

    console.log(
      `💾 Cache atualizado com ${currencies.length} moedas.` 
    );
  } catch (error) {
    console.error(
      '❌ Erro ao salvar cache:',
      error
    );
  }
}

/**
 * Busca conteúdo do Google Sheets
 */
async function fetchGoogleSheet(): Promise<string> {
  console.log(
    '🌐 Buscando dados do Google Sheets...'
  );

  console.log(
    `🔗 URL: ${SOURCE_URL}` 
  );

  const response = await fetch(SOURCE_URL, {
    headers: {
      'User-Agent':
        'Mozilla/5.0 (compatible; CurrencyBot/1.0)',
      'Accept':
        'application/json,text/plain,*/*'
    },
    redirect: 'follow'
  });

  console.log(
    `📡 Status HTTP: ${response.status} ${response.statusText}` 
  );

  if (!response.ok) {
    throw new Error(
      `Google Sheets retornou HTTP ${response.status}` 
    );
  }

  const rawContent = await response.text();

  if (!rawContent || rawContent.trim().length === 0) {
    throw new Error(
      'Google Sheets retornou uma resposta vazia.'
    );
  }

  console.log(
    `📄 Resposta recebida: ${rawContent.length} caracteres` 
  );

  return rawContent;
}

/**
 * Extrai o JSON da resposta do Google Visualization API.
 *
 * A resposta normalmente vem assim:
 *
 * google.visualization.Query.setResponse({...});
 */
function parseGoogleVisualizationResponse(
  rawContent: string
): any {
  const start = rawContent.indexOf('{');
  const end = rawContent.lastIndexOf('}');

  if (
    start === -1 ||
    end === -1 ||
    end <= start
  ) {
    console.error(
      '❌ Resposta inesperada do Google Sheets:'
    );

    console.error(
      rawContent.substring(0, 500)
    );

    throw new Error(
      'Não foi possível localizar JSON na resposta do Google Sheets.'
    );
  }

  const jsonString = rawContent.substring(
    start,
    end + 1
  );

  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error(
      '❌ Erro ao converter resposta em JSON.'
    );

    console.error(
      'Início da resposta:',
      rawContent.substring(0, 500)
    );

    throw error;
  }
}

/**
 * Procura automaticamente as colunas.
 */
function detectColumns(
  rows: any[]
): {
  codeIndex: number;
  nameIndex: number;
  buyIndex: number;
  sellIndex: number;
  dataStartIndex: number;
} {
  if (!rows.length) {
    throw new Error(
      'Google Sheets não possui linhas.'
    );
  }

  const firstRow = rows[0];

  const headers = firstRow.c?.map(
    (cell: any) => normalizeHeader(cell?.v)
  ) ?? [];

  console.log(
    '📋 Cabeçalhos detectados:',
    headers
  );

  let codeIndex = headers.findIndex(header =>
    [
      'codigo',
      'code',
      'sigla',
      'moeda'
    ].includes(header)
  );

  let nameIndex = headers.findIndex(header =>
    [
      'nome',
      'name',
      'descricao',
      'currency'
    ].includes(header)
  );

  let buyIndex = headers.findIndex(header =>
    [
      'compra',
      'buy',
      'buyprice',
      'precodecompra'
    ].includes(header)
  );

  let sellIndex = headers.findIndex(header =>
    [
      'venda',
      'sell',
      'sellprice',
      'precodevenda'
    ].includes(header)
  );

  const hasDetectedHeaders =
    codeIndex !== -1 &&
    nameIndex !== -1 &&
    buyIndex !== -1 &&
    sellIndex !== -1;

  // Se não houver cabeçalho reconhecível,
  // mantém a estrutura original esperada.
  if (!hasDetectedHeaders) {
    console.log(
      '⚠️ Cabeçalhos não reconhecidos. Usando estrutura padrão: Código, Nome, Compra, Venda.'
    );

    codeIndex = 0;
    nameIndex = 1;
    buyIndex = 2;
    sellIndex = 3;

    return {
      codeIndex,
      nameIndex,
      buyIndex,
      sellIndex,
      dataStartIndex: 0
    };
  }

  console.log(
    '✅ Estrutura identificada automaticamente.'
  );

  return {
    codeIndex,
    nameIndex,
    buyIndex,
    sellIndex,
    dataStartIndex: 1
  };
}

/**
 * Converte resposta do Google Sheets
 * para o formato interno do sistema.
 */
function extractCurrenciesFromGoogleSheet(
  data: any
): ScrapedCurrency[] {
  if (
    !data?.table ||
    !Array.isArray(data.table.rows)
  ) {
    throw new Error(
      'Resposta do Google Sheets não contém table.rows.'
    );
  }

  const rows = data.table.rows;

  console.log(
    `📊 Total de linhas recebidas: ${rows.length}` 
  );

  if (rows.length === 0) {
    return [];
  }

  const {
    codeIndex,
    nameIndex,
    buyIndex,
    sellIndex,
    dataStartIndex
  } = detectColumns(rows);

  const results: ScrapedCurrency[] = [];

  for (
    let index = dataStartIndex;
    index < rows.length;
    index++
  ) {
    const row = rows[index];

    if (!row?.c) {
      continue;
    }

    const code = String(
      row.c[codeIndex]?.v ?? ''
    )
      .trim()
      .toUpperCase();

    const name = String(
      row.c[nameIndex]?.v ?? ''
    ).trim();

    const buyPrice = parsePrice(
      row.c[buyIndex]?.v
    );

    const sellPrice = parsePrice(
      row.c[sellIndex]?.v
    );

    if (
      !code ||
      !name ||
      buyPrice <= 0 ||
      sellPrice <= 0
    ) {
      console.log(
        `⚠️ Linha ${index + 1} ignorada:`,
        {
          code,
          name,
          buyPrice,
          sellPrice,
          raw: row.c?.map(
            (cell: any) => cell?.v
          )
        }
      );

      continue;
    }

    const currency: ScrapedCurrency = {
      code,
      name,
      buyPrice,
      sellPrice
    };

    console.log(
      `💱 ${currency.code} | ${currency.name} | Compra: ${currency.buyPrice} | Venda: ${currency.sellPrice}` 
    );

    results.push(currency);
  }

  return results;
}

/**
 * Verifica se o conteúdo mudou.
 *
 * IMPORTANTE:
 * Não salva o hash aqui.
 * O hash só será salvo depois que o
 * conteúdo for parseado e validado.
 */
export async function hasContentChanged(): Promise<{
  changed: boolean;
  rawContent?: string;
  hash?: string;
}> {
  console.log(
    '🔍 Verificando alterações no Google Sheets...'
  );

  try {
    const rawContent = await fetchGoogleSheet();

    const currentHash =
      generateContentHash(rawContent);

    const lastHash =
      await getLastHash();

    console.log(
      `🔐 Hash atual: ${currentHash}` 
    );

    console.log(
      `🔐 Último hash: ${lastHash ?? 'N/A'}` 
    );

    const changed =
      currentHash !== lastHash;

    if (changed) {
      console.log(
        '🔄 Alteração detectada no Google Sheets.'
      );
    } else {
      console.log(
        '✅ Nenhuma alteração detectada.'
      );
    }

    return {
      changed,
      rawContent,
      hash: currentHash
    };
  } catch (error) {
    console.error(
      '❌ Erro ao verificar Google Sheets:',
      error
    );

    // Retorna changed=true para permitir
    // nova tentativa no scraping.
    return {
      changed: true
    };
  }
}

/**
 * Função principal de scraping.
 */
export async function scrapeCurrencyData(): Promise<
  ScrapedCurrency[]
> {
  const {
    changed,
    rawContent,
    hash
  } = await hasContentChanged();

  // Se nada mudou, utiliza cache.
  if (!changed) {
    console.log(
      '📋 Nenhuma alteração. Verificando cache...'
    );

    const cachedData =
      await getCachedData();

    if (cachedData.length > 0) {
      return cachedData;
    }

    console.log(
      '⚠️ Hash indica que não houve mudança, mas o cache está vazio. Fazendo nova leitura.'
    );
  }

  try {
    console.log(
      '🔄 Iniciando processamento dos dados do Google Sheets...'
    );

    // Usa resposta já buscada.
    // Se houve erro na primeira busca,
    // tenta novamente.
    const content =
      rawContent ??
      await fetchGoogleSheet();

    // Parse da resposta.
    const data =
      parseGoogleVisualizationResponse(
        content
      );

    console.log(
      '✅ JSON do Google Sheets parseado com sucesso.'
    );

    // Extrai moedas.
    const currencies =
      extractCurrenciesFromGoogleSheet(
        data
      );

    if (currencies.length === 0) {
      throw new Error(
        'Nenhuma moeda válida foi extraída do Google Sheets.'
      );
    }

    console.log(
      `✅ Extração concluída: ${currencies.length} moedas válidas.` 
    );

    // Salva cache SOMENTE com dados válidos.
    await saveCachedData(currencies);

    // Salva hash somente após sucesso completo.
    const finalHash =
      hash ??
      generateContentHash(content);

    await saveHash(finalHash);

    console.log(
      '🎉 Google Sheets processado com sucesso.'
    );

    return currencies;

  } catch (error) {
    console.error(
      '❌ Falha no processamento do Google Sheets:',
      error
    );
  }

  /*
   * FALLBACK 1
   * Cache
   */
  console.log(
    '📦 Tentando fallback do cache...'
  );

  const cachedData =
    await getCachedData();

  if (cachedData.length > 0) {
    console.warn(
      `⚠️ Usando ${cachedData.length} moedas do cache como fallback.` 
    );

    return cachedData;
  }

  /*
   * FALLBACK 2
   * PostgreSQL
   */
  console.log(
    '🗄️ Tentando fallback do histórico PostgreSQL...'
  );

  try {
    const latestHistory =
      await getLatestCurrencyHistory();

    if (latestHistory.size > 0) {
      console.warn(
        `⚠️ Usando ${latestHistory.size} moedas do histórico PostgreSQL.` 
      );

      const codeToName: Record<
        string,
        string
      > = {
        USD: 'Dólar Americano',
        EUR: 'Euro',
        GBP: 'Libra Esterlina',
        CAD: 'Dólar Canadense',
        AUD: 'Dólar Australiano',
        ARS: 'Peso Argentino',
        CLP: 'Peso Chileno',
        UYU: 'Peso Uruguaio',
        CHF: 'Franco Suíço',
        JPY: 'Iene Japonês',
        CNY: 'Yuan Chinês',
        MXN: 'Peso Mexicano',
        PYG: 'Guarani Paraguaio',
        PEN: 'Novo Sol Peruano',
        BOB: 'Boliviano',
        COP: 'Peso Colombiano',
        NZD: 'Dólar Neozelandês',
        ZAR: 'Rand Sul-Africano'
      };

      const currencies: ScrapedCurrency[] =
        [];

      latestHistory.forEach(
        (history, code) => {
          currencies.push({
            name:
              codeToName[code] ?? code,
            code: history.code,
            buyPrice:
              history.buy_price,
            sellPrice:
              history.sell_price
          });
        }
      );

      await saveCachedData(currencies);

      return currencies;
    }
  } catch (dbError) {
    console.error(
      '❌ Erro ao acessar histórico PostgreSQL:',
      dbError
    );
  }

  /*
   * FALLBACK 3
   * Valores hardcoded
   */
  console.error(
    '🚨 Todos os sistemas falharam. Usando fallback hardcoded.'
  );

  const currencies: ScrapedCurrency[] = [
    {
      name: 'Dólar Americano',
      code: 'USD',
      buyPrice: 5.55,
      sellPrice: 5.92
    },
    {
      name: 'Euro',
      code: 'EUR',
      buyPrice: 6.40,
      sellPrice: 6.81
    },
    {
      name: 'Libra Esterlina',
      code: 'GBP',
      buyPrice: 7.45,
      sellPrice: 8.19
    },
    {
      name: 'Dólar Australiano',
      code: 'AUD',
      buyPrice: 3.52,
      sellPrice: 3.96
    },
    {
      name: 'Peso Argentino',
      code: 'ARS',
      buyPrice: 0.004,
      sellPrice: 0.006
    },
    {
      name: 'Dólar Neozelandês',
      code: 'NZD',
      buyPrice: 3.25,
      sellPrice: 3.64
    },
    {
      name: 'Dólar Canadense',
      code: 'CAD',
      buyPrice: 4.00,
      sellPrice: 4.46
    },
    {
      name: 'Franco Suíço',
      code: 'CHF',
      buyPrice: 6.60,
      sellPrice: 7.40
    },
    {
      name: 'Peso Uruguaio',
      code: 'UYU',
      buyPrice: 0.135,
      sellPrice: 0.17
    },
    {
      name: 'Peso Chileno',
      code: 'CLP',
      buyPrice: 0.0059,
      sellPrice: 0.0071
    },
    {
      name: 'Peso Mexicano',
      code: 'MXN',
      buyPrice: 0.28,
      sellPrice: 0.35
    },
    {
      name: 'Peso Colombiano',
      code: 'COP',
      buyPrice: 0.0014,
      sellPrice: 0.00185
    },
    {
      name: 'Yuan Chinês',
      code: 'CNY',
      buyPrice: 0.75,
      sellPrice: 0.90
    },
    {
      name: 'Iene Japonês',
      code: 'JPY',
      buyPrice: 0.032,
      sellPrice: 0.0453
    },
    {
      name: 'Sol Peruano',
      code: 'PEN',
      buyPrice: 1.63,
      sellPrice: 1.74
    },
    {
      name: 'Rand Africano',
      code: 'ZAR',
      buyPrice: 0.28,
      sellPrice: 0.356
    }
  ];

  await saveCachedData(currencies);

  return currencies;
}

/**
 * Calcula variação percentual.
 */
export function calculateChange(
  currentValue: number,
  previousValue: number
): number | undefined {
  if (
    previousValue === 0 ||
    !Number.isFinite(previousValue)
  ) {
    return undefined;
  }

  const change =
    ((currentValue / previousValue) - 1) * 100;

  return Number.isFinite(change)
    ? change
    : undefined;
}

/**
 * Atualiza moedas com base nos dados extraídos.
 */
export function updateCurrenciesWithScrapedData(
  currentCurrencies: Currency[],
  scrapedData: ScrapedCurrency[]
): Omit<Currency, 'id'>[] {
  const now = new Date();

  const currencyMap =
    new Map<string, Currency>();

  currentCurrencies.forEach(currency => {
    currencyMap.set(
      currency.code,
      currency
    );
  });

  return scrapedData.map(
    (scraped, index) => {
      const existing =
        currencyMap.get(scraped.code);

      const displayOrder =
        index + 1;

      if (existing) {
        const change =
          calculateChange(
            scraped.buyPrice,
            existing.buyPrice
          );

        return {
          name: scraped.name,
          code: existing.code,
          buyPrice: scraped.buyPrice,
          sellPrice: scraped.sellPrice,
          change,
          lastUpdate:
            now.toISOString(),
          displayOrder
        };
      }

      return {
        name: scraped.name,
        code: scraped.code,
        buyPrice: scraped.buyPrice,
        sellPrice: scraped.sellPrice,
        lastUpdate:
          now.toISOString(),
        displayOrder
      };
    }
  );
}