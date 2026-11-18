import { useState, useEffect, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Currency } from '../lib/types';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import {
  scrapeCurrencyData,
  storeCurrencyData,
  getCachedCurrencyData,
  shouldRefreshData,
  formatDateTime,
  isPriceFresh
} from '../lib/currency';

export function useCurrencyData() {
  const { t } = useTranslation();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const { toast } = useToast();

  // Get currency data from API
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ['/api/currencies'],
    refetchOnWindowFocus: false,
    staleTime: 30 * 1000, // 30 segundos - permite atualização mais rápida
    queryFn: async () => {
      const currenciesResponse = await fetch('/api/currencies');

      if (!currenciesResponse.ok) {
        throw new Error('Failed to fetch currencies');
      }

      const currencies = await currenciesResponse.json();
      // Header do servidor: momento da última consulta bem-sucedida à planilha.
      // É o sinal de frescor (independe de o preço ter mudado ou não).
      const lastSuccessfulCheck = currenciesResponse.headers.get('X-Sheet-Last-Check') || null;

      return { currencies: currencies as Currency[], lastSuccessfulCheck };
    },
  });

  const currencies = data?.currencies ?? [];
  // Sem consulta bem-sucedida recente à planilha, mostra traço em vez de preço.
  const pricesFresh = isPriceFresh(data?.lastSuccessfulCheck);

  // Get the formatted last update time
  const getFormattedLastUpdate = () => {
    if (!lastUpdated) return t('common.notAvailable');

    return formatDateTime(lastUpdated);
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

  // Configura a atualização automática a cada 30 segundos
  useEffect(() => {
    // Lê apenas o cache do servidor (/api/currencies). A leitura da planilha é
    // responsabilidade do timer do servidor, não de cada visitante.
    const timer = setInterval(() => {
      refetch().catch(err => {
        console.error('Erro na atualização automática:', err);
      });
    }, 30 * 1000); // 30 segundos

    // Limpa o timer quando o componente é desmontado
    return () => clearInterval(timer);
  }, [refetch]);

  return {
    currencies: currencies as Currency[],
    pricesFresh,
    isLoading,
    isRefreshing,
    isError,
    error,
    refreshData,
    lastUpdated,
    getFormattedLastUpdate
  };
}
