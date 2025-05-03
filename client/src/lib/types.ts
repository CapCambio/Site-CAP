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
  buyPrice: number;
  sellPrice: number;
  timestamp: Date;
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
