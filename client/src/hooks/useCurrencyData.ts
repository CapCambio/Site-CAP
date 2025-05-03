import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Currency } from '../lib/types';
import { 
  scrapeCurrencyData, 
  storeCurrencyData, 
  getCachedCurrencyData,
  shouldRefreshData
} from '../lib/currency';

export function useCurrencyData() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Get currency data from API
  const { 
    data: currencies, 
    isLoading, 
    isError, 
    error, 
    refetch 
  } = useQuery({
    queryKey: ['/api/currencies'],
    refetchOnWindowFocus: false,
    staleTime: 15 * 60 * 1000, // 15 minutes
  });

  // Get the formatted last update time
  const getFormattedLastUpdate = () => {
    if (!lastUpdated) return 'Não disponível';
    
    return lastUpdated.toLocaleDateString('pt-BR') + ' ' + 
           lastUpdated.toLocaleTimeString('pt-BR', { 
             hour: '2-digit', 
             minute: '2-digit' 
           });
  };

  // Refresh currency data
  const refreshData = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Initialize last updated time
  useEffect(() => {
    if (currencies && currencies.length > 0) {
      // Use the most recent timestamp from the currencies
      const mostRecentDate = currencies.reduce((latest: Date, currency: Currency) => {
        const currDate = new Date(currency.lastUpdate);
        return currDate > latest ? currDate : latest;
      }, new Date(0));
      
      setLastUpdated(mostRecentDate);
    }
  }, [currencies]);

  return {
    currencies: currencies as Currency[] || [],
    isLoading,
    isRefreshing,
    isError,
    error,
    refreshData,
    lastUpdated,
    getFormattedLastUpdate
  };
}
