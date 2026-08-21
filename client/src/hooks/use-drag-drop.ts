import { useState, useEffect, useRef } from 'react';
import { Currency } from '../lib/types';

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export function useDragDrop(initialItems: Currency[], userEmail?: string | null) {
  const [items, setItems] = useState<Currency[]>([]);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isLongPressActive, setIsLongPressActive] = useState<boolean>(false);
  const [selectedForDrag, setSelectedForDrag] = useState<number | null>(null);
  const isInitialized = useRef(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const scrollInterval = useRef<NodeJS.Timeout | null>(null);
  
  // Gerar chave única para cada usuário
  const getStorageKey = () => {
    return userEmail ? `currency-order-${userEmail}` : 'currency-order-guest';
  };

  // Salvar ordem na API
  const saveOrderToAPI = async (order: string[]) => {
    if (!userEmail) return;
    
    try {
      const response = await fetch('/api/user/card-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ order })
      });
      
      if (response.ok) {
        console.log('✅ Ordem salva na API:', order);
      }
    } catch (error) {
      console.error('Erro ao salvar ordem na API:', error);
    }
  };

  // Carregar ordem da API
  const loadOrderFromAPI = async () => {
    if (!userEmail) return null;
    
    try {
      const response = await fetch('/api/user/card-order', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.order || null;
      }
    } catch (error) {
      console.error('Erro ao carregar ordem da API:', error);
    }
    
    return null;
  };

  // Funções de auto-scroll
  const startAutoScroll = (direction: 'up' | 'down') => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
    }
    
    scrollInterval.current = setInterval(() => {
      const scrollAmount = direction === 'up' ? -50 : 50;
      window.scrollBy({
        top: scrollAmount,
        behavior: 'smooth'
      });
    }, 100);
  };

  const stopAutoScroll = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current);
      scrollInterval.current = null;
    }
  };

  const checkAutoScroll = (e: React.DragEvent) => {
    const scrollThreshold = 100; // 100px das bordas
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    
    const mouseY = e.clientY;
    const nearTop = mouseY <= scrollThreshold;
    const nearBottom = mouseY >= windowHeight - scrollThreshold;
    const canScrollUp = scrollY > 0;
    const canScrollDown = scrollY + windowHeight < documentHeight;
    
    if (nearTop && canScrollUp) {
      startAutoScroll('up');
    } else if (nearBottom && canScrollDown) {
      startAutoScroll('down');
    } else {
      stopAutoScroll();
    }
  };
  
  // Carregar ordem da API primeiro, depois fallback para localStorage
  useEffect(() => {
    if (initialItems.length === 0) return;
    if (isInitialized.current) return;
    
    const initializeOrder = async () => {
      // Tentar carregar da API primeiro
      let order = await loadOrderFromAPI();
      
      // Se não conseguiu da API, tentar localStorage
      if (!order) {
        const storageKey = getStorageKey();
        const savedOrder = localStorage.getItem(storageKey);
        
        if (savedOrder) {
          try {
            order = JSON.parse(savedOrder);
            console.log('📋 Carregando ordem do localStorage:', order);
          } catch (error) {
            console.error('Erro ao carregar ordem do localStorage:', error);
            order = null;
          }
        }
      }
      
      if (order) {
        const reorderedItems = order
          .map((code: string) => initialItems.find(item => item.code === code))
          .filter(Boolean) as Currency[];
        
        if (reorderedItems.length > 0) {
          // Adicionar novas moedas que não estão na ordem salva
          const newItems = initialItems.filter(item => 
            !reorderedItems.some(ordered => ordered.code === item.code)
          );
          setItems([...reorderedItems, ...newItems]);
        } else {
          setItems(initialItems);
        }
      } else {
        setItems(initialItems);
      }
      
      isInitialized.current = true;
    };
    
    initializeOrder();
  }, [initialItems, userEmail]);

  // Salvar ordem na API e localStorage quando mudar
  useEffect(() => {
    if (items.length > 0) {
      const order = items.map(item => item.code);
      
      // SEMPRE salvar no localStorage (independente de login)
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(order));
      
      // Tentar sincronizar com API se tiver usuário
      if (userEmail) {
        saveOrderToAPI(order);
      }
    }
  }, [items, userEmail]);

  // Listener global para auto-scroll
  useEffect(() => {
    const handleGlobalDragOver = (e: DragEvent) => {
      if (draggedItem !== null) {
        checkAutoScroll(e as any);
      }
    };

    const handleGlobalDragEnd = () => {
      stopAutoScroll();
    };

    document.addEventListener('dragover', handleGlobalDragOver);
    document.addEventListener('dragend', handleGlobalDragEnd);

    return () => {
      document.removeEventListener('dragover', handleGlobalDragOver);
      document.removeEventListener('dragend', handleGlobalDragEnd);
      stopAutoScroll();
    };
  }, [draggedItem]);

  const handleMouseDown = (index: number) => {
    // Não fazer nada no desktop - só para mobile long press
    // Long press é handled pelo touch events
  };

  const handleMouseUp = () => {
    // Não fazer nada no desktop - só para mobile long press
  };

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    // Guardar posição inicial do toque para detectar scroll
    const touch = e.touches[0];
    const startY = touch.clientY;
    const startX = touch.clientX;

    // Iniciar long press timer para touch
    longPressTimer.current = setTimeout(() => {
      setIsLongPressActive(true);
      setSelectedForDrag(index);

      // Iniciar drag visual
      const draggedItem: DragItem = {
        index,
        id: items[index].code,
        type: 'currency'
      };

      setDraggedItem(draggedItem);
      setDraggedIndex(index);
    }, 1000); // 1 segundo

    // Adicionar listener de touchmove para detectar scroll
    const handleTouchMove = (moveEvent: TouchEvent) => {
      const moveTouch = moveEvent.touches[0];
      const deltaY = Math.abs(moveTouch.clientY - startY);
      const deltaX = Math.abs(moveTouch.clientX - startX);

      // Se moveu mais de 10px, cancelar long press (é scroll)
      if (deltaY > 10 || deltaX > 10) {
        if (longPressTimer.current) {
          clearTimeout(longPressTimer.current);
          longPressTimer.current = null;
        }
        document.removeEventListener('touchmove', handleTouchMove);
      }
    };

    document.addEventListener('touchmove', handleTouchMove, { passive: true });
  };

  const handleTouchEnd = () => {
    // Cancelar long press se não completou
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    const draggedItem: DragItem = {
      index,
      id: items[index].code,
      type: 'currency'
    };
    
    setDraggedItem(draggedItem);
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.outerHTML);
    
    // Criar imagem fantasma personalizada
    const dragImage = e.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.opacity = '0.8';
    dragImage.style.transform = 'rotate(2deg)';
    dragImage.style.boxShadow = '0 10px 25px rgba(0,0,0,0.3)';
    dragImage.style.maxWidth = '300px';
    
    document.body.appendChild(dragImage);
    e.dataTransfer.setDragImage(dragImage, 150, 100);
    
    // Remover imagem fantasma após um tempo
    setTimeout(() => {
      document.body.removeChild(dragImage);
    }, 0);
  };

  const handleDragEnd = (e: React.DragEvent) => {
    stopAutoScroll();
    setDraggedItem(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
    setIsLongPressActive(false);
    setSelectedForDrag(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    
    if (draggedIndex !== null && draggedIndex !== index) {
      setDragOverIndex(index);
      
      // Swap em tempo real
      const newItems = [...items];
      const [dragged] = newItems.splice(draggedIndex, 1);
      newItems.splice(index, 0, dragged);
      
      setItems(newItems);
      setDraggedIndex(index);
      // 🚨 ATUALIZAR selectedForDrag junto para manter sincronia
      setSelectedForDrag(index);
    }
  };

  const handleDragLeave = () => {
    // Não limpa o dragOverIndex para manter o feedback visual
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    
    if (draggedIndex === null || draggedIndex === dropIndex) {
      return;
    }

    // A ordem já foi atualizada no handleDragOver
    setDraggedIndex(null);
    setIsLongPressActive(false);
    setSelectedForDrag(null);
  };

  const cancelDragMode = () => {
    stopAutoScroll();
    setIsLongPressActive(false);
    setSelectedForDrag(null);
    setDraggedItem(null);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return {
    items,
    setItems,
    draggedItem,
    draggedIndex,
    dragOverIndex,
    isLongPressActive,
    selectedForDrag,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleMouseDown,
    handleMouseUp,
    handleTouchStart,
    handleTouchEnd,
    cancelDragMode
  };
}
