import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoryFilter } from "../lib/types";
import { currencyDetails, formatDate } from "../lib/currency";

interface HistoryChartProps {
  data: Array<{ date: string; compra: number; venda: number }>;
  filter: HistoryFilter;
  isLoading: boolean;
}

export function HistoryChart({ data, filter, isLoading }: HistoryChartProps) {
  const currencyName = currencyDetails[filter.code]?.name || filter.code;
  
  const title = useMemo(() => {
    const dateRange = `${formatDate(filter.startDate)} a ${formatDate(filter.endDate)}`;
    return `${currencyName} (${filter.code}) - ${dateRange}`;
  }, [currencyName, filter]);

  if (isLoading) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-[#1a1a1a]">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full flex items-center justify-center bg-gray-100 rounded">
            <div className="text-center">
              <div className="w-12 h-12 border-4 border-[#f3b234] border-t-transparent rounded-full animate-spin mb-3 mx-auto"></div>
              <p className="text-gray-500">Carregando dados...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg text-[#1a1a1a]">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 w-full flex items-center justify-center bg-gray-100 rounded">
            <div className="text-center">
              <p className="text-gray-500">Nenhum dado disponível para o período selecionado</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg text-[#1a1a1a]">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 5, left: 5, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => {
                  // Format date for better display on small screens
                  const parts = value.split('/');
                  return `${parts[0]}/${parts[1]}`;
                }}
                label={{ value: "Data", position: "insideBottom", offset: -15, fill: "#000000", fontSize: 12 }}
              />
              <YAxis 
                tick={false}
                domain={['auto', 'auto']}
                width={30}
                label={{ value: "Cotação", angle: -90, position: "insideLeft", style: { textAnchor: 'middle', fill: '#666', fontSize: 12 } }}
              />
              <Tooltip 
                formatter={(value: number) => [`R$ ${value.toFixed(5).replace(/\.?0+$/, '')}`, '']}
                labelFormatter={(label) => `Data: ${label}`}
                contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="venda" 
                name="Venda" 
                stroke="#f3b234" 
                activeDot={{ r: 8 }} 
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="compra" 
                name="Compra" 
                stroke="#1a1a1a" 
                activeDot={{ r: 8 }} 
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}