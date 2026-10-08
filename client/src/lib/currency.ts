import { Currency, CurrencyHistory, ScrapedCurrency } from "./types";
import i18n from "./i18n";

// Map currency codes to flag icons using flagcdn.com
export const currencyFlags: Record<string, string> = {
  USD: "us",
  EUR: "eu",
  GBP: "gb",
  CAD: "ca",
  AUD: "au",
  JPY: "jp",
  CHF: "ch",
  CNY: "cn",
  ARS: "ar",
  UYU: "uy",
  PEN: "pe",
  CLP: "cl",
  MXN: "mx",
  COP: "co",
  NZD: "nz", // Nova Zelândia
  ZAR: "za", // África do Sul
  AED: "ae", // Emirados Árabes Unidos
};

// Currency codes list (names are translated via i18n keys: currencies.USD, currencies.EUR, etc.)
export const currencyDetails: Record<string, {}> = {
  USD: {},
  EUR: {},
  GBP: {},
  CAD: {},
  AUD: {},
  JPY: {},
  CHF: {},
  CNY: {},
  ARS: {},
  UYU: {},
  PEN: {},
  CLP: {},
  MXN: {},
  COP: {},
  NZD: {},
  ZAR: {},
  AED: {},
};

// Map i18n language codes to BCP 47 locale codes
function getLocale(): string {
  const lang = i18n.language || 'pt';
  const localeMap: Record<string, string> = {
    'pt': 'pt-BR',
    'en': 'en-US',
    'es': 'es-ES',
    'fr': 'fr-FR'
  };
  return localeMap[lang] || 'pt-BR';
}

// Format currency values according to their rules
// Shows up to 5 decimal places, and remove trailing zeros that don't change the value
export function formatCurrencyValue(code: string, value: number): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return '0,00';
  }
  const valueStr = value.toString();
  const [intPart, rawDecPart = ''] = valueStr.split('.');

  // Adiciona pontos de milhar na parte inteira
  const formattedIntPart = parseInt(intPart).toLocaleString('pt-BR');

  const decPart = rawDecPart.length > 5 ? rawDecPart.slice(0, 5) : rawDecPart;
  const minTwoDecimals = decPart.replace(/0+$/, '').padEnd(2, '0');

  return `${formattedIntPart},${minTwoDecimals}`;
}

// Format percentage changes
export function formatPercentage(value: number | null): string {
  if (value === null || value === 0) return '0,00%';
  if (typeof value !== 'number' || isNaN(value)) return '0,00%';

  // Converte para string e trunca para 2 casas sem arredondar
  const valueStr = value.toString();
  const [intPart, rawDecPart = ''] = valueStr.split('.');
  
  // Trunca para 2 decimais sem arredondar
  const decPart = rawDecPart.length > 2 ? rawDecPart.slice(0, 2) : rawDecPart.padEnd(2, '0');
  
  return `${intPart},${decPart}%`;
}

// Format dates to locale format
export function formatDate(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString(getLocale());
}

// Format time to locale format
export function formatDateTime(date: Date): string {
  const locale = getLocale();
  return date.toLocaleDateString(locale) + ' ' +
         date.toLocaleTimeString(locale, {
           hour: '2-digit',
           minute: '2-digit'
         });
}

// Parse currency data from the source website
export async function scrapeCurrencyData(): Promise<Currency[]> {
  try {
    // Make a proxy request to avoid CORS issues
    const proxyUrl = '/api/proxy-currency-data';
    
    // In a real implementation, this would be a server-side endpoint that fetches and parses the data
    // For this implementation, we'll just fetch from our stored data in the API
    const response = await fetch('/api/currencies');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch currency data: ${response.status}`);
    }
    
    const currencies = await response.json();
    return currencies.map((currency: any) => ({
      ...currency,
      lastUpdate: new Date(currency.lastUpdate)
    }));
  } catch (error) {
    console.error('Error scraping currency data:', error);
    throw error;
  }
}

// Store currency data in local storage
export function storeCurrencyData(currencies: Currency[]): void {
  // Store current rates
  localStorage.setItem('cap-currencies', JSON.stringify(currencies));
  
  // Store last update time
  localStorage.setItem('cap-last-update', new Date().toISOString());
}

// Get currency data from local storage
export function getCachedCurrencyData(): Currency[] | null {
  const data = localStorage.getItem('cap-currencies');
  if (!data) return null;
  
  try {
    const currencies = JSON.parse(data);
    return currencies.map((currency: any) => ({
      ...currency,
      lastUpdate: new Date(currency.lastUpdate)
    }));
  } catch (error) {
    console.error('Error parsing cached currency data:', error);
    return null;
  }
}

// Get last update time from local storage
export function getLastUpdateTime(): Date | null {
  const lastUpdate = localStorage.getItem('cap-last-update');
  if (!lastUpdate) return null;
  
  try {
    return new Date(lastUpdate);
  } catch (error) {
    return null;
  }
}

// Store historical data in local storage
export function storeHistoricalData(code: string, data: CurrencyHistory[]): void {
  localStorage.setItem(`cap-history-${code}`, JSON.stringify(data));
}

// Get historical data from local storage
export function getCachedHistoricalData(code: string): CurrencyHistory[] | null {
  const data = localStorage.getItem(`cap-history-${code}`);
  if (!data) return null;
  
  try {
    const history = JSON.parse(data);
    return history.map((item: any) => ({
      ...item,
      timestamp: new Date(item.timestamp)
    }));
  } catch (error) {
    console.error('Error parsing cached historical data:', error);
    return null;
  }
}

// Check if we need to refresh data (older than 15 minutes)
export function shouldRefreshData(): boolean {
  const lastUpdate = getLastUpdateTime();
  if (!lastUpdate) return true;
  
  const fifteenMinutes = 15 * 60 * 1000;
  return (new Date().getTime() - lastUpdate.getTime()) > fifteenMinutes;
}
