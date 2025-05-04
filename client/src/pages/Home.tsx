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
import { CurrencyCard } from "../components/CurrencyCard";
import { CurrencyConverter } from "../components/CurrencyConverter";
import { DatePicker } from "../components/DatePicker";


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

      <main className="container mx-auto px-4 pb-12 flex-grow">
        {!isLoadingCurrencies && activeTab === "current" && (
          <div className="my-6 max-w-3xl mx-auto">
            <CurrencyConverter currencies={currencies} />
          </div>
        )}

        {activeTab === "current" && (
          <>
            <div className="flex justify-center items-center mb-4 mt-4">
              <DatePicker
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
              />
            </div>
            
            <div className={`${isMobile ? '' : 'currency-grid'}`}>
              {isLoadingCurrencies || isLoadingDateSelection ? (
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-36 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className={`${isMobile ? '' : 'currency-desktop-layout'}`}>
                  {currencies.map(currency => (
                    <div key={currency.code} className="currency-item">
                      <CurrencyCard 
                        currency={currency}
                        historicalPrice={historicalPrices[currency.code]} 
                        selectedDate={selectedDate}
                        isHistoricalView={isHistoricalView}
                        isExpanded={expandedCards[currency.code] || false}
                        onToggleExpand={() => handleToggleCardExpand(currency.code)}
                      />
                    </div>
                  ))}
                </div>
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