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
// import { TabNavigation } from "../components/TabNavigation"; //Removed
import { HistorySelection } from "../components/HistorySelection";
import { HistoryChart } from "../components/HistoryChart";
import { HistoryTable } from "../components/HistoryTable";
import { LoadingOverlay } from "../components/LoadingOverlay";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CurrencyLogo } from "../components/CurrencyLogo";
import { CurrencyCard } from "../components/CurrencyCard";
import { CurrencyConverter } from "../components/CurrencyConverter";
import { DatePicker } from "../components/DatePicker";


export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("current");
  const isMobile = useIsMobile();
  const [showCalculator, setShowCalculator] = useState(false); // Added state for calculator visibility
  const [isHistoricalView, setIsHistoricalView] = useState(false);

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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="container mx-auto px-4 pb-12 flex-grow">
        {/* Removed TabNavigation */}
        {!isLoadingCurrencies && activeTab === "current" && (
          <div className="my-6 max-w-3xl mx-auto">
            <CurrencyConverter currencies={currencies} />
          </div>
        )}

        {activeTab === "current" && (
          <>
            {/* Seletor de data - exibido tanto na versão móvel quanto desktop */}
            <div className="flex justify-center items-center mb-4 mt-4">
              <DatePicker
                selectedDate={selectedDate}
                onDateChange={handleDateChange}
              />
            </div>
            
            {isMobile ? (
              <div className="grid grid-cols-1 gap-4">
                {isLoadingCurrencies || isLoadingDateSelection ? (
                  Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-36 bg-gray-100 rounded-lg animate-pulse" />
                  ))
                ) : (
                  currencies.map(currency => (
                    <CurrencyCard 
                      key={currency.code} 
                      currency={currency}
                      historicalPrice={historicalPrices[currency.code]} 
                      selectedDate={selectedDate}
                      isHistoricalView={isHistoricalView}
                    />
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
                    {isLoadingCurrencies || isLoadingDateSelection ? (
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
                            {isHistoricalView ? (
                              historicalPrices[currency.code]?.buyPrice !== null ? (
                                <span>
                                  R$ {formatCurrencyValue(currency.code, historicalPrices[currency.code]?.buyPrice || 0)}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )
                            ) : (
                              <span>
                                R$ {formatCurrencyValue(currency.code, currency.buyPrice)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {isHistoricalView ? (
                              historicalPrices[currency.code]?.sellPrice !== null ? (
                                <span>
                                  R$ {formatCurrencyValue(currency.code, historicalPrices[currency.code]?.sellPrice || 0)}
                                </span>
                              ) : (
                                <span className="text-gray-400">—</span>
                              )
                            ) : (
                              <span>
                                R$ {formatCurrencyValue(currency.code, currency.sellPrice)}
                              </span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {!isHistoricalView && currency.change !== null && currency.change > 0 && (
                              <span className="text-sm font-medium text-green-600 flex items-center justify-end">
                                <ArrowUp className="mr-1 h-4 w-4" />
                                {formatPercentage(Math.abs(currency.change))}
                              </span>
                            )}
                            {!isHistoricalView && currency.change !== null && currency.change < 0 && (
                              <span className="text-sm font-medium text-red-600 flex items-center justify-end">
                                <ArrowDown className="mr-1 h-4 w-4" />
                                {formatPercentage(Math.abs(currency.change))}
                              </span>
                            )}
                            {(!isHistoricalView && (currency.change === null || currency.change === 0)) && (
                              <span className="text-sm font-medium text-gray-500">
                                — 0,00%
                              </span>
                            )}
                            {isHistoricalView && (
                              <span className="text-sm font-medium text-[#f3b234]">
                                {historicalPrices[currency.code]?.timestamp ? 
                                  `${format(selectedDate, 'dd/MM/yyyy')}` : 
                                  'Sem registros'}
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
      <LoadingOverlay isVisible={isLoadingCurrencies} type={isRefreshing ? 'silent' : 'full'} />
    </div>
  );
}