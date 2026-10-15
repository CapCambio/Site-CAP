import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Currency } from '../lib/types';
import { CurrencyCard } from './CurrencyCard';
import { cn } from '@/lib/utils';

interface SortableCurrencyCardProps {
  currency: Currency;
  isExpanded: boolean;
  onToggleExpand: () => void;
  isHistoricalView?: boolean;
  historicalPrice?: {
    buyPrice: number | null;
    sellPrice: number | null;
    timestamp: Date | null;
  };
  selectedDate?: Date;
}

export function SortableCurrencyCard({
  currency,
  isExpanded,
  onToggleExpand,
  isHistoricalView,
  historicalPrice,
  selectedDate
}: SortableCurrencyCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: currency.code });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={cn(
        'relative transition-all duration-200 ease-in-out',
        isDragging && 'opacity-30 scale-95 z-50',
        !isDragging && 'cursor-move'
      )}
    >
      <CurrencyCard
        currency={currency}
        isExpanded={isExpanded}
        onToggleExpand={onToggleExpand}
        isHistoricalView={isHistoricalView}
        historicalPrice={historicalPrice}
        selectedDate={selectedDate}
      />
    </div>
  );
}
