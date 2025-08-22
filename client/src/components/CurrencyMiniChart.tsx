import { useState, useEffect } from 'react';
import { format, getDate, startOfMonth, endOfMonth, isBefore, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CurrencyHistory } from '../lib/types';
import { useQuery } from '@tanstack/react-query';
import { ptBR } from 'date-fns/locale';
import { useIntradayChart } from '../hooks/useIntradayChart';

interface CurrencyMiniChartProps {
  currencyCode: string;
  currentPrice?: number;
  selectedDate?: Date;
}

export function CurrencyMiniChart({ currencyCode, currentPrice, selectedDate }: CurrencyMiniChartProps) {
  const today = new Date();
  // Usar selectedDate se fornecida, senão usar hoje - mas sempre começar com o mês atual
  const initialMonth = selectedDate ? startOfMonth(selectedDate) : startOfMonth(today);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);
  const [chartType, setChartType] = useState<'month' | 'day'>('month');
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
      const response = await fetch('/api/currencies');
      if (!response.ok) {
        throw new Error('Failed to fetch current currencies');
      }
      const currencies = await response.json();
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
    queryKey: ['/api/history/mini', currencyCode, monthStart.toISOString().split('T')[0], monthEnd.toISOString().split('T')[0]],
    queryFn: async () => {
      const monthStartStr = monthStart.toISOString().split('T')[0];
      const monthEndStr = monthEnd.toISOString().split('T')[0];

      const response = await fetch(
        `/api/history/${currencyCode}?startDate=${monthStartStr}&endDate=${monthEndStr}`
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
  });



  // Remover limitação de navegação - permitir navegar mesmo sem dados
  const isPreviousDisabled = false; // Permitir sempre voltar
  const isNextDisabled = isSameDay(monthEnd, endOfMonth(today)) || isBefore(today, monthStart);

  const goToPreviousMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    // Sempre permitir voltar, mesmo sem dados
    setSelectedMonth(newDate);
  };

  const goToNextMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() + 1);
    if (!isNextDisabled) {
      setSelectedMonth(newDate);
    }
  };

  const capitalizedMonthName = format(selectedMonth, 'MMMM yyyy', { locale: ptBR });

  // SEMPRE criar pontos para o mês COMPLETO - não limitar pelo adjustedMonthEnd
  const fullMonthEnd = endOfMonth(selectedMonth);
  const daysInFullMonth = getDate(fullMonthEnd);
  const daysInMonth = Array.from({ length: daysInFullMonth }, (_, i) => i + 1);
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

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
    const historyEntry = historicalData?.find((entry: CurrencyHistory) => 
      isSameDay(entry.timestamp, dayDate)
    );

    return {
      date: formattedDay,
      day: day.toString(),
      sellPrice: historyEntry?.sellPrice || null,
      buyPrice: historyEntry?.buyPrice || null,
      hasRealData: !!historyEntry
    };
  });

  // Usar todos os dados no gráfico
  const chartData = allChartData;

  if (isLoading) {
    return (
      <div className="w-full h-[180px] flex items-center justify-center bg-gray-100 rounded animate-pulse">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Carregando dados...</p>
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
        <p className="text-gray-500 text-sm">Sem dados disponíveis para {capitalizedMonthName}</p>
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
        <h4 className="text-sm font-medium text-gray-700 -translate-y-0.5">Movimentação</h4>
        
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
              {format(today, "dd 'de' MMMM", { locale: ptBR })}
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
            Mês
          </button>
          <button
            onClick={() => setChartType('day')}
            className={`px-3 py-1 text-sm rounded-md transition-all duration-300 ${
              chartType === 'day'
                ? 'bg-[#f3b234] text-[#1a1a1a] shadow-sm'
                : 'text-gray-600 hover:text-[#1a1a1a]'
            }`}
          >
            Dia
          </button>
        </div>
      </div>

      {/* Layout para Mobile Portrait */}
      <div className="block sm:hidden">
        {/* Primeira linha: Título "Movimentação" e Toggle */}
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-700 -translate-y-0.5">Movimentação</h4>
          
          <div className="flex bg-gray-200 p-1 rounded-lg">
            <button
              onClick={() => setChartType('month')}
              className={`px-3 py-1 text-sm rounded-md transition-all duration-300 ${
                chartType === 'month'
                  ? 'bg-[#f3b234] text-[#1a1a1a] shadow-sm'
                  : 'text-gray-600 hover:text-[#1a1a1a]'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setChartType('day')}
              className={`px-3 py-1 text-sm rounded-md transition-all duration-300 ${
                chartType === 'day'
                  ? 'bg-[#f3b234] text-[#1a1a1a] shadow-sm'
                  : 'text-gray-600 hover:text-[#1a1a1a]'
              }`}
            >
              Dia
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
                {format(today, "dd 'de' MMMM", { locale: ptBR })}
              </h4>
            </div>
          )}
        </div>
      </div>

      {activeIsLoading ? (
        <div className="w-full h-[200px] flex items-center justify-center bg-gray-100 rounded animate-pulse">
          <p className="text-gray-500 text-sm">Carregando dados...</p>
        </div>
      ) : !shouldShowChart ? (
        <div className="w-full h-[200px] flex items-center justify-center bg-gray-100 rounded">
          <p className="text-gray-500 text-sm">
            {chartType === 'day' 
              ? (!shouldShowIntradayChart 
                  ? 'Aguardando variações de preço no dia' 
                  : 'Sem variações no período'
                ) 
              : `Sem dados disponíveis para ${capitalizedMonthName}`
            }
          </p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={activeChartData} margin={isMobile ? { top: 10, right: 5, left: 5, bottom: 25 } : { top: 10, right: 15, left: 15, bottom: 25 }}>
            <defs>
              <linearGradient id="colorSell" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f3b234" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#f3b234" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis 
              dataKey={chartType === 'day' ? 'hour' : 'day'}
              tick={{ fontSize: 8, fill: '#666' }}
              tickLine={false}
              axisLine={false}
              interval={(isMobileLandscape || isMobilePortrait) && chartType === 'month' ? 1 : 0}
              type="category"
              scale="point"
              tickMargin={chartType === 'day' ? 5 : 2}
              height={25}
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
                        {chartType === 'month' ? `Dia ${label}` : `${label}h`}
                      </p>
                      <p style={{ margin: '0 0 2px 0', color: '#000' }}>
                        Venda: R$ {sellPrice ? sellPrice.toFixed(4) : 'N/A'}
                      </p>
                      {buyPrice && (
                        <p style={{ margin: '0', color: '#000' }}>
                          Compra: R$ {buyPrice.toFixed(4)}
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
            {chartType === 'month' ? 'Dias' : 'Horas'}
          </p>
        </div>
      )}
    </div>
  );
}