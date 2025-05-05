import { useState, useRef, useEffect } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { format, isBefore, isAfter, subMonths, addMonths, getMonth, getYear, startOfMonth, endOfMonth, getDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Button } from "./ui/button";
import { Card } from "./ui/card";

interface DatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export function DatePicker({ selectedDate, onDateChange }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(selectedDate);
  const calendarRef = useRef<HTMLDivElement>(null);
  
  const today = new Date();
  
  // Calcular o limite de 12 meses para trás
  const minDate = new Date();
  minDate.setMonth(minDate.getMonth() - 12);
  
  // Formatar a data selecionada para exibição
  const formattedDate = format(selectedDate, 'dd/MM/yyyy');
  
  // Manipular navegação entre meses
  const goToPreviousMonth = () => {
    const newMonth = subMonths(currentMonth, 1);
    if (isAfter(newMonth, minDate) || 
        (getMonth(newMonth) === getMonth(minDate) && getYear(newMonth) === getYear(minDate))) {
      setCurrentMonth(newMonth);
    }
  };
  
  const goToNextMonth = () => {
    const newMonth = addMonths(currentMonth, 1);
    if (isBefore(newMonth, today) || 
        (getMonth(newMonth) === getMonth(today) && getYear(newMonth) === getYear(today))) {
      setCurrentMonth(newMonth);
    }
  };
  
  // Verificar se os botões de navegação devem ser desativados
  const isPreviousDisabled = getMonth(currentMonth) === getMonth(minDate) && 
                             getYear(currentMonth) === getYear(minDate);
  
  const isNextDisabled = getMonth(currentMonth) === getMonth(today) && 
                         getYear(currentMonth) === getYear(today);
  
  // Formatando o nome do mês
  const monthName = format(currentMonth, 'MMMM yyyy', { locale: ptBR });
  const capitalizedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Criar array com os dias da semana
  const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  
  // Calcular dias no mês atual
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const firstDayOfMonth = monthStart.getDay(); // 0 = domingo, 1 = segunda, etc.
  const daysInMonth = getDate(monthEnd);
  
  // Criar matriz para o calendário
  const days = [];
  
  // Adicionar dias vazios para o início do mês
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  
  // Adicionar os dias do mês
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const isBeforeMinDate = isBefore(date, minDate);
    const isAfterToday = isAfter(date, today);
    
    days.push({
      day,
      date,
      isDisabled: isBeforeMinDate || isAfterToday
    });
  }
  
  // Fechar o calendário quando clicar fora dele
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  return (
    <div className="relative">
      <Button 
        variant="link" 
        className="text-[#f3b234] p-0 flex items-center gap-2 hover:text-[#f3b234]/80"
        onClick={() => setIsOpen(!isOpen)}
      >
        <CalendarIcon className="w-5 h-5" />
        <span>{formattedDate}</span>
      </Button>
      
      {isOpen && (
        <Card 
          ref={calendarRef}
          className="absolute mt-2 p-3 z-[1000] shadow-lg bg-white dark:bg-black max-w-[calc(100vw-2rem)] left-1/2 -translate-x-1/2"
          style={{ width: '300px' }}
        >
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousMonth}
              disabled={isPreviousDisabled}
              className={`p-1 rounded ${isPreviousDisabled ? 'text-gray-400' : 'text-[#1a1a1a] hover:bg-gray-200'}`}
            >
              <ChevronLeft size={18} />
            </button>
            <h4 className="text-sm font-medium capitalize">{capitalizedMonthName}</h4>
            <button
              onClick={goToNextMonth}
              disabled={isNextDisabled}
              className={`p-1 rounded ${isNextDisabled ? 'text-gray-400' : 'text-[#1a1a1a] hover:bg-gray-200'}`}
            >
              <ChevronRight size={18} />
            </button>
          </div>
          
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {weekDays.map((day, index) => (
              <div key={index} className="text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-7 gap-1">
            {days.map((day, index) => (
              <div key={index} className="aspect-square flex items-center justify-center">
                {day ? (
                  <button
                    className={`
                      w-8 h-8 rounded-full text-sm flex items-center justify-center
                      ${day.isDisabled ? 'text-gray-300 cursor-not-allowed' : 
                        format(day.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd') 
                          ? 'bg-[#f3b234] text-[#1a1a1a] font-medium'
                          : format(day.date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd')
                            ? 'border-2 border-[#f3b234] text-[#1a1a1a] font-medium'
                            : 'hover:bg-gray-100 text-[#1a1a1a]'
                      }
                    `}
                    onClick={() => {
                      if (!day.isDisabled) {
                        onDateChange(day.date);
                        setIsOpen(false);
                      }
                    }}
                    disabled={day.isDisabled}
                  >
                    {day.day}
                  </button>
                ) : (
                  <span></span>
                )}
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}