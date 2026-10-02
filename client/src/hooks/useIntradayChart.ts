import { useQuery } from '@tanstack/react-query';
import { isSameDay } from 'date-fns';

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
      // startDate/endDate como "YYYY-MM-DD" viram 00:00 UTC no servidor, então
      // endDate=today fechava o dia antes dele começar e não retornava nada.
      // endDate no instante atual cobre o dia inteiro já decorrido.
      const endDateStr = new Date().toISOString();
      const response = await fetch(
        `/api/history/${currencyCode}?startDate=${todayStr}&endDate=${endDateStr}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch intraday data');
      }
      const data = await response.json();

      // Buscar último preço antes de hoje para usar como baseline do gráfico
      const threeDaysAgo = new Date();
      threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
      const threeDaysAgoStr = threeDaysAgo.toISOString().split('T')[0];
      const baselineResponse = await fetch(
        `/api/history/${currencyCode}?startDate=${threeDaysAgoStr}&endDate=${todayStr}`
      );
      let baselineSellPrice: number | null = null;
      let baselineBuyPrice: number | null = null;
      if (baselineResponse.ok) {
        const baselineData = await baselineResponse.json();
        const todayStart = new Date(todayStr);
        const beforeToday = baselineData
          .filter((e: any) => new Date(e.timestamp) < todayStart)
          .sort((a: any, b: any) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        if (beforeToday.length > 0) {
          baselineSellPrice = beforeToday[0].sell_price;
          baselineBuyPrice = beforeToday[0].buy_price;
        }
      }

      return {
        records: data.map((item: any) => ({
          ...item,
          // A API devolve snake_case; o processamento lê camelCase. Sem este
          // mapeamento cada hora fica undefined e a linha só mostra o baseline.
          sellPrice: Number(item.sell_price),
          buyPrice: Number(item.buy_price),
          timestamp: new Date(item.timestamp)
        })),
        baselineSellPrice,
        baselineBuyPrice
      };
    },
    staleTime: 1 * 60 * 1000,
    refetchOnWindowFocus: false,
    refetchInterval: 5 * 60 * 1000,
  });

  // Processar dados intraday
  const processIntradayData = (): IntradayChartData[] => {
    const currentHour = today.getHours();
    const chartData: IntradayChartData[] = [];

    const records = intradayData?.records || [];
    const hasTodayData = records.length > 0;

    // Baseline = último preço antes de hoje (para horas antes da primeira mudança)
    const baselineSellPrice = intradayData?.baselineSellPrice ?? null;
    const baselineBuyPrice = intradayData?.baselineBuyPrice ?? null;

    let lastKnownSellPrice: number | null = baselineSellPrice;
    let lastKnownBuyPrice: number | null = baselineBuyPrice;

    // Criar array de todas as 24 horas (0 até 23)
    for (let hour = 0; hour <= 23; hour++) {
      const hourStr = hour.toString();

      // Procurar dados reais para esta hora
      let hourData = null;
      if (hasTodayData) {
        hourData = records.find((entry: any) => {
          const entryDate = new Date(entry.timestamp);
          return isSameDay(entryDate, today) && entryDate.getHours() === hour;
        });
      }

      if (hourData) {
        lastKnownSellPrice = hourData.sellPrice;
        lastKnownBuyPrice = hourData.buyPrice;
        chartData.push({
          hour: hourStr,
          sellPrice: hourData.sellPrice,
          buyPrice: hourData.buyPrice,
          hasRealData: true
        });
      } else if (hour <= currentHour) {
        const sellPrice: number | null = lastKnownSellPrice;
        const buyPrice: number | null = lastKnownBuyPrice;

        if (sellPrice !== null) {
          chartData.push({
            hour: hourStr,
            sellPrice,
            buyPrice,
            hasRealData: false
          });
        } else {
          chartData.push({
            hour: hourStr,
            sellPrice: null,
            buyPrice: null,
            hasRealData: false
          });
        }
      } else {
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

  // O último ponto ativo sempre reflete o preço atual
  if (currentCurrencyData?.sellPrice) {
    for (let i = chartData.length - 1; i >= 0; i--) {
      if (chartData[i].sellPrice !== null) {
        chartData[i].sellPrice = currentCurrencyData.sellPrice;
        chartData[i].buyPrice = currentCurrencyData.buyPrice ?? chartData[i].buyPrice;
        break;
      }
    }
  }

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