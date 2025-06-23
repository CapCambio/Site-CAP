import { useState, useEffect } from 'react';
import { format, getDate, startOfMonth, endOfMonth, isBefore, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CurrencyHistory } from '../lib/types';
import { useQuery } from '@tanstack/react-query';
import { ptBR } from 'date-fns/locale';
import { useIsMobile } from '../hooks/use-mobile';

interface CurrencyMiniChartProps {
  currencyCode: string;
  currentPrice?: number;
  selectedDate?: Date;
}

export function CurrencyMiniChart({ currencyCode, currentPrice, selectedDate }: CurrencyMiniChartProps) {
  const today = new Date();
  const isMobile = useIsMobile();
  // Usar selectedDate se fornecida, senão usar hoje - mas sempre começar com o mês atual
  const initialMonth = selectedDate ? startOfMonth(selectedDate) : startOfMonth(today);
  const [selectedMonth, setSelectedMonth] = useState(initialMonth);

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

  // Mapear dados históricos para cada dia do mês
  const chartData = daysInMonth.map(day => {
    // Formatar o dia no formato "dd/MM"
    const dayDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    const formattedDay = format(dayDate, 'dd/MM');

    // Se a data for no futuro (depois de hoje), não incluir dados
    if (dayDate > today) {
      return {
        date: formattedDay,
        day: day.toString(),
        sellPrice: null
      };
    }

    // Se for o dia atual e tivermos o preço atual, use-o
    if (isSameDay(dayDate, today) && currentPrice) {
      return {
        date: formattedDay,
        day: day.toString(),
        sellPrice: currentPrice
      };
    }

    // Procurar se há dados históricos para este dia
    const historyEntry = historicalData?.find((entry: CurrencyHistory) => 
      isSameDay(entry.timestamp, dayDate)
    );

    return {
      date: formattedDay,
      day: day.toString(),
      sellPrice: historyEntry?.sellPrice || null
    };
  });

  if (isLoading) {
    return (
      <div className="w-full h-[180px] flex items-center justify-center bg-gray-100 rounded animate-pulse">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Carregando dados...</p>
        </div>
      </div>
    );
  }

  if (!historicalData || historicalData.length === 0) {
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

  // Calculando valores para definir domínio do eixo Y
  const validPrices = chartData
    .map(d => d.sellPrice)
    .filter((price): price is number => price !== null);

  const minPrice = Math.min(...validPrices);
  const maxPrice = Math.max(...validPrices);
  const padding = (maxPrice - minPrice) * 0.1;

  return (
    <div className="w-full h-[180px]">
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

      <ResponsiveContainer width="100%" height={140}>
        <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 20 }}>
          <defs>
            <linearGradient id="colorSell" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f3b234" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#f3b234" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="day"
            tick={{ fontSize: 8, fill: '#666' }}
            tickLine={false}
            axisLine={false}
            interval={0}
            type="category"
            scale="point"
            tickMargin={5}
            height={25}
            tickFormatter={(value) => {
              // Desktop: SEMPRE mostrar todos os dias
              if (!isMobile) {
                return value;
              }

              // Mobile: mostrar apenas dias ímpares + último dia do mês
              const day = parseInt(value);
              const isLastDay = day === daysInFullMonth;
              const isOddDay = day % 2 === 1;

              if (isOddDay || isLastDay) {
                return value;
              }
              return '';
            }}
          />
          <YAxis 
            hide={true}
            domain={[minPrice - padding, maxPrice + padding]}
          />
          <Tooltip
            formatter={(value: any) => [
              `R$ ${Number(value).toFixed(4)}`,
              "Venda"
            ]}
            labelFormatter={(label) => `Dia ${label}`}
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '12px'
            }}
          />
          <Area
            type="monotone"
            dataKey="sellPrice"
            stroke="#f3b234"
            fillOpacity={1}
            fill="url(#colorSell)"
            strokeWidth={2}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}