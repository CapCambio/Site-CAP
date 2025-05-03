import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HistoryFilter } from "../lib/types";
import { currencyDetails } from "../lib/currency";

interface HistorySelectionProps {
  filter: HistoryFilter;
  onFilterChange: (filter: Partial<HistoryFilter>) => void;
  onSubmit: () => void;
}

export function HistorySelection({ filter, onFilterChange, onSubmit }: HistorySelectionProps) {
  const [startDateStr, setStartDateStr] = useState<string>(
    filter.startDate.toISOString().split("T")[0]
  );
  
  const [endDateStr, setEndDateStr] = useState<string>(
    filter.endDate.toISOString().split("T")[0]
  );

  // Update parent component when date inputs change
  useEffect(() => {
    if (startDateStr) {
      onFilterChange({ startDate: new Date(startDateStr) });
    }
    
    if (endDateStr) {
      onFilterChange({ endDate: new Date(endDateStr) });
    }
  }, [startDateStr, endDateStr, onFilterChange]);

  const handleCurrencyChange = (newCode: string) => {
    onFilterChange({ code: newCode });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl text-[#1a1a1a]">Histórico de Cotações</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">Moeda</Label>
            <Select
              value={filter.code}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma moeda" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(currencyDetails).map(([code, { name }]) => (
                  <SelectItem key={code} value={code}>
                    {name} ({code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</Label>
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              max={endDateStr}
            />
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">Data Final</Label>
            <input
              type="date"
              value={endDateStr}
              onChange={(e) => setEndDateStr(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              min={startDateStr}
              max={new Date().toISOString().split("T")[0]}
            />
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button 
            onClick={onSubmit} 
            className="bg-[#f3b234] hover:bg-[#e09a20] text-[#1a1a1a] font-medium"
          >
            <Search className="mr-2 h-4 w-4" />
            Visualizar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
