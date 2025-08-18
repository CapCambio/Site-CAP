import { useQuery } from '@tanstack/react-query';
import { format, isSameDay } from 'date-fns';

export interface IntradayChartData {
  hour: string;        // "01", "02", "03"...
  sellPrice: number | null;
  buyPrice: number | null;
  hasRealData: boolean; // true se tem dado real da hora
}

export function useIntradayChart(currencyCode: string, currentCurrencyData?: any) {
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

  // Usar dados de fallback dos preços atuais (passados como parâmetro)

  // Processar dados intraday
  const processIntradayData = (): IntradayChartData[] => {
    const currentHour = today.getHours();
    const chartData: IntradayChartData[] = [];

    // Se não há dados intraday para hoje, usar dados atuais da moeda
    const hasTodayData = intradayData && intradayData.length > 0;
    
    // Preços de fallback dos dados atuais
    const fallbackSellPrice = currentCurrencyData?.sellPrice || null;
    const fallbackBuyPrice = currentCurrencyData?.buyPrice || null;
    
    let lastKnownSellPrice: number | null = null;
    let lastKnownBuyPrice: number | null = null;

    // Criar array de todas as 24 horas (00 até 23)
    for (let hour = 0; hour <= 23; hour++) {
      const hourStr = hour.toString().padStart(2, '0');
      
      // Procurar dados reais para esta hora
      let hourData = null;
      if (hasTodayData) {
        hourData = intradayData.find((entry: any) => {
          const entryDate = new Date(entry.timestamp);
          return isSameDay(entryDate, today) && entryDate.getHours() === hour;
        });
      }

      if (hourData) {
        // Tem dados reais para esta hora
        lastKnownSellPrice = hourData.sellPrice;
        lastKnownBuyPrice = hourData.buyPrice;
        chartData.push({
          hour: hourStr,
          sellPrice: hourData.sellPrice,
          buyPrice: hourData.buyPrice,
          hasRealData: true
        });
      } else if (hour <= currentHour) {
        // Para horas passadas e atual sem dados, usar dados conhecidos ou fallback
        const sellPrice = lastKnownSellPrice || fallbackSellPrice;
        const buyPrice = lastKnownBuyPrice || fallbackBuyPrice;
        
        if (sellPrice !== null) {
          chartData.push({
            hour: hourStr,
            sellPrice: sellPrice,
            buyPrice: buyPrice,
            hasRealData: false
          });
          // Se ainda não temos preços conhecidos, usar os atuais
          if (lastKnownSellPrice === null) {
            lastKnownSellPrice = sellPrice;
            lastKnownBuyPrice = buyPrice;
          }
        } else {
          chartData.push({
            hour: hourStr,
            sellPrice: null,
            buyPrice: null,
            hasRealData: false
          });
        }
      } else {
        // Para horas futuras, não incluir dados (null)
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
  const hasAnyValidData = chartData.some(item => item.sellPrice !== null);
  const uniquePricesCount = new Set(
    chartData
      .filter(item => item.sellPrice !== null)
      .map(item => item.sellPrice)
  ).size;

  // Sempre mostrar o gráfico intraday se temos pelo menos dados atuais
  const shouldShowChart = hasAnyValidData && (hasRealData || currentCurrencyData?.sellPrice);

  return {
    chartData,
    isLoading,
    shouldShowChart,
    refetch,
    hasRealData,
    uniquePricesCount
  };
}