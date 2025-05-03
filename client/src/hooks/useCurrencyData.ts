import { useState, useEffect, useCallback } from 'react';
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
    staleTime: 60 * 1000, // 1 minuto (atualização automática a cada minuto)
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
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      // Uso do endpoint de atualização
      await fetch('/api/refresh-currencies');
      // Busca os dados atualizados
      await refetch();
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch]);

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

  // Configura a atualização automática a cada minuto
  useEffect(() => {
    // Atualiza imediatamente na primeira carga
    refreshData();
    
    // Configura o timer para atualizar a cada minuto
    const timer = setInterval(() => {
      console.log('Executando atualização automática...');
      refreshData();
    }, 60000); // 1 minuto
    
    // Limpa o timer quando o componente é desmontado
    return () => clearInterval(timer);
  }, [refreshData]);

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
