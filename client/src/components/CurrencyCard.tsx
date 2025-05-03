import { ArrowDown, ArrowUp } from "lucide-react";
import { Currency } from "../lib/types";
import { Card } from "@/components/ui/card";
import { CurrencyLogo } from "./CurrencyLogo";
import { formatCurrencyValue, formatPercentage } from "../lib/currency";

interface CurrencyCardProps {
  currency: Currency;
}

export function CurrencyCard({ currency }: CurrencyCardProps) {
  const { name, code, buyPrice, sellPrice, change } = currency;
  
  const isPositiveChange = change !== null && change > 0;
  const isNegativeChange = change !== null && change < 0;
  
  return (
    <Card className="currency-card overflow-hidden hover:shadow-lg transition-shadow duration-300">
      <div className="bg-[#1a1a1a] text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <CurrencyLogo code={code} className="mr-3" />
          <h3 className="font-bold">{name}</h3>
        </div>
        <span className="text-sm font-medium bg-[#f3b234] text-[#1a1a1a] px-2 py-1 rounded">
          {code}
        </span>
      </div>
      <div className="p-4">
        <div className="flex justify-between mb-3">
          <div>
            <p className="text-sm text-gray-500">Compra</p>
            <p className="text-xl font-bold text-[#1a1a1a]">
              R$ {formatCurrencyValue(code, buyPrice)}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Venda</p>
            <p className="text-xl font-bold text-[#1a1a1a]">
              R$ {formatCurrencyValue(code, sellPrice)}
            </p>
          </div>
        </div>
        <div className="flex items-center">
          {isPositiveChange && (
            <span className="text-sm font-medium text-green-600 flex items-center">
              <ArrowUp className="mr-1 h-4 w-4" />
              {formatPercentage(Math.abs(change || 0))}
            </span>
          )}
          {isNegativeChange && (
            <span className="text-sm font-medium text-red-600 flex items-center">
              <ArrowDown className="mr-1 h-4 w-4" />
              {formatPercentage(Math.abs(change || 0))}
            </span>
          )}
          {(change === null || change === 0) && (
            <span className="text-sm font-medium text-gray-500">
              — 0,00%
            </span>
          )}
          <span className="text-xs text-gray-500 ml-2">desde ontem</span>
        </div>
      </div>
    </Card>
  );
}
