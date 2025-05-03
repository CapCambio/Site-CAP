import { Currency, CurrencyHistory, ScrapedCurrency } from "./types";

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
  PYG: "py",
  BOB: "bo",
  COP: "co",
};

// Currency details like full names
export const currencyDetails: Record<string, { name: string }> = {
  USD: { name: "Dólar Americano" },
  EUR: { name: "Euro" },
  GBP: { name: "Libra Esterlina" },
  CAD: { name: "Dólar Canadense" },
  AUD: { name: "Dólar Australiano" },
  JPY: { name: "Iene" },
  CHF: { name: "Franco Suíço" },
  CNY: { name: "Yuan" },
  ARS: { name: "Peso Argentino" },
  UYU: { name: "Peso Uruguaio" },
  PEN: { name: "Nuevo Sol" },
  CLP: { name: "Peso Chileno" },
  MXN: { name: "Peso Mexicano" },
  PYG: { name: "Guarani Paraguaio" },
  BOB: { name: "Boliviano" },
  COP: { name: "Peso Colombiano" },
};

// Format currency values according to their rules
export function formatCurrencyValue(code: string, value: number): string {
  const locale = 'pt-BR';
  
  switch (code) {
    case 'JPY':
      // Japanese Yen has no decimal places
      return value.toLocaleString(locale, { 
        style: 'decimal',
        minimumFractionDigits: 3,
        maximumFractionDigits: 3
      });
    
    case 'CLP':
    case 'PYG':
      // Chilean and Paraguayan currencies have no decimal places
      return value.toLocaleString(locale, { 
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      });
      
    default:
      // Standard 2 decimal places for most currencies
      return value.toLocaleString(locale, { 
        style: 'decimal',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2 
      });
  }
}

// Format percentage changes
export function formatPercentage(value: number | null): string {
  if (value === null) return '0,00%';
  
  return value.toLocaleString('pt-BR', {
    style: 'decimal',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }) + '%';
}

// Format dates to Brazilian format
export function formatDate(date: Date): string {
  return date.toLocaleDateString('pt-BR');
}

// Format time to Brazilian format
export function formatDateTime(date: Date): string {
  return date.toLocaleDateString('pt-BR') + ' ' + 
         date.toLocaleTimeString('pt-BR', { 
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
