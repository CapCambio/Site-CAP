// Tipos básicos para o sistema JSON
export interface User {
  id: number;
  username: string;
  password: string;
}

export interface InsertUser {
  username: string;
  password: string;
}

export interface Currency {
  id: number;
  name: string;
  code: string;
  buyPrice: number;
  sellPrice: number;
  change?: number;
  lastUpdate: string;
  displayOrder: number;
}

export interface InsertCurrency {
  name: string;
  code: string;
  buyPrice: number;
  sellPrice: number;
  change?: number;
  lastUpdate: string;
  displayOrder: number;
}

export interface CurrencyHistory {
  id: number;
  code: string;
  buyPrice: number;
  sellPrice: number;
  timestamp: string;
}

export interface InsertCurrencyHistory {
  code: string;
  buyPrice: number;
  sellPrice: number;
  timestamp: string;
}