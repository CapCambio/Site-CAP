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
import { CurrencyConverter } from "../components/CurrencyConverter";


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

      <main className="container mx-auto px-4 pb-12 flex-grow">
        <div className="mb-4 flex justify-center">
          <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
        </div>
        
        {!isLoadingCurrencies && activeTab === "current" && (
          <CurrencyConverter currencies={currencies} />
        )}
        
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
              <div className="bg-black rounded-lg shadow-md overflow-hidden">
                <Table className="bg-white">
                  <TableHeader>
                    <TableRow className="border-b-[#000000]">
                      <TableHead className="w-[250px] text-[#000000]">Moeda</TableHead>
                      <TableHead className="w-[100px] text-[#000000]">Código</TableHead>
                      <TableHead className="text-right text-[#000000]">Compra</TableHead>
                      <TableHead className="text-right text-[#000000]">Venda</TableHead>
                      <TableHead className="text-right text-[#000000]">Variação</TableHead>
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
                            <div className="h-6 bg-gray-200 rounded w-16"></div>
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
                          <TableCell className="font-medium text-[#000000]">
                            <div className="flex items-center gap-3">
                              <CurrencyLogo code={currency.code} />
                              <span>{currency.name}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-sm font-medium bg-[#f3b234] text-[#000000] px-2 py-1 rounded">
                              {currency.code}
                            </span>
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
                            {(currency.change === null || currency.change === 0) && (
                              <span className="text-sm font-medium text-gray-500">
                                — 0,00%
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
      <LoadingOverlay isVisible={isRefreshing} />
    </div>
  );
}