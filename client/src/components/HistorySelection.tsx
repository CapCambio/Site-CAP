import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { HistoryFilter } from "../lib/types";
import { currencyDetails } from "../lib/currency";
import { useTranslation } from "react-i18next";

interface HistorySelectionProps {
  filter: HistoryFilter;
  onFilterChange: (filter: Partial<HistoryFilter>) => void;
  onSubmit: () => void;
}

export function HistorySelection({ filter, onFilterChange, onSubmit }: HistorySelectionProps) {
  const { t } = useTranslation();
  const [startDateStr, setStartDateStr] = useState<string>(
    filter.startDate.toISOString().split("T")[0]
  );
  
  const [endDateStr, setEndDateStr] = useState<string>(
    filter.endDate.toISOString().split("T")[0]
  );

  // Update parent component when date inputs change
  useEffect(() => {
    if (startDateStr) {
      const startDate = new Date(startDateStr);
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
      
      // Garantir que não ultrapasse 1 ano
      if (startDate < oneYearAgo) {
        onFilterChange({ startDate: oneYearAgo });
      } else {
        onFilterChange({ startDate });
      }
    }
    
    if (endDateStr) {
      const endDate = new Date(endDateStr);
      const today = new Date();
      
      // Garantir que não seja no futuro
      if (endDate > today) {
        onFilterChange({ endDate: today });
      } else {
        onFilterChange({ endDate });
      }
    }
  }, [startDateStr, endDateStr, onFilterChange]);

  const handleCurrencyChange = (newCode: string) => {
    onFilterChange({ code: newCode });
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl text-[#1a1a1a]">{t('history.title')}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">{t('history.currency')}</Label>
            <Select
              value={filter.code}
              onValueChange={handleCurrencyChange}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={t('history.selectCurrency')} />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(currencyDetails).map(([code]) => (
                  <SelectItem key={code} value={code}>
                    {t(`currencies.${code}`)} ({code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">{t('history.startDate')}</Label>
            <input
              type="date"
              value={startDateStr}
              onChange={(e) => setStartDateStr(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              max={endDateStr}
              min={new Date(new Date().setFullYear(new Date().getFullYear() - 1)).toISOString().split("T")[0]}
            />
          </div>
          
          <div>
            <Label className="block text-sm font-medium text-gray-700 mb-1">{t('history.endDate')}</Label>
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
            {t('history.view')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
