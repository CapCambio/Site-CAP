import { ArrowDown, ArrowUp, ChevronDown, Bell, Info } from "lucide-react";
import { Currency } from "../lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencyLogo } from "./CurrencyLogo";
import { AlertModal } from "./AlertModal";
import { formatCurrencyValue, formatPercentage } from "../lib/currency";
import { CurrencyMiniChart } from "./CurrencyMiniChart";
import { useIsMobile } from "../hooks/use-mobile";
import { format, isSameDay } from 'date-fns';
import { useState, useRef } from "react";
import { useAuth } from "@/hooks/use-auth";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CurrencyCardProps {
  currency: Currency;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isHistoricalView?: boolean;
  historicalPrice?: {
    buyPrice: number | null;
    sellPrice: number | null;
    timestamp: Date | null;
  };
  selectedDate?: Date;
}

export function CurrencyCard({ 
  currency, 
  isExpanded, 
  onToggleExpand, 
  isHistoricalView = false, 
  historicalPrice,
  selectedDate
}: CurrencyCardProps) {
  const { name, code, buyPrice, sellPrice, change } = currency;
  const isMobile = useIsMobile();
  const [showAlertModal, setShowAlertModal] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);
  const { user } = useAuth();
  const tooltipTimerRef = useRef<NodeJS.Timeout | null>(null);

  const isPositiveChange = change !== null && change > 0;
  const isNegativeChange = change !== null && change < 0;

  // Determina se estamos exibindo dados históricos ou atuais
  const displayBuyPrice = isHistoricalView && historicalPrice ? historicalPrice.buyPrice : buyPrice;
  const displaySellPrice = isHistoricalView && historicalPrice ? historicalPrice.sellPrice : sellPrice;
  const hasHistoricalData = isHistoricalView && historicalPrice && historicalPrice.buyPrice !== null;

  // Verifica se a data selecionada é a data atual
  const isCurrentDate = selectedDate ? isSameDay(selectedDate, new Date()) : false;

  // Só esconde a variação se estiver em modo histórico E não for data atual
  const shouldShowVariation = !isHistoricalView || isCurrentDate;

  const handleTooltipOpen = () => {
    setShowTooltip(true);
    
    // Limpa timer anterior se existir
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
    }
    
    // Define timer para fechar após 8 segundos
    tooltipTimerRef.current = setTimeout(() => {
      setShowTooltip(false);
    }, 8000);
  };

  const handleTooltipClose = () => {
    setShowTooltip(false);
    
    // Limpa o timer
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (showTooltip) {
      handleTooltipClose();
    } else {
      handleTooltipOpen();
    }
  };

  const handleMouseEnter = () => {
    // Só executa hover em desktop
    if (!isMobile) {
      handleTooltipOpen();
    }
  };

  return (
    <Card className={`currency-card hover:shadow-lg transition-all duration-300 ${isExpanded ? 'mb-4' : ''}`}>
      <div className="bg-[#1a1a1a] text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <CurrencyLogo code={code} className="mr-3" />
          <h3 className="font-bold">{name}</h3>
        </div>
        <div className="flex items-center gap-2">
          {!user?.isAdmin && (
            <Button
              size="sm"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                setShowAlertModal(true);
              }}
              className="h-auto px-2 py-1 hover:bg-yellow-500/20 hover:text-white text-white flex items-center gap-1"
              title="Criar alerta de preço"
            >
              <span className="text-xs">Criar alerta</span>
              <Bell className="h-4 w-4" />
            </Button>
          )}
          <span className="text-sm font-medium bg-[#f3b234] text-[#1a1a1a] px-2 py-1 rounded">
            {code}
          </span>
        </div>
      </div>
      <div className="p-6">
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
                Cotação ao final do dia {format(selectedDate, 'dd/MM/yyyy')}
              </p>
            ) : (
              <p className="text-sm font-bold text-[#f3b234]">
                Sem registros da data selecionada
              </p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <div>
              {isPositiveChange && shouldShowVariation && (
                <span className="text-sm font-medium text-green-600 flex items-center">
                  <ArrowUp className="mr-1 h-4 w-4" />
                  {formatPercentage(Math.abs(change || 0))}
                </span>
              )}
              {isNegativeChange && shouldShowVariation && (
                <span className="text-sm font-medium text-red-600 flex items-center">
                  <ArrowDown className="mr-1 h-4 w-4" />
                  {formatPercentage(Math.abs(change || 0))}
                </span>
              )}
              {((change === null || change === 0) && shouldShowVariation) && (
                <span className="text-sm font-medium text-gray-500">
                  — 0,00%
                </span>
              )}
            </div>
            {shouldShowVariation && (
              <TooltipProvider delayDuration={0}>
                <Tooltip 
                  open={showTooltip} 
                  onOpenChange={(open) => {
                    // No mobile, controlamos manualmente via click
                    if (!isMobile) {
                      if (open) {
                        handleTooltipOpen();
                      } else {
                        handleTooltipClose();
                      }
                    }
                  }}
                >
                  <TooltipTrigger asChild>
                    <button 
                      className="flex items-center justify-center p-0 border-none bg-transparent cursor-help touch-manipulation"
                      onClick={handleButtonClick}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={() => {
                        // Só executa mouse leave em desktop
                        if (!isMobile) {
                          handleTooltipClose();
                        }
                      }}
                    >
                      <Info className="h-4 w-4 text-yellow-500 hover:text-yellow-600 flex-shrink-0" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent 
                    side="top" 
                    align="center"
                    className="max-w-[180px] p-2 z-[9999] text-center break-words"
                    sideOffset={12}
                    avoidCollisions={true}
                    collisionPadding={20}
                    alignOffset={0}
                    onPointerDownOutside={handleTooltipClose}
                    onEscapeKeyDown={handleTooltipClose}
                  >
                    <p className="text-xs">
                      Variação em relação a cotação que a moeda encerrou no dia anterior.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>

          <button 
            onClick={onToggleExpand}
            className="text-xs text-[#1a1a1a] hover:text-gray-700 flex items-center focus:outline-none"
          >
            Gráfico de variação
            <ChevronDown 
              className={`ml-1 h-4 w-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} 
            />
          </button>
        </div>

        {/* Área expandível com o gráfico */}
        {isExpanded && (
          <div className="mt-6 pt-6 border-t border-gray-200 pb-4">
            <CurrencyMiniChart 
              currencyCode={currency.code} 
              currentPrice={displaySellPrice || undefined}
              selectedDate={selectedDate}
            />
          </div>
        )}
      </div>

      {/* Modal de Alerta */}
      <AlertModal
        isOpen={showAlertModal}
        onClose={() => setShowAlertModal(false)}
        currencyCode={code}
        currencyName={name}
      />
    </Card>
  );
}