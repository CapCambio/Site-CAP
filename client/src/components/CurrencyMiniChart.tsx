import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useQuery } from '@tanstack/react-query';
import { CurrencyHistory } from "../lib/types";
import { format, addMonths, subMonths, startOfMonth, endOfMonth, getMonth, getYear, isBefore, isAfter, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface CurrencyMiniChartProps {
  currencyCode: string;
}

export function CurrencyMiniChart({ currencyCode }: CurrencyMiniChartProps) {
  const today = new Date();
  const [selectedMonth, setSelectedMonth] = useState<Date>(new Date());
  
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

  // Função para ir para o mês anterior
  const goToPreviousMonth = () => {
    const newMonth = subMonths(selectedMonth, 1);
    if (isAfter(newMonth, minDate) || getMonth(newMonth) === getMonth(minDate)) {
      setSelectedMonth(newMonth);
    }
  };

  // Função para ir para o próximo mês
  const goToNextMonth = () => {
    const newMonth = addMonths(selectedMonth, 1);
    if (isBefore(newMonth, today) || 
        (getMonth(newMonth) === getMonth(today) && getYear(newMonth) === getYear(today))) {
      setSelectedMonth(newMonth);
    }
  };

  // Verificar se os botões de navegação devem ser desativados
  const isPreviousDisabled = getMonth(selectedMonth) === getMonth(minDate) && 
                           getYear(selectedMonth) === getYear(minDate);
  
  const isNextDisabled = getMonth(selectedMonth) === getMonth(today) && 
                       getYear(selectedMonth) === getYear(today);

  // Formatando o nome do mês
  const monthName = format(selectedMonth, 'MMMM yyyy', { locale: ptBR });
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Criar pontos no gráfico para todos os dias do mês até hoje
  const daysInMonth = Array.from({ length: getDate(adjustedMonthEnd) }, (_, i) => i + 1);
  
  // Mapear dados históricos para cada dia do mês
  const chartData = daysInMonth.map(day => {
    // Formatar o dia no formato "dd/MM"
    const dayDate = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), day);
    const formattedDay = format(dayDate, 'dd/MM');
    
    // Procurar se há dados históricos para este dia
    const historyEntry = historicalData?.find((entry: CurrencyHistory) => 
      getDate(entry.timestamp) === day
    );
    
    return {
      date: formattedDay,
      day: day.toString(), // Para mostrar apenas o dia no eixo X
      buyPrice: historyEntry?.buyPrice || null
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

  // Calculando valores mínimos e máximos para definir domínio do eixo Y
  // Filtrando valores nulos antes de calcular
  const validPrices = historicalData.map((d: CurrencyHistory) => d.buyPrice).filter((price: number) => price !== null && price !== undefined);
  
  let minPrice = 0;
  let maxPrice = 0;
  
  if (validPrices.length > 0) {
    minPrice = Math.min(...validPrices);
    maxPrice = Math.max(...validPrices);
  }
  
  // Adicionando uma margem de 2% acima e abaixo
  const yDomainMin = minPrice * 0.98;
  const yDomainMax = maxPrice * 1.02;

  return (
    <div className="w-full h-[200px] mt-3">
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
      
      <ResponsiveContainer width="100%" height={150}>
        <LineChart data={chartData} margin={{ top: 10, right: 5, left: 0, bottom: 10 }}>
          <XAxis 
            dataKey="day" 
            tick={{ fontSize: 10 }}
            tickFormatter={(value) => value}
            interval="preserveStartEnd"
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            domain={[yDomainMin, yDomainMax]}
            tickCount={4}
            tickFormatter={(value) => value.toFixed(2)}
            width={35}
          />
          <Tooltip 
            formatter={(value: any) => value !== null ? [`R$ ${Number(value).toFixed(5)}`, 'Compra'] : ['Sem dados', 'Compra']}
            labelFormatter={(label) => `Dia: ${label}`}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', fontSize: '12px' }}
          />
          <Line 
            type="monotone" 
            dataKey="buyPrice" 
            name="Compra" 
            stroke="#f3b234" 
            strokeWidth={2}
            dot={{ r: 2 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}