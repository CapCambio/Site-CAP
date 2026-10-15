import { useState, useEffect, useRef } from 'react';
import { Currency } from '../lib/types';

interface DragItem {
  index: number;
  id: string;
  type: string;
}

export function useDragDrop(initialItems: Currency[], userEmail?: string | null, twoColumnLayout = false) {
  const [items, setItems] = useState<Currency[]>([]);
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [isLongPressActive, setIsLongPressActive] = useState<boolean>(false);
  const [selectedForDrag, setSelectedForDrag] = useState<number | null>(null);
  const isInitialized = useRef(false);
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);
  const scrollInterval = useRef<NodeJS.Timeout | null>(null);
  const pendingMoveRef = useRef<number | null>(null);
  const lastSavedOrderRef = useRef<string | null>(null);
  // Refs para leitura síncrona dentro de event handlers (evitam stale closure)
  const draggedIndexRef = useRef<number | null>(null);
  const itemsRef = useRef<Currency[]>([]);

  // Helpers que mantêm estado e ref em sincronia — definidos aqui para uso nos effects também
  const setDraggedIndexSynced = (index: number | null) => {
    draggedIndexRef.current = index;
    setDraggedIndex(index);
  };

  const setItemsSynced = (newItems: Currency[]) => {
    itemsRef.current = newItems;
    setItems(newItems);
  };
  
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
  
  // Renderizar imediatamente com localStorage (se disponível) ou initialItems
  // Carregar ordem da API em background e atualizar se necessário
  useEffect(() => {
    if (initialItems.length === 0) return;
    if (isInitialized.current) return;
    
    // Tentar localStorage primeiro (síncrono, render imediato)
    const storageKey = getStorageKey();
    const savedOrder = localStorage.getItem(storageKey);
    
    if (savedOrder) {
      try {
        const order = JSON.parse(savedOrder);
        const reorderedItems = order
          .map((code: string) => initialItems.find(item => item.code === code))
          .filter(Boolean) as Currency[];
        
        if (reorderedItems.length > 0) {
          const newItems = initialItems.filter(item => 
            !reorderedItems.some(ordered => ordered.code === item.code)
          );
          setItemsSynced([...reorderedItems, ...newItems]);
        } else {
          setItemsSynced(initialItems);
        }
      } catch (error) {
        console.error('Erro ao carregar ordem do localStorage:', error);
        setItemsSynced(initialItems);
      }
    } else {
      setItemsSynced(initialItems);
    }
    
    isInitialized.current = true;
    
    // Carregar ordem da API em background (não bloqueia render)
    if (userEmail) {
      loadOrderFromAPI().then(order => {
        if (order) {
          const reorderedItems = order
            .map((code: string) => initialItems.find(item => item.code === code))
            .filter(Boolean) as Currency[];
          
          if (reorderedItems.length > 0) {
            const newItems = initialItems.filter(item => 
              !reorderedItems.some(ordered => ordered.code === item.code)
            );
            setItemsSynced([...reorderedItems, ...newItems]);
          }
        }
      });
    }
  }, [initialItems, userEmail]);

  // Re-sincronizar DADOS (preços) sem perder a ordem do usuário.
  // O init acima só roda uma vez (isInitialized), então sem este efeito os
  // cards mostrariam para sempre o snapshot da primeira montagem: o auto-refresh
  // traz preços novos para initialItems, mas 'items' fica congelado e só um F5
  // (remontagem) atualizaria. Reconstruímos 'items' com os objetos novos,
  // preservando a ordem relativa; moedas novas entram no fim e removidas saem.
  useEffect(() => {
    if (!isInitialized.current) return;
    if (initialItems.length === 0) return;

    const prev = itemsRef.current;
    if (prev.length === 0) {
      setItemsSynced(initialItems);
      return;
    }
    const byCode = new Map<string, Currency>(
      initialItems.map(c => [c.code, c] as [string, Currency])
    );
    const kept = prev
      .map(it => byCode.get(it.code))
      .filter(Boolean) as Currency[];
    const added = initialItems.filter(c => !prev.some(it => it.code === c.code));
    const next = [...kept, ...added];
    // Apenas atualiza se a lista de códigos mudou (evita re-render desnecessário)
    const prevSig = prev.map(i => i.code).join('|');
    const nextSig = next.map(i => i.code).join('|');
    if (prevSig !== nextSig) {
      setItemsSynced(next);
    } else {
      // Ordem igual mas dados (preços) podem ter mudado — atualiza sem mexer na ref de ordem
      itemsRef.current = next;
      setItems(next);
    }
  }, [initialItems]);

  // Salvar ordem na API e localStorage quando a ORDEM mudar
  useEffect(() => {
    if (items.length > 0) {
      const order = items.map(item => item.code);
      const signature = order.join('|');

      // Se a ordem é a mesma, não reescrever (evita POST a cada tick de preço)
      if (signature === lastSavedOrderRef.current) return;
      lastSavedOrderRef.current = signature;

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
        id: itemsRef.current[index].code,
        type: 'currency'
      };

      setDraggedItem(draggedItem);
      setDraggedIndexSynced(index);
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
    console.log(' handleDragStart:', { index, item: itemsRef.current[index]?.code });
    const draggedItem: DragItem = {
      index,
      id: itemsRef.current[index].code,
      type: 'currency'
    };
    
    setDraggedItem(draggedItem);
    setDraggedIndexSynced(index);
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

    // Movimento entre colunas é aplicado só agora: mover o card de coluna durante
    // o arrasto remontaria o nó DOM e o navegador abortaria o drag nativo.
    // Lê da ref para garantir o valor mais recente (sem stale closure).
    const currentDraggedIndex = draggedIndexRef.current;
    if (pendingMoveRef.current !== null && currentDraggedIndex !== null) {
      const newItems = [...itemsRef.current];
      const [dragged] = newItems.splice(currentDraggedIndex, 1);
      newItems.splice(pendingMoveRef.current, 0, dragged);
      setItemsSynced(newItems);
      pendingMoveRef.current = null;
    }

    setDraggedItem(null);
    setDraggedIndexSynced(null);
    setDragOverIndex(null);
    setIsLongPressActive(false);
    setSelectedForDrag(null);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    // Lê da ref: garante valor atual mesmo sem re-render (cross-column não faz setDraggedIndex)
    const currentDraggedIndex = draggedIndexRef.current;
    
    if (currentDraggedIndex !== null && currentDraggedIndex !== index) {
      console.log(' handleDragOver:', { currentDraggedIndex, targetIndex: index, twoColumnLayout, sameColumn: currentDraggedIndex % 2 === index % 2 });
      setDragOverIndex(index);

      // Em layout de 2 colunas, não trocar com cards da outra coluna em tempo real
      // (o swap real acontece no dragend via pendingMoveRef)
      if (twoColumnLayout && currentDraggedIndex % 2 !== index % 2) {
        console.log('⏸️ Coluna diferente - swap adiado para dragend');
        return;
      }

      // Swap em tempo real (mesma coluna)
      const newItems = [...itemsRef.current];
      const [dragged] = newItems.splice(currentDraggedIndex, 1);
      newItems.splice(index, 0, dragged);
      
      setItemsSynced(newItems);
      setDraggedIndexSynced(index);
      // Manter sincronia do selectedForDrag
      setSelectedForDrag(index);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Limpa o feedback visual apenas quando o cursor realmente sai do card
    // (e não quando entra em um elemento filho).
    const related = e.relatedTarget as Node | null;
    if (!related || !e.currentTarget.contains(related)) {
      setDragOverIndex(null);
    }
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    setDragOverIndex(null);

    // Lê da ref para garantir valor atual
    const currentDraggedIndex = draggedIndexRef.current;
    
    if (currentDraggedIndex === null || currentDraggedIndex === dropIndex) {
      return;
    }

    // Drop em outra coluna não teve swap ao vivo; agenda para o dragend
    if (twoColumnLayout && currentDraggedIndex % 2 !== dropIndex % 2) {
      pendingMoveRef.current = dropIndex;
      return;
    }

    // A ordem já foi atualizada no handleDragOver
    setDraggedIndexSynced(null);
    setIsLongPressActive(false);
    setSelectedForDrag(null);
  };

  const cancelDragMode = () => {
    stopAutoScroll();
    pendingMoveRef.current = null;
    setIsLongPressActive(false);
    setSelectedForDrag(null);
    setDraggedItem(null);
    setDraggedIndexSynced(null);
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
