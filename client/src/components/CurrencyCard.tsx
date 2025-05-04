import { useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import { Currency } from "../lib/types";
import { Card } from "@/components/ui/card";
import { CurrencyLogo } from "./CurrencyLogo";
import { formatCurrencyValue, formatPercentage } from "../lib/currency";
import { CurrencyMiniChart } from "./CurrencyMiniChart";
import { useIsMobile } from "../hooks/use-mobile";

interface CurrencyCardProps {
  currency: Currency;
}

export function CurrencyCard({ currency }: CurrencyCardProps) {
  const { name, code, buyPrice, sellPrice, change } = currency;
  const [isExpanded, setIsExpanded] = useState(false);
  const isMobile = useIsMobile();
  
  const isPositiveChange = change !== null && change > 0;
  const isNegativeChange = change !== null && change < 0;
  
  const toggleExpand = () => {
    setIsExpanded(prev => !prev);
  };
  
  return (
    <Card className={`currency-card overflow-hidden hover:shadow-lg transition-all duration-300 ${isExpanded ? 'mb-4' : ''}`}>
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
        <div className="flex items-center justify-between">
          <div>
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
          </div>
          
          {isMobile && (
            <button 
              onClick={toggleExpand}
              className="text-xs text-[#1a1a1a] hover:text-gray-700 flex items-center focus:outline-none"
            >
              Mais informações de variação
              <ChevronDown 
                className={`ml-1 h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
              />
            </button>
          )}
        </div>
        
        {/* Área expandível com o gráfico */}
        {isMobile && isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <h4 className="text-sm font-medium mb-2">Histórico de preços (últimos 30 dias)</h4>
            <CurrencyMiniChart currencyCode={code} />
          </div>
        )}
      </div>
    </Card>
  );
}
