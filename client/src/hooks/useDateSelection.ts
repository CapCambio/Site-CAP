import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format, startOfDay, endOfDay } from 'date-fns';
import { Currency } from '../lib/types';

interface HistoricalPriceByDate {
  [code: string]: {
    buyPrice: number | null;
    sellPrice: number | null;
    timestamp: Date | null;
  };
}

export function useDateSelection() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  
  // Formatação para a API
  const dateStr = selectedDate.toISOString().split('T')[0];
  
  // Buscar dados históricos para a data selecionada
  const { 
    data: historicalPrices,
    isLoading,
    isError
  } = useQuery({
    queryKey: ['/api/history-by-date', dateStr],
    queryFn: async () => {
      // Converter para início e fim do dia em formato ISO string
      const startDateStr = startOfDay(selectedDate).toISOString();
      const endDateStr = endOfDay(selectedDate).toISOString();
      
      // Primeiro, obter todas as moedas para termos a lista completa
      const currenciesResponse = await fetch('/api/currencies');
      if (!currenciesResponse.ok) {
        throw new Error('Failed to fetch currencies');
      }
      
      const currencies: Currency[] = await currenciesResponse.json();
      
      // Iniciar um objeto vazio para armazenar o resultado
      const result: HistoricalPriceByDate = {};
      
      // Para cada moeda, buscar o histórico do dia
      for (const currency of currencies) {
        try {
          const historyResponse = await fetch(
            `/api/history/${currency.code}?startDate=${startDateStr}&endDate=${endDateStr}`
          );
          
          if (!historyResponse.ok) {
            // Se a API falhar, adicionamos a moeda sem dados
            result[currency.code] = {
              buyPrice: null,
              sellPrice: null,
              timestamp: null
            };
            continue;
          }
          
          const historyData = await historyResponse.json();
          
          // Se temos dados para aquele dia
          if (historyData && historyData.length > 0) {
            // Usamos o primeiro registro do dia (normalmente terá apenas um)
            result[currency.code] = {
              buyPrice: historyData[0].buy_price,
              sellPrice: historyData[0].sell_price,
              timestamp: new Date(historyData[0].timestamp)
            };
          } else {
            // Sem dados para aquele dia
            result[currency.code] = {
              buyPrice: null,
              sellPrice: null,
              timestamp: null
            };
          }
        } catch (error) {
          // Em caso de erro na API
          result[currency.code] = {
            buyPrice: null,
            sellPrice: null,
            timestamp: null
          };
        }
      }
      
      return result;
    },
    refetchOnWindowFocus: false,
  });
  
  // Formatar data para exibição
  const formattedDate = format(selectedDate, 'dd/MM/yyyy');
  
  return {
    selectedDate,
    setSelectedDate,
    formattedDate,
    historicalPrices: historicalPrices || {},
    isLoading,
    isError
  };
}