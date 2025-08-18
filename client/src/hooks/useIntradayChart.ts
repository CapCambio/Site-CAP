import { useQuery } from '@tanstack/react-query';
import { format, isSameDay } from 'date-fns';

export interface IntradayChartData {
  hour: string;        // "01", "02", "03"...
  sellPrice: number | null;
  buyPrice: number | null;
  hasRealData: boolean; // true se tem dado real da hora
}

export function useIntradayChart(currencyCode: string) {
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const { 
    data: intradayData, 
    isLoading,
    refetch 
  } = useQuery({
    queryKey: ['/api/history/intraday', currencyCode, todayStr],
    queryFn: async () => {
      const response = await fetch(
        `/api/history/${currencyCode}?startDate=${todayStr}&endDate=${todayStr}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch intraday data');
      }

      const data = await response.json();
      return data.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    },
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000, // Refetch a cada 5 minutos
  });

  // Processar dados intraday
  const processIntradayData = (): IntradayChartData[] => {
    if (!intradayData || intradayData.length === 0) {
      return [];
    }

    const currentHour = today.getHours();
    const chartData: IntradayChartData[] = [];
    let lastKnownPrice: number | null = null;

    // Criar array de 24 horas (00 até 23)
    for (let hour = 0; hour <= currentHour; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      
      // Procurar dados reais para esta hora
      const hourData = intradayData.find((entry: any) => {
        const entryDate = new Date(entry.timestamp);
        return isSameDay(entryDate, today) && entryDate.getHours() === hour;
      });

      if (hourData) {
        // Tem dados reais para esta hora
        lastKnownPrice = hourData.sellPrice;
        chartData.push({
          hour: hourStr,
          sellPrice: hourData.sellPrice,
          buyPrice: hourData.buyPrice,
          hasRealData: true
        });
      } else if (lastKnownPrice !== null) {
        // Usar último preço conhecido para preencher lacunas
        chartData.push({
          hour: hourStr,
          sellPrice: lastKnownPrice,
          buyPrice: lastKnownPrice,
          hasRealData: false
        });
      } else {
        // Não há dados ainda
        chartData.push({
          hour: hourStr,
          sellPrice: null,
          buyPrice: null,
          hasRealData: false
        });
      }
    }

    return chartData;
  };

  const chartData = processIntradayData();
  
  // Verificar se há dados suficientes para mostrar gráfico
  const hasRealData = chartData.some(item => item.hasRealData);
  const uniquePricesCount = new Set(
    chartData
      .filter(item => item.sellPrice !== null)
      .map(item => item.sellPrice)
  ).size;

  const shouldShowChart = hasRealData && uniquePricesCount > 1;

  return {
    chartData,
    isLoading,
    shouldShowChart,
    refetch,
    hasRealData,
    uniquePricesCount
  };
}