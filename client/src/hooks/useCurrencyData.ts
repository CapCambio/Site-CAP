import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Currency } from '../lib/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { 
  scrapeCurrencyData, 
  storeCurrencyData, 
  getCachedCurrencyData,
  shouldRefreshData
} from '../lib/currency';

export function useCurrencyData() {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

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
    staleTime: 5 * 60 * 1000, // 5 minutos (reduz requisições desnecessárias)
    queryFn: async () => {
      const currenciesResponse = await fetch('/api/currencies');

      if (!currenciesResponse.ok) {
        throw new Error('Failed to fetch currencies');
      }

      const currencies = await currenciesResponse.json();

      // Não sobrescrevemos a variação que vem do backend, pois ela já é calculada lá
      // As variações são calculadas corretamente para todas as moedas no servidor

      return currencies;
    },
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
      toast({
        title: t('toasts.refreshError'),
        description: t('toasts.refreshErrorDesc'),
        variant: "destructive"
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [refetch, toast]);

  // Initialize last updated time
  useEffect(() => {
    if (currencies && Array.isArray(currencies) && currencies.length > 0) {
      // Use the most recent timestamp from the currencies
      const mostRecentDate = currencies.reduce((latest: Date, currency: Currency) => {
        const currDate = new Date(currency.lastUpdate);
        return currDate > latest ? currDate : latest;
      }, new Date(0));

      setLastUpdated(mostRecentDate);
    }
  }, [currencies]);

  // Configura a atualização automática a cada 5 minutos
  useEffect(() => {
    // Não atualiza imediatamente na primeira carga - usa cache do React Query
    // Configura o timer para atualizar a cada 5 minutos
    const timer = setInterval(() => {
      console.log('Executando atualização automática...');
      refreshData().catch(err => {
        console.error('Erro na atualização automática:', err);
      });
    }, 5 * 60 * 1000); // 5 minutos

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