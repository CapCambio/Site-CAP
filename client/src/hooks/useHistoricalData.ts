import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { CurrencyHistory, HistoryFilter } from '../lib/types';
import { formatDate } from '../lib/currency';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export function useHistoricalData() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<HistoryFilter>({
    code: 'USD',
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)),
    endDate: new Date(),
  });
  const { toast } = useToast();

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
    staleTime: 5 * 60 * 1000, // 5 minutos
    enabled: !!filter.code,
  });

  // Mostrar erro ao usuário quando houver erro
  useEffect(() => {
    if (isError && error) {
      toast({
        title: t('toasts.errorLoadHistory'),
        description: t('toasts.errorLoadHistoryDesc'),
        variant: "destructive"
      });
    }
  }, [isError, error, toast]);

  // Update filter and trigger refetch
  const updateFilter = (newFilter: Partial<HistoryFilter>) => {
    setFilter(prev => {
      const updated = { ...prev, ...newFilter };
      
      // Limitar a 1 ano atrás no máximo
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      // Se startDate for anterior a 1 ano, ajustar
      if (updated.startDate < oneYearAgo) {
        updated.startDate = oneYearAgo;
      }
      
      // Se endDate for no futuro, ajustar para agora
      const now = new Date();
      if (updated.endDate > now) {
        updated.endDate = now;
      }
      
      return updated;
    });
  };

  // Prepare chart data
  const chartData = historicalData ? historicalData
    .sort((a: CurrencyHistory, b: CurrencyHistory) => a.timestamp.getTime() - b.timestamp.getTime())
    .map((entry: CurrencyHistory) => ({
      date: formatDate(entry.timestamp),
      compra: entry.buyPrice,
      venda: entry.sellPrice
    })) : [];

  // Calculate average prices
  const averageBuy = historicalData && historicalData.length > 0
    ? historicalData.reduce((sum: number, item: CurrencyHistory) => sum + item.buyPrice, 0) / historicalData.length
    : 0;
    
  const averageSell = historicalData && historicalData.length > 0
    ? historicalData.reduce((sum: number, item: CurrencyHistory) => sum + item.sellPrice, 0) / historicalData.length
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
