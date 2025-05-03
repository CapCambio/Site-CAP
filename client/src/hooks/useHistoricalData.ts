import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CurrencyHistory, HistoryFilter } from '../lib/types';
import { formatDate } from '../lib/currency';

export function useHistoricalData() {
  const [filter, setFilter] = useState<HistoryFilter>({
    code: 'USD',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });

  // Get historical data from API
  const { 
    data: historicalData, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['/api/history', filter.code, formatDate(filter.startDate), formatDate(filter.endDate)],
    queryFn: async () => {
      const startDateStr = filter.startDate.toISOString().split('T')[0];
      const endDateStr = filter.endDate.toISOString().split('T')[0];
      const response = await fetch(
        `/api/history/${filter.code}?startDate=${startDateStr}&endDate=${endDateStr}`
      );
      
      if (!response.ok) {
        throw new Error('Failed to fetch historical data');
      }
      
      const data = await response.json();
      return data.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    },
    refetchOnWindowFocus: false,
    enabled: !!filter.code,
  });

  // Update filter and trigger refetch
  const updateFilter = (newFilter: Partial<HistoryFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };

  // Prepare chart data
  const chartData = historicalData ? historicalData
    .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    .map((entry: CurrencyHistory) => ({
      date: formatDate(entry.timestamp),
      compra: entry.buyPrice,
      venda: entry.sellPrice
    })) : [];

  // Calculate average prices
  const averageBuy = historicalData && historicalData.length > 0
    ? historicalData.reduce((sum, item) => sum + item.buyPrice, 0) / historicalData.length
    : 0;
    
  const averageSell = historicalData && historicalData.length > 0
    ? historicalData.reduce((sum, item) => sum + item.sellPrice, 0) / historicalData.length
    : 0;

  return {
    historicalData: historicalData as CurrencyHistory[] || [],
    chartData,
    filter,
    updateFilter,
    isLoading,
    isError,
    error,
    refetch,
    stats: {
      averageBuy,
      averageSell,
      count: historicalData?.length || 0
    }
  };
}
