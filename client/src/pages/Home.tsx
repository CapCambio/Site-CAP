
import { useState } from "react";
import { TabType } from "../lib/types";
import { useCurrencyData } from "../hooks/useCurrencyData";
import { useHistoricalData } from "../hooks/useHistoricalData";
import { useIsMobile } from "../hooks/use-mobile";
import { ArrowDown, ArrowUp } from "lucide-react";
import { formatCurrencyValue, formatPercentage } from "../lib/currency";

import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { TabNavigation } from "../components/TabNavigation";
import { HistorySelection } from "../components/HistorySelection";
import { HistoryChart } from "../components/HistoryChart";
import { HistoryTable } from "../components/HistoryTable";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CurrencyLogo } from "../components/CurrencyLogo";
import { CurrencyCard } from "../components/CurrencyCard";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("current");
  const isMobile = useIsMobile();
  
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

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "history") {
      fetchHistoricalData();
    }
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <TabNavigation 
        activeTab={activeTab} 
        onTabChange={handleTabChange} 
      />
      
      <main className="container mx-auto px-4 pb-12 flex-grow">
        {activeTab === "current" && (
          <>
            {isMobile ? (
              <div className="grid grid-cols-1 gap-4">
                {isLoadingCurrencies ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-36 bg-gray-100 rounded-lg animate-pulse" />
                  ))
                ) : (
                  currencies.map(currency => (
                    <CurrencyCard key={currency.code} currency={currency} />
                  ))
                )}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[300px]">Moeda</TableHead>
                      <TableHead className="text-right">Compra</TableHead>
                      <TableHead className="text-right">Venda</TableHead>
                      <TableHead className="text-right">Variação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingCurrencies ? (
                      Array.from({ length: 6 }).map((_, index) => (
                        <TableRow key={index}>
                          <TableCell className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-48"></div>
                          </TableCell>
                          <TableCell className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-24 ml-auto"></div>
                          </TableCell>
                          <TableCell className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-24 ml-auto"></div>
                          </TableCell>
                          <TableCell className="animate-pulse">
                            <div className="h-6 bg-gray-200 rounded w-24 ml-auto"></div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      currencies.map(currency => (
                        <TableRow key={currency.code}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-3">
                              <CurrencyLogo code={currency.code} />
                              <span>{currency.name}</span>
                              <span className="text-sm font-medium bg-[#f3b234] text-[#000000] px-2 py-1 rounded">
                                {currency.code}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            R$ {formatCurrencyValue(currency.code, currency.buyPrice)}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            R$ {formatCurrencyValue(currency.code, currency.sellPrice)}
                          </TableCell>
                          <TableCell className="text-right">
                            {currency.change !== null && currency.change > 0 && (
                              <span className="text-sm font-medium text-green-600 flex items-center justify-end">
                                <ArrowUp className="mr-1 h-4 w-4" />
                                {formatPercentage(Math.abs(currency.change))}
                              </span>
                            )}
                            {currency.change !== null && currency.change < 0 && (
                              <span className="text-sm font-medium text-red-600 flex items-center justify-end">
                                <ArrowDown className="mr-1 h-4 w-4" />
                                {formatPercentage(Math.abs(currency.change))}
                              </span>
                            )}
                            {currency.change === null && (
                              <span className="text-sm font-medium text-gray-500">
                                Sem variação
                              </span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
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
      
      <Footer />
      
      <LoadingOverlay isVisible={isRefreshing} />
    </div>
  );
}
