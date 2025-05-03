import { useState } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  ChevronsLeft, 
  ChevronsRight,
  ArrowUp,
  ArrowDown 
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CurrencyHistory } from "../lib/types";
import { formatDate, formatCurrencyValue } from "../lib/currency";

interface HistoryTableProps {
  data: CurrencyHistory[];
  code: string;
  isLoading: boolean;
}

export function HistoryTable({ data, code, isLoading }: HistoryTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const totalPages = Math.ceil(data.length / itemsPerPage);
  
  // Get current page data
  const getCurrentPageData = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return data.slice(startIndex, endIndex);
  };
  
  // Calculate changes between days
  const getChange = (index: number): number | null => {
    if (index >= data.length - 1) return null;
    
    const current = data[index];
    const next = data[index + 1];
    
    return ((current.buyPrice / next.buyPrice) - 1) * 100;
  };
  
  const goToPage = (page: number) => {
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    setCurrentPage(page);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registros Históricos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center p-8">
            <div className="w-12 h-12 border-4 border-[#f3b234] border-t-transparent rounded-full animate-spin"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Registros Históricos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center p-8">
            <p className="text-gray-500">Nenhum registro histórico encontrado para o período selecionado.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-lg">Registros Históricos</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead>
              <tr className="bg-gray-100 text-gray-600 uppercase text-base">
                <th className="py-4 px-4 text-left">Data</th>
                <th className="py-4 px-4 text-right">Compra</th>
                <th className="py-4 px-4 text-right">Venda</th>
                <th className="py-4 px-4 text-right">Variação</th>
              </tr>
            </thead>
            <tbody className="text-gray-600 text-base">
              {getCurrentPageData().map((item, index) => {
                const change = getChange(index);
                const isPositive = change !== null && change > 0;
                const isNegative = change !== null && change < 0;
                
                return (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-left">{formatDate(item.timestamp)}</td>
                    <td className="py-3 px-4 text-right">
                      R$ {formatCurrencyValue(code, item.buyPrice)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      R$ {formatCurrencyValue(code, item.sellPrice)}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {change === null ? (
                        <span className="text-gray-500">-</span>
                      ) : isPositive ? (
                        <span className="text-green-600 flex items-center justify-end">
                          <ArrowUp className="mr-1 h-4 w-4" />
                          {Math.abs(change).toFixed(2)}%
                        </span>
                      ) : isNegative ? (
                        <span className="text-red-600 flex items-center justify-end">
                          <ArrowDown className="mr-1 h-4 w-4" />
                          {Math.abs(change).toFixed(2)}%
                        </span>
                      ) : (
                        <span className="text-gray-500">0.00%</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
      <CardFooter className="border-t p-4 flex justify-between items-center">
        <p className="text-sm text-gray-600">
          Exibindo {Math.min(itemsPerPage, data.length)} de {data.length} registros
        </p>
        {totalPages > 1 && (
          <div className="flex space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {/* Page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNumber;
              
              // Logic to display appropriate page numbers
              if (totalPages <= 5) {
                pageNumber = i + 1;
              } else if (currentPage <= 3) {
                pageNumber = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNumber = totalPages - 4 + i;
              } else {
                pageNumber = currentPage - 2 + i;
              }
              
              return (
                <Button
                  key={i}
                  variant={currentPage === pageNumber ? "default" : "outline"}
                  size="sm"
                  onClick={() => goToPage(pageNumber)}
                  className={currentPage === pageNumber ? "bg-[#f3b234] text-[#1a1a1a] hover:bg-[#e09a20]" : ""}
                >
                  {pageNumber}
                </Button>
              );
            })}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </CardFooter>
    </Card>
  );
}
