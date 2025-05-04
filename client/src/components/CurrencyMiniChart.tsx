import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";
import { useQuery } from '@tanstack/react-query';
import { CurrencyHistory } from "../lib/types";
import { formatDate } from "../lib/currency";
import { format } from 'date-fns';

interface CurrencyMiniChartProps {
  currencyCode: string;
}

export function CurrencyMiniChart({ currencyCode }: CurrencyMiniChartProps) {
  // Busca dados dos últimos 30 dias
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - 30);
  
  const startDateStr = startDate.toISOString().split('T')[0];
  const endDateStr = new Date().toISOString().split('T')[0];

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

  // Preparando dados para o gráfico
  const chartData = historicalData ? historicalData
    .sort((a: CurrencyHistory, b: CurrencyHistory) => a.timestamp.getTime() - b.timestamp.getTime())
    .map((entry: CurrencyHistory) => ({
      date: format(new Date(entry.timestamp), 'dd/MM'),
      buyPrice: entry.buyPrice,
    })) : [];

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
      <div className="w-full h-[180px] flex items-center justify-center bg-gray-100 rounded">
        <div className="text-center">
          <p className="text-gray-500 text-sm">Sem dados históricos disponíveis</p>
        </div>
      </div>
    );
  }

  // Calculando valores mínimos e máximos para definir domínio do eixo Y
  const prices = historicalData.map((d: CurrencyHistory) => d.buyPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  
  // Adicionando uma margem de 2% acima e abaixo
  const yDomainMin = minPrice * 0.98;
  const yDomainMax = maxPrice * 1.02;

  return (
    <div className="w-full h-[180px] mt-3">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
          <XAxis 
            dataKey="date" 
            tick={{ fontSize: 10 }}
            tickCount={5}
            tickFormatter={(value) => {
              const parts = value.split('/');
              return parts[0]; // Mostrar apenas o dia
            }}
          />
          <YAxis 
            tick={{ fontSize: 10 }}
            domain={[yDomainMin, yDomainMax]}
            tickCount={4}
            tickFormatter={(value) => value.toFixed(2)}
            width={35}
          />
          <Tooltip 
            formatter={(value: number) => [`R$ ${value.toFixed(5)}`, 'Compra']}
            labelFormatter={(label) => `Data: ${label}`}
            contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', fontSize: '12px' }}
          />
          <Line 
            type="monotone" 
            dataKey="buyPrice" 
            name="Compra" 
            stroke="#f3b234" 
            dot={false}
            activeDot={{ r: 5 }} 
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}