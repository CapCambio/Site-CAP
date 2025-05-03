import puppeteer from 'puppeteer';
import { Currency, ScrapedCurrency } from '../shared/schema';

// URL da fonte de dados
const SOURCE_URL = 'https://ctrcambio.com.br/tvcaxias/';

/**
 * Função para extrair os dados de câmbio da página fonte
 */
export async function scrapeCurrencyData(): Promise<ScrapedCurrency[]> {
  console.log('Iniciando scraping de dados de moedas...');
  
  try {
    // Inicia o navegador em modo headless
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    
    // Abre uma nova página
    const page = await browser.newPage();
    
    // Vai para a URL fonte
    await page.goto(SOURCE_URL, { waitUntil: 'networkidle2' });
    
    // Espera pelo carregamento das cotações
    await page.waitForSelector('.cotacao-inner');
    
    // Extrai dados das moedas
    const currencies = await page.evaluate(() => {
      const currencyElements = document.querySelectorAll('.cotacao-inner');
      const results: ScrapedCurrency[] = [];
      
      currencyElements.forEach((element) => {
        // Extrai nome e código da moeda
        const titleElement = element.querySelector('.cotacao-title');
        if (!titleElement) return;
        
        const titleText = titleElement.textContent?.trim() || '';
        // O formato esperado é algo como "Dólar Americano (USD)"
        const match = titleText.match(/(.+)\s+\(([A-Z]{3})\)/);
        if (!match) return;
        
        const name = match[1].trim();
        const code = match[2].trim();
        
        // Extrai valores de compra e venda
        const compraElement = element.querySelector('.cotacao-compra .cotacao-valor');
        const vendaElement = element.querySelector('.cotacao-venda .cotacao-valor');
        
        if (!compraElement || !vendaElement) return;
        
        // Converte os valores para números
        const compraText = compraElement.textContent?.trim().replace(',', '.') || '0';
        const vendaText = vendaElement.textContent?.trim().replace(',', '.') || '0';
        
        const buyPrice = parseFloat(compraText);
        const sellPrice = parseFloat(vendaText);
        
        // Adiciona à lista apenas se os valores foram extraídos com sucesso
        if (!isNaN(buyPrice) && !isNaN(sellPrice)) {
          results.push({
            name,
            code,
            buyPrice,
            sellPrice
          });
        }
      });
      
      return results;
    });
    
    // Fecha o navegador
    await browser.close();
    
    console.log(`Scraping concluído. Encontradas ${currencies.length} moedas.`);
    return currencies;
  } catch (error) {
    console.error('Erro ao fazer scraping dos dados de moedas:', error);
    throw error;
  }
}

/**
 * Função auxiliar para calcular a variação percentual entre valores
 */
export function calculateChange(currentValue: number, previousValue: number): number {
  if (previousValue === 0) return 0;
  return ((currentValue / previousValue) - 1) * 100;
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
  return scrapedData.map(scraped => {
    const existing = currencyMap.get(scraped.code);
    
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
        lastUpdate: now
      };
    }
    
    // Se for uma nova moeda, cria com variação nula
    return {
      // id será gerenciado pelo storage
      name: scraped.name,
      code: scraped.code,
      buyPrice: scraped.buyPrice,
      sellPrice: scraped.sellPrice,
      change: null, // Não há valor anterior para calcular
      lastUpdate: now
    };
  });
}