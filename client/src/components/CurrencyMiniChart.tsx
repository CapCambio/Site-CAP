
import { useState } from 'react';
import { format, getDate, startOfMonth, endOfMonth, isBefore, isSameDay } from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { CurrencyHistory } from '../lib/types';
import { useQuery } from '@tanstack/react-query';
import { ptBR } from 'date-fns/locale';

interface CurrencyMiniChartProps {
  currencyCode: string;
  initialMonth?: Date;
  currentPrice?: number;
}

export function CurrencyMiniChart({ currencyCode, initialMonth, currentPrice }: CurrencyMiniChartProps) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<Date>(initialMonth || new Date());
  
  // Calcular o limite de 12 meses para trás
  const minDate = new Date();
  minDate.setMonth(minDate.getMonth() - 12);
  
  // Determinar o início e fim do mês selecionado
  const monthStart = startOfMonth(selectedMonth);
  const monthEnd = endOfMonth(selectedMonth);
  
  // Garantir que não ultrapasse a data atual se estiver no mês atual
  const adjustedMonthEnd = isBefore(monthEnd, today) ? monthEnd : today;
  
  // Converter para string para a API
  const startDateStr = monthStart.toISOString().split('T')[0];
  const endDateStr = adjustedMonthEnd.toISOString().split('T')[0];

  const { 
    data: historicalData, 
    isLoading
  } = useQuery({
    queryKey: ['/api/history/mini', currencyCode, startDateStr, endDateStr],
    queryFn: async () => {
      const response = await fetch(
        `/api/history/${currencyCode}?startDate=${startDateStr}&endDate=${endDateStr}`
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

  const isPreviousDisabled = isBefore(minDate, monthStart);
  const isNextDisabled = isSameDay(monthEnd, endOfMonth(today)) || isBefore(today, monthStart);
  
  const goToPreviousMonth = () => {
    const newDate = new Date(selectedMonth);
    newDate.setMonth(newDate.getMonth() - 1);
    if (!isBefore(newDate, minDate)) {
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
  
  const capitalizedMonthName = format(selectedMonth, 'MMMM', { locale: ptBR });

  // Criar pontos no gráfico para todos os dias do mês até hoje
  const daysInMonth = Array.from({ length: getDate(adjustedMonthEnd) }, (_, i) => i + 1);
  
  // Mapear dados históricos para cada dia do mês
  const chartData = daysInMonth.map(day => {
    // Formatar o dia no formato "dd/MM"
    const dayDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    const formattedDay = format(dayDate, 'dd/MM');
    
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
      getDate(entry.timestamp) === day
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
        <p className="text-gray-500 text-sm">Sem dados disponíveis para este mês</p>
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
        <AreaChart data={chartData} margin={{ top: 5, right: 0, left: 0, bottom: 5 }}>
          <defs>
            <linearGradient id="colorSell" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f3b234" stopOpacity={0.1}/>
              <stop offset="95%" stopColor="#f3b234" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="day"
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
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
