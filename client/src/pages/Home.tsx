import { useState } from "react";
import { TabType } from "../lib/types";
import { useCurrencyData } from "../hooks/useCurrencyData";
import { useHistoricalData } from "../hooks/useHistoricalData";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { TabNavigation } from "../components/TabNavigation";
import { CurrencyCard } from "../components/CurrencyCard";
import { HistorySelection } from "../components/HistorySelection";
import { HistoryChart } from "../components/HistoryChart";
import { HistoryTable } from "../components/HistoryTable";
import { LoadingOverlay } from "../components/LoadingOverlay";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("current");
  
  // Currency data hook
  const { 
    currencies, 
    isLoading: isLoadingCurrencies, 
    isRefreshing,
    refreshData, 
    getFormattedLastUpdate 
  } = useCurrencyData();
  
  // Historical data hook
  const {
    historicalData,
    chartData,
    filter,
    updateFilter,
    isLoading: isLoadingHistory,
    refetch: fetchHistoricalData
  } = useHistoricalData();

  // Change active tab
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "history") {
      fetchHistoricalData();
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header 
        lastUpdate={getFormattedLastUpdate()} 
        onRefresh={refreshData}
        isRefreshing={isRefreshing}
      />
      
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
      
      <main className="container mx-auto px-4 pb-12 flex-grow">
        {/* Current Rates View */}
        {activeTab === "current" && (
          <div className="block">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {isLoadingCurrencies ? (
                // Loading skeleton
                Array.from({ length: 6 }).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md h-44 animate-pulse">
                    <div className="bg-gray-300 h-16 rounded-t-lg"></div>
                    <div className="p-4">
                      <div className="flex justify-between mb-3">
                        <div className="w-20 h-8 bg-gray-200 rounded"></div>
                        <div className="w-20 h-8 bg-gray-200 rounded"></div>
                      </div>
                      <div className="w-32 h-6 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                ))
              ) : (
                currencies.map(currency => (
                  <CurrencyCard key={currency.code} currency={currency} />
                ))
              )}
            </div>
          </div>
        )}
        
        {/* Historical View */}
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
      
      <Footer />
      
      <LoadingOverlay isVisible={isRefreshing} />
    </div>
  );
}
