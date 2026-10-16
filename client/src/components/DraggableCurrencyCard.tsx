import { Currency } from '../lib/types';
import { CurrencyCard } from './CurrencyCard';
import { cn } from '@/lib/utils';

interface DraggableCurrencyCardProps {
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
  index: number;
  isDragging?: boolean;
  isDragOver?: boolean;
  draggedIndex?: number | null;
  selectedForDrag?: number | null;
  onDragStart: (e: React.DragEvent, index: number) => void;
  onDragEnd: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent, index: number) => void;
  onDragLeave: () => void;
  onDrop: (e: React.DragEvent, index: number) => void;
  handleMouseDown?: (index: number) => void;
  handleMouseUp?: () => void;
  handleTouchStart?: (e: React.TouchEvent, index: number) => void;
  handleTouchEnd?: () => void;
  cancelDragMode?: () => void;
}

export function DraggableCurrencyCard({
  currency,
  isExpanded,
  onToggleExpand,
  isHistoricalView,
  historicalPrice,
  selectedDate,
  index,
  isDragging,
  isDragOver,
  draggedIndex,
  selectedForDrag,
  onDragStart,
  onDragEnd,
  onDragOver,
  onDragLeave,
  onDrop,
  handleMouseDown,
  handleMouseUp,
  handleTouchStart,
  handleTouchEnd,
  cancelDragMode
}: DraggableCurrencyCardProps) {
  // Calcular se este card está sendo arrastado
  const isThisCardBeingDragged = draggedIndex === index;
  const isThisCardSelected = selectedForDrag === index;

  return (
    <div
      className={cn(
        'relative transition-all duration-200 ease-in-out',
        isThisCardBeingDragged && 'opacity-30 scale-95',
        isThisCardSelected && 'cursor-move',
        isThisCardBeingDragged && 'cursor-grabbing'
      )}
      draggable
      onDragStart={(e) => onDragStart(e, index)}
      onDragEnd={onDragEnd}
      onDragOver={(e) => onDragOver(e, index)}
      onDragLeave={onDragLeave}
      onDrop={(e) => onDrop(e, index)}
      onMouseDown={() => handleMouseDown?.(index)}
      onMouseUp={handleMouseUp}
      onTouchStart={(e) => handleTouchStart?.(e, index)}
      onTouchEnd={handleTouchEnd}
    >
      {/* Card principal (sempre renderiza, mas com opacidade diferente) */}
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
