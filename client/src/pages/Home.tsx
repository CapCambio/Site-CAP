import { useState } from "react";
import { TabType } from "../lib/types";
import { useCurrencyData } from "../hooks/useCurrencyData";
import { useHistoricalData } from "../hooks/useHistoricalData";
import { useDateSelection } from "../hooks/useDateSelection";
import { useIsMobile } from "../hooks/use-mobile";
import { ArrowDown, ArrowUp } from "lucide-react";
import { formatCurrencyValue, formatPercentage } from "../lib/currency";
import { format } from "date-fns";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { HistorySelection } from "../components/HistorySelection";
import { HistoryChart } from "../components/HistoryChart";
import { HistoryTable } from "../components/HistoryTable";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { CurrencyLogo } from "../components/CurrencyLogo";
import { CurrencyConverter } from "../components/CurrencyConverter";
import { DatePicker } from "../components/DatePicker";
import { TabNavigation } from "../components/TabNavigation";


export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("current");
  const isMobile = useIsMobile();
  const [showCalculator, setShowCalculator] = useState(false);
  const [isHistoricalView, setIsHistoricalView] = useState(false);
  const [expandedCards, setExpandedCards] = useState<{[key: string]: boolean}>({}); // Para controlar individualmente cada card

  const { 
    currencies, 
    isLoading: isLoadingCurrencies, 
    isRefreshing,
    refreshData, 
    getFormattedLastUpdate 
  } = useCurrencyData();

  // Debug logs
  console.log('Home component debug:', {
    activeTab,
    currencies: currencies?.length || 0,
    isLoadingCurrencies,
    isRefreshing
  });

  const {
    historicalData,
    chartData,
    filter,
    updateFilter,
    isLoading: isLoadingHistory,
    refetch: fetchHistoricalData
  } = useHistoricalData();
  
  const {
    selectedDate,
    setSelectedDate,
    historicalPrices,
    isLoading: isLoadingDateSelection
  } = useDateSelection();

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "history") {
      fetchHistoricalData();
    }
  };
  
  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setIsHistoricalView(true);
  };
  
  const handleResetToCurrentView = () => {
    setIsHistoricalView(false);
  };
  
  const handleToggleCardExpand = (code: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange}
      />

      <main className="container mx-auto px-4 pb-12 flex-grow">
        {!isLoadingCurrencies && activeTab === "current" && (
          <div className="my-6 max-w-3xl mx-auto">
            <CurrencyConverter currencies={currencies} />
          </div>
        )}

        {activeTab === "current" && (
          <>
            {/* Calculadora de Conversão */}
            <div className="my-6 max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-bold text-[#1a1a1a] mb-4">Calculadora de Conversão</h2>
              <CurrencyConverter currencies={currencies} />
            </div>

            {/* Seletor de Data */}
            <div className="flex justify-center items-center mb-6">
              <div className="bg-white rounded-lg shadow p-4">
                <DatePicker
                  selectedDate={selectedDate}
                  onDateChange={handleDateChange}
                />
              </div>
            </div>
            
            {/* Grid de Cards das Moedas */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoadingCurrencies || isLoadingDateSelection ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="h-48 bg-gray-100 rounded-lg animate-pulse" />
                ))
              ) : (
                currencies.map(currency => (
                  <div key={currency.code} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
                    {/* Header do Card */}
                    <div className="bg-[#1a1a1a] text-white p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <CurrencyLogo code={currency.code} className="w-8 h-8" />
                          <div>
                            <h3 className="font-bold text-lg">{currency.code}</h3>
                            <p className="text-sm opacity-80">{currency.name}</p>
                          </div>
                        </div>
                        {currency.change !== null && (
                          <div className={`flex items-center space-x-1 ${currency.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {currency.change > 0 ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                            <span className="text-sm font-medium">{formatPercentage(currency.change)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Conteúdo do Card */}
                    <div className="p-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">Compra</p>
                          <p className="text-xl font-bold text-green-600">
                            {formatCurrencyValue(currency.code, currency.buyPrice)}
                          </p>
                        </div>
                        <div className="text-center">
                          <p className="text-sm text-gray-500 mb-1">Venda</p>
                          <p className="text-xl font-bold text-red-600">
                            {formatCurrencyValue(currency.code, currency.sellPrice)}
                          </p>
                        </div>
                      </div>
                      
                      {/* Última atualização */}
                      <div className="mt-4 text-center">
                        <p className="text-xs text-gray-400">
                          Atualizado: {new Date(currency.lastUpdate).toLocaleTimeString('pt-BR', { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {activeTab === "history" && (
          <div className="block">
            <HistorySelection 
              filter={filter}
              onFilterChange={updateFilter}
              onSubmit={fetchHistoricalData}
            />

            <HistoryChart 
              data={chartData}
              filter={filter}
              isLoading={isLoadingHistory}
            />

            <HistoryTable 
              data={historicalData}
              code={filter.code}
              isLoading={isLoadingHistory}
            />
          </div>
        )}
      </main>
      <LoadingOverlay isVisible={isLoadingCurrencies} type={isRefreshing ? 'silent' : 'full'} />
    </div>
  );
}