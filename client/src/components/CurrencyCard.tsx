import { ArrowDown, ArrowUp, ChevronDown } from "lucide-react";
import { Currency } from "../lib/types";
import { Card } from "@/components/ui/card";
import { CurrencyLogo } from "./CurrencyLogo";
import { formatCurrencyValue, formatPercentage } from "../lib/currency";
import { CurrencyMiniChart } from "./CurrencyMiniChart";
import { useIsMobile } from "../hooks/use-mobile";
import { format, isSameDay } from 'date-fns';

interface CurrencyCardProps {
  currency: Currency;
  historicalPrice?: {
    buyPrice: number | null;
    sellPrice: number | null;
    timestamp: Date | null;
  };
  selectedDate?: Date;
  isHistoricalView?: boolean;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export function CurrencyCard({ 
  currency, 
  historicalPrice, 
  selectedDate,
  isHistoricalView = false,
  isExpanded = false,
  onToggleExpand
}: CurrencyCardProps) {
  const { name, code, buyPrice, sellPrice, change } = currency;
  const isMobile = useIsMobile();
  
  const isPositiveChange = change !== null && change > 0;
  const isNegativeChange = change !== null && change < 0;
  
  // Determina se estamos exibindo dados históricos ou atuais
  const displayBuyPrice = isHistoricalView && historicalPrice ? historicalPrice.buyPrice : buyPrice;
  const displaySellPrice = isHistoricalView && historicalPrice ? historicalPrice.sellPrice : sellPrice;
  const hasHistoricalData = isHistoricalView && historicalPrice && historicalPrice.buyPrice !== null;
  
  // Verifica se a data selecionada é a data atual
  const isCurrentDate = selectedDate ? isSameDay(selectedDate, new Date()) : false;
  
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
            <p className={`text-xl font-bold text-[#1a1a1a] ${!hasHistoricalData && isHistoricalView ? 'opacity-50' : ''}`}>
              {hasHistoricalData || !isHistoricalView ? `R$ ${formatCurrencyValue(code, displayBuyPrice || 0)}` : '—'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Venda</p>
            <p className={`text-xl font-bold text-[#1a1a1a] ${!hasHistoricalData && isHistoricalView ? 'opacity-50' : ''}`}>
              {hasHistoricalData || !isHistoricalView ? `R$ ${formatCurrencyValue(code, displaySellPrice || 0)}` : '—'}
            </p>
          </div>
        </div>

        {/* Mensagem de cotação histórica - apenas mostrar se não for o dia atual */}
        {isHistoricalView && selectedDate && !isCurrentDate && (
          <div className="mb-3 text-center">
            {hasHistoricalData ? (
              <p className="text-sm font-bold text-[#f3b234]">
                Cotação do dia {format(selectedDate, 'dd/MM/yyyy')}
              </p>
            ) : (
              <p className="text-sm font-bold text-[#f3b234]">
                Sem registros da data selecionada
              </p>
            )}
          </div>
        )}
        
        <div className="flex items-center justify-between">
          <div>
            {isPositiveChange && !isHistoricalView && (
              <span className="text-sm font-medium text-green-600 flex items-center">
                <ArrowUp className="mr-1 h-4 w-4" />
                {formatPercentage(Math.abs(change || 0))}
              </span>
            )}
            {isNegativeChange && !isHistoricalView && (
              <span className="text-sm font-medium text-red-600 flex items-center">
                <ArrowDown className="mr-1 h-4 w-4" />
                {formatPercentage(Math.abs(change || 0))}
              </span>
            )}
            {((change === null || change === 0) && !isHistoricalView) && (
              <span className="text-sm font-medium text-gray-500">
                — 0,00%
              </span>
            )}
          </div>
          
          <button 
            onClick={onToggleExpand}
            className="text-xs text-[#1a1a1a] hover:text-gray-700 flex items-center focus:outline-none"
          >
            Mais informações de variação
            <ChevronDown 
              className={`ml-1 h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>
        
        {/* Área expandível com o gráfico */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <CurrencyMiniChart 
              currencyCode={code} 
              initialMonth={selectedDate && isHistoricalView ? selectedDate : undefined}
            />
          </div>
        )}
      </div>
    </Card>
  );
}