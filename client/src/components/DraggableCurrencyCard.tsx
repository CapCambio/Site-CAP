import { Currency } from '../lib/types';
import { CurrencyCard } from './CurrencyCard';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const isMobile = useIsMobile();
  
  // Calcular se este card está sendo arrastado
  const isThisCardBeingDragged = draggedIndex === index;
  const isThisCardSelected = selectedForDrag === index;
  
  // No mobile, só mostrar contorno se este card está selecionado E não está sendo arrastado
  const shouldShowMobileSelection = isMobile && isThisCardSelected && !isThisCardBeingDragged;
  
  return (
    <div
      className={cn(
        'relative transition-all duration-200 ease-in-out',
        isThisCardBeingDragged && 'opacity-30 scale-95',
        shouldShowMobileSelection && 'ring-4 ring-yellow-400 ring-opacity-70 scale-105 shadow-xl rounded-xl',
        isDragOver && !isThisCardBeingDragged && 'transform translate-y-1',
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
