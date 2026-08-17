export interface Currency {
  id?: number;
  name: string;
  code: string;
  buyPrice: number;
  sellPrice: number;
  change: number | null;
  lastUpdate: Date;
}

export interface CurrencyHistory {
  id?: number;
  code: string;
  buy_price: number;
  sell_price: number;
  timestamp: string;
}

export type TabType = "current" | "history";

export interface HistoryFilter {
  code: string;
  startDate: Date;
  endDate: Date;
}

export interface ScrapedCurrency {
  name: string;
  code: string;
  buyPrice: number;
  sellPrice: number;
}
