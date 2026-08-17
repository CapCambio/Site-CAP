import { useState, useEffect } from 'react';
import { format, getDate, startOfMonth, endOfMonth, isBefore, isSameDay, getMonth, getYear } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CurrencyHistory } from '../lib/types';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { ptBR } from 'date-fns/locale';
import { useIntradayChart } from '../hooks/useIntradayChart';
import { api } from '@/lib/http';

interface CurrencyMiniChartProps {
  currencyCode: string;
  currentPrice?: number;
  selectedDate?: Date;
}

export function CurrencyMiniChart({ currencyCode, currentPrice, selectedDate }: CurrencyMiniChartProps) {
  console.log(' CurrencyMiniChart renderizado para:', currencyCode);
  const { t, i18n } = useTranslation();
  const [selectedMonth, setSelectedMonth] = useState<Date>(selectedDate ? startOfMonth(selectedDate) : startOfMonth(new Date()));
  const [chartType, setChartType] = useState<'day' | 'month'>('month');
  const today = new Date();
  const [isMobileLandscape, setIsMobileLandscape] = useState(false);
  const [isMobilePortrait, setIsMobilePortrait] = useState(false);

  // Detectar mobile orientation
  useEffect(() => {
    const checkOrientation = () => {
      const isMobile = window.innerWidth < 640; // Tailwind's sm breakpoint
      const isLandscape = window.innerWidth > window.innerHeight;
      const isPortrait = window.innerHeight > window.innerWidth;
      
      setIsMobileLandscape(isMobile && isLandscape);
      setIsMobilePortrait(isMobile && isPortrait);
    };

    checkOrientation();
    window.addEventListener('resize', checkOrientation);
    window.addEventListener('orientationchange', checkOrientation);

    return () => {
      window.removeEventListener('resize', checkOrientation);
      window.removeEventListener('orientationchange', checkOrientation);
    };
  }, []);



  // Buscar dados atuais da moeda primeiro
  const { data: currentCurrencyData } = useQuery({
    queryKey: ['/api/currencies/current-for-intraday', currencyCode],
    queryFn: async () => {
      const currencies = await api.currencies.getAll();
      return currencies.find((c: any) => c.code === currencyCode);
    },
    refetchOnWindowFocus: false,
  });

  // Hook para dados intraday
  const {
    chartData: intradayChartData,
    isLoading: isIntradayLoading,
    shouldShowChart: shouldShowIntradayChart
  } = useIntradayChart(currencyCode, currentCurrencyData);

  // Atualizar o mês APENAS quando selectedDate mudar para um mês diferente
  useEffect(() => {
    if (selectedDate) {
      const selectedMonthStart = startOfMonth(selectedDate);
      const currentMonthStart = startOfMonth(selectedMonth);
      // Só atualizar se for um mês diferente do atual
      if (selectedMonthStart.getTime() !== currentMonthStart.getTime()) {
        setSelectedMonth(selectedMonthStart);
      }
    }
  }, [selectedDate]); // Remover selectedMonth das dependências para evitar loops

  // Calcular o limite de 12 meses para trás (1 ano)
  const minDate = new Date();
  minDate.setFullYear(minDate.getFullYear() - 1);

  // Determinar o início e fim do mês selecionado - SEMPRE mostrar o mês inteiro
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);

  // Garantir que não ultrapasse a data atual se estiver no mês atual
  const adjustedMonthEnd = isBefore(monthEnd, today) ? monthEnd : today;

  const {
    data: historicalData,
    isLoading
  } = useQuery({
    queryKey: ['/api/history/mini', currencyCode, monthStart.toISOString().split('T')[0], adjustedMonthEnd.toISOString().split('T')[0]],
    queryFn: async () => {
      const monthStartStr = monthStart.toISOString().split('T')[0];
      const monthEndStr = adjustedMonthEnd.toISOString().split('T')[0];

      const data = await api.history.getForCurrency(currencyCode, monthStartStr, monthEndStr);
      return data.map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp)
      }));
    },
    refetchOnWindowFocus: false,
  });



  // Aplicar trava de 1 ano na navegação
  const isPreviousDisabled = isBefore(selectedMonth, minDate) || 
                            (getMonth(selectedMonth) === getMonth(minDate) && getYear(selectedMonth) === getYear(minDate));
  const isNextDisabled = isSameDay(monthEnd, endOfMonth(today)) || isBefore(today, monthStart);

  const goToPreviousMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    // Só permitir voltar se não ultrapassar 1 ano
    if (!isPreviousDisabled) {
      setSelectedMonth(newDate);
    }
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    if (!isNextDisabled) {
      setSelectedMonth(newDate);
    }
  };

  const getLocale = () => {
    const localeMap: Record<string, any> = {
      pt: () => import('date-fns/locale/pt-BR'),
      en: () => import('date-fns/locale/en-US'),
      es: () => import('date-fns/locale/es'),
      fr: () => import('date-fns/locale/fr')
    };
    return localeMap[i18n.language.split('-')[0]]?.() || import('date-fns/locale/pt-BR');
  };

  const [locale, setLocale] = useState<any>(null);

  useEffect(() => {
    getLocale().then((mod: any) => setLocale(mod.default));
  }, [i18n.language]);

  const capitalizedMonthName = locale ? format(selectedMonth, 'MMMM yyyy', { locale }) : format(selectedMonth, 'MMMM yyyy', { locale: ptBR });

  // SEMPRE criar pontos para o mês COMPLETO - não limitar pelo adjustedMonthEnd
  const fullMonthEnd = endOfMonth(selectedMonth);
  const daysInFullMonth = getDate(fullMonthEnd);
  const daysInMonth = Array.from({ length: daysInFullMonth }, (_, i) => i + 1);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // Debug - verificar dados recebidos
  console.log('🔍 CurrencyMiniChart Debug:');
  console.log('Currency:', currencyCode);
  console.log('Selected Month:', selectedMonth);
  console.log('Historical Data:', historicalData);
  console.log('Historical Data length:', historicalData?.length);

  if (historicalData && historicalData.length > 0) {
    const dates = historicalData.map((d: any) => ({
      raw: d.timestamp,
      parsed: new Date(d.timestamp),
      day: new Date(d.timestamp).getDate(),
      month: new Date(d.timestamp).getMonth(),
      year: new Date(d.timestamp).getFullYear(),
      sellPrice: d.sell_price
    }));
    console.log('Dates in history:', dates);
  }

  // Mapear dados históricos para cada dia do mês
  const allChartData = daysInMonth.map(day => {
    // Formatar o dia no formato "dd/MM"
    const dayDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    const formattedDay = format(dayDate, 'dd/MM');

    // Se a data for no futuro (depois de hoje), não incluir dados
    if (dayDate > today) {
      return {
        date: formattedDay,
        day: day.toString(),
        sellPrice: null,
        buyPrice: null,
        hasRealData: false
      };
    }

    // Se for o dia atual, usar preço mais recente disponível
    if (isSameDay(dayDate, today)) {
      // Priorizar: currentPrice > currentCurrencyData > dados históricos
      const todaysSellPrice = currentPrice || currentCurrencyData?.sellPrice;
      const todaysBuyPrice = currentCurrencyData?.buyPrice;
      
      if (todaysSellPrice) {
        return {
          date: formattedDay,
          day: day.toString(),
          sellPrice: todaysSellPrice,
          buyPrice: todaysBuyPrice,
          hasRealData: true
        };
      }
    }

    // Procurar se há dados históricos para este dia
    const historyEntry = historicalData?.find((entry: CurrencyHistory) => {
      return isSameDay(entry.timestamp, dayDate);
    });

    return {
      date: formattedDay,
      day: day.toString(),
      sellPrice: historyEntry?.sellPrice ?? null,
      buyPrice: historyEntry?.buyPrice ?? null,
      hasRealData: !!historyEntry
    };
  });

  // Usar todos os dados no gráfico
  const chartData = allChartData;

  // Debug - verificar dados finais do gráfico
  console.log('🔍 Chart Data Final:');
  console.log('Chart Data length:', chartData.length);
  console.log('Chart Data with valid prices:', chartData.filter(d => d.sellPrice !== null));

  // Para mobile portrait: filtrar ticks para mostrar apenas ímpares + último dia
  const getCustomTicks = () => {
    if (isMobilePortrait && chartType === 'month') {
      const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
      
      return allChartData.filter(item => {
        const day = parseInt(item.day);
        const isOddDay = day % 2 === 1;
        const isLastDay = day === daysInMonth;
        
        // Mostrar todos os ímpares + último dia (mesmo se par)
        return isOddDay || isLastDay;
      }).map(item => item.day);
    }
    return undefined;
  };

  if (isLoading) {
    return (
      <div className="w-full h-[180px] flex items-center justify-center bg-gray-100 rounded animate-pulse">
        <div className="text-center">
          <p className="text-gray-500 text-sm">{t('chart.loadingData')}</p>
        </div>
      </div>
    );
  }

  // Verificar se temos dados válidos para mostrar no gráfico
  const hasValidData = chartData.some(item => item.sellPrice !== null);
  const isCurrentMonth = isSameDay(selectedMonth, startOfMonth(today));

  if (!hasValidData && !isCurrentMonth) {
    return (
      <div className="w-full h-[180px] flex flex-col items-center justify-center bg-gray-100 rounded">
        <div className="flex items-center justify-center mb-2">
          <button 
            onClick={goToPreviousMonth}
            disabled={isPreviousDisabled}
            className={`p-1 rounded ${isPreviousDisabled ? 'text-gray-400' : 'text-[#1a1a1a] hover:bg-gray-200'}`}
          >
            <ChevronLeft size={16} />
          </button>
          <h4 className="text-sm font-medium mx-2 capitalize">{capitalizedMonthName}</h4>
          <button 
            onClick={goToNextMonth}
            disabled={isNextDisabled}
            className={`p-1 rounded ${isNextDisabled ? 'text-gray-400' : 'text-[#1a1a1a] hover:bg-gray-200'}`}
          >
            <ChevronRight size={16} />
          </button>
        </div>
        <p className="text-gray-500 text-sm">{t('chart.noDataForMonth', { month: capitalizedMonthName })}</p>
      </div>
    );
  }

  // Determinar qual dados usar baseado no tipo de gráfico
  const activeChartData = chartType === 'day' ? intradayChartData : chartData;
  const activeIsLoading = chartType === 'day' ? isIntradayLoading : isLoading;
  
  // Determinar se deve mostrar o gráfico
  const shouldShowChart = chartType === 'day'
    ? shouldShowIntradayChart
    : activeChartData.length > 0;

  // Calculando valores para definir domínio do eixo Y
  const validPrices = activeChartData
    .map(d => d.sellPrice)
    .filter((price): price is number => price !== null);

  const minPrice = validPrices.length > 0 ? Math.min(...validPrices) : 0;
  const maxPrice = validPrices.length > 0 ? Math.max(...validPrices) : 0;
  const priceRange = maxPrice - minPrice;
  const isConstantPrice = priceRange === 0;
  const validDataCount = validPrices.length;
  
  // Cálculo da margem conforme especificação
  const padding = isConstantPrice 
    ? Math.max(minPrice * 0.001, 0.001) 
    : priceRange * 0.1;



  return (
    <div className="w-full h-[220px] sm:h-[180px]">
      {/* Layout para Desktop e Mobile Landscape */}
      <div className="hidden sm:flex md:flex items-center justify-between mb-4">
        <h4 className="text-sm font-medium text-gray-700 -translate-y-0.5">{t('chart.movement')}</h4>
        
        {/* Navegação do mês no centro (apenas para modo mensal) */}
        {chartType === 'month' && (
          <div className="flex items-center">
            <button 
              onClick={goToPreviousMonth}
              disabled={isPreviousDisabled}
              className={`p-1 rounded ${isPreviousDisabled ? 'text-gray-400' : 'text-[#1a1a1a] hover:bg-gray-200'}`}
            >
              <ChevronLeft size={16} />
            </button>
            <h4 className="text-sm font-medium mx-3 capitalize min-w-[80px] text-center">{capitalizedMonthName}</h4>
            <button 
              onClick={goToNextMonth}
              disabled={isNextDisabled}
              className={`p-1 rounded ${isNextDisabled ? 'text-gray-400' : 'text-[#1a1a1a] hover:bg-gray-200'}`}
            >
              <ChevronRight size={16} />
            </button>
          </div>
        )}

        {/* Título do dia atual no centro (apenas para modo intraday) */}
        {chartType === 'day' && (
          <div className="flex items-center">
            <h4 className="text-sm font-medium min-w-[120px] text-center">
              {locale ? format(today, "dd MMMM", { locale }) : format(today, "dd MMMM", { locale: ptBR })}
            </h4>
          </div>
        )}
        
        <div className="flex bg-gray-200 p-1 rounded-lg">
          <button
            onClick={() => setChartType('month')}
            className={`px-3 py-1 text-sm rounded-md transition-all duration-300 ${
              chartType === 'month'
                ? 'bg-[#f3b234] text-[#1a1a1a] shadow-sm'
                : 'text-gray-600 hover:text-[#1a1a1a]'
            }`}
          >
            {t('chart.month')}
          </button>
          <button
            onClick={() => setChartType('day')}
            className={`px-3 py-1 text-sm rounded-md transition-all duration-300 ${
              chartType === 'day'
                ? 'bg-[#f3b234] text-[#1a1a1a] shadow-sm'
                : 'text-gray-600 hover:text-[#1a1a1a]'
            }`}
          >
            {t('chart.day')}
          </button>
        </div>
      </div>

      {/* Layout para Mobile Portrait */}
      <div className="block sm:hidden">
        {/* Primeira linha: Título "Movimentação" e Toggle */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700 -translate-y-0.5">{t('chart.movement')}</h4>
          
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setChartType('month')}
              className={`px-3 py-1 text-sm rounded-md transition-all duration-300 ${
                chartType === 'month'
                  ? 'bg-[#f3b234] text-[#1a1a1a] shadow-sm'
                  : 'text-gray-600 hover:text-[#1a1a1a]'
              }`}
            >
              {t('chart.month')}
            </button>
            <button
              onClick={() => setChartType('day')}
              className={`px-3 py-1 text-sm rounded-md transition-all duration-300 ${
                chartType === 'day'
                  ? 'bg-[#f3b234] text-[#1a1a1a] shadow-sm'
                  : 'text-gray-600 hover:text-[#1a1a1a]'
              }`}
            >
              {t('chart.day')}
            </button>
          </div>
        </div>

        {/* Segunda linha: Navegação/Data centralizada */}
        <div className="flex justify-center mb-4">
          {/* Navegação do mês (apenas para modo mensal) */}
          {chartType === 'month' && (
            <div className="flex items-center">
              <button 
                onClick={goToPreviousMonth}
                disabled={isPreviousDisabled}
                className={`p-1 rounded ${isPreviousDisabled ? 'text-gray-400' : 'text-[#1a1a1a] hover:bg-gray-200'}`}
              >
                <ChevronLeft size={16} />
              </button>
              <h4 className="text-sm font-medium mx-3 capitalize min-w-[80px] text-center">{capitalizedMonthName}</h4>
              <button 
                onClick={goToNextMonth}
                disabled={isNextDisabled}
                className={`p-1 rounded ${isNextDisabled ? 'text-gray-400' : 'text-[#1a1a1a] hover:bg-gray-200'}`}
              >
                <ChevronRight size={16} />
              </button>
            </div>
          )}

          {/* Título do dia atual (apenas para modo intraday) */}
          {chartType === 'day' && (
            <div className="flex items-center">
              <h4 className="text-sm font-medium min-w-[120px] text-center">
                {locale ? format(today, "dd MMMM", { locale }) : format(today, "dd MMMM", { locale: ptBR })}
              </h4>
            </div>
          )}
        </div>
      </div>

      {activeIsLoading ? (
        <div className="w-full h-[200px] flex items-center justify-center bg-gray-100 rounded animate-pulse">
          <p className="text-gray-500 text-sm">{t('chart.loadingData')}</p>
        </div>
      ) : !shouldShowChart ? (
        <div className="w-full h-[200px] flex items-center justify-center bg-gray-100 rounded">
          <p className="text-gray-500 text-sm">
            {chartType === 'day' 
              ? (!shouldShowIntradayChart 
                  ? t('chart.waitingPriceVariations')
                  : t('chart.noVariationsInPeriod')
                ) 
              : t('chart.noDataForMonth', { month: capitalizedMonthName })
            }
          </p>
        </div>
      ) : (
        <ResponsiveContainer 
          width="100%" 
          height={200}
          style={isMobilePortrait && chartType === 'month' ? { paddingRight: '6px' } : {}}
        >
          <AreaChart data={activeChartData} margin={isMobile ? { top: 10, right: 5, left: 5, bottom: 25 } : { top: 10, right: 15, left: 15, bottom: 25 }}>
            <defs>
              <linearGradient id="colorSell" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f3b234" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f3b234" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey={chartType === 'day' ? 'hour' : 'day'}
              tick={(props) => {
                if (isMobilePortrait && chartType === 'month') {
                  const daysInMonth = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1, 0).getDate();
                  const currentDay = parseInt(props.payload.value);
                  const isLastDay = currentDay === daysInMonth;
                  const isLastDayEven = daysInMonth % 2 === 0;
                  
                  // Criar espaçamento especial entre penúltimo e último quando último é par
                  let dx = 0;
                  if (isLastDayEven && isLastDay) {
                    dx = 1; // Move último ligeiramente para direita
                  }
                  
                  return (
                    <text
                      x={props.x}
                      y={props.y}
                      fill="#666"
                      fontSize="8"
                      textAnchor="middle"
                      dx={dx}
                    >
                      {props.payload.value}
                    </text>
                  );
                }
                return (
                  <text
                    x={props.x}
                    y={props.y}
                    fill="#666"
                    fontSize="8"
                    textAnchor="middle"
                  >
                    {props.payload.value}
                  </text>
                );
              }}
              tickLine={false}
              axisLine={false}
              interval={isMobileLandscape && chartType === 'month' ? 1 : 0}
              ticks={getCustomTicks()}
              type="category"
              scale="point"
              tickMargin={chartType === 'day' ? 5 : (isMobilePortrait ? 4 : 2)}
              height={isMobilePortrait ? 30 : 25}
            />
            <YAxis 
              hide={true}
              domain={validPrices.length > 0 ? [minPrice - padding, maxPrice + padding] : [0, 1]}
            />
            <Tooltip
              content={({ active, payload, label }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  const sellPrice = data.sellPrice;
                  const buyPrice = data.buyPrice;
                  const hasRealData = data.hasRealData;
                  return (
                    <div style={{
                      backgroundColor: '#fff',
                      border: '1px solid #ddd',
                      borderRadius: '4px',
                      padding: '6px',
                      fontSize: '12px'
                    }}>
                      <p style={{ margin: '0 0 3px 0', fontWeight: 'bold' }}>
                        {chartType === 'month' ? `${t('chart.dayLabel')} ${label}` : `${label}${t('chart.hourLabel')}`}
                      </p>
                      <p style={{ margin: '0 0 2px 0', color: '#000' }}>
                        {t('chart.sellLabel')} R$ {sellPrice ? sellPrice.toFixed(4) : 'N/A'}
                      </p>
                      {buyPrice && (
                        <p style={{ margin: '0', color: '#000' }}>
                          {t('chart.buyLabel')} R$ {buyPrice.toFixed(4)}
                        </p>
                      )}
                    </div>
                  );
                }
                return null;
              }}
            />
            <Area
              type="monotone"
              dataKey="sellPrice"
              stroke="#f3b234"
              fillOpacity={1}
              fill="url(#colorSell)"
              strokeWidth={2}
              connectNulls={false}
              dot={chartType === 'day' ? 
                (validDataCount === 1 || isConstantPrice ? { fill: '#f3b234', strokeWidth: 1, r: 2 } : false) :
                { fill: '#f3b234', strokeWidth: 1, r: 2 }
              }
            />
          </AreaChart>
        </ResponsiveContainer>
      )}
      
      {/* Label embaixo do gráfico */}
      {(shouldShowChart || activeIsLoading) && (
        <div className="text-center -mt-6">
          <p className="text-xs text-gray-500 font-medium">
            {chartType === 'month' ? t('chart.daysLabel') : t('chart.hoursLabel')}
          </p>
        </div>
      )}
    </div>
  );
}