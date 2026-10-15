import { useState, useEffect, useRef } from 'react';
import { Currency } from '../lib/types';

export function useSortable(initialItems: Currency[], userEmail?: string | null) {
  const [items, setItems] = useState<Currency[]>([]);
  const isInitialized = useRef(false);
  const lastSavedOrderRef = useRef<string | null>(null);

  const getStorageKey = () => {
    return userEmail ? `currency-order-${userEmail}` : 'currency-order-guest';
  };

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

  useEffect(() => {
    if (initialItems.length === 0) return;
    if (isInitialized.current) return;
    
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
          setItems([...reorderedItems, ...newItems]);
        } else {
          setItems(initialItems);
        }
      } catch (error) {
        console.error('Erro ao carregar ordem do localStorage:', error);
        setItems(initialItems);
      }
    } else {
      setItems(initialItems);
    }
    
    isInitialized.current = true;
    
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
            setItems([...reorderedItems, ...newItems]);
          }
        }
      });
    }
  }, [initialItems, userEmail]);

  useEffect(() => {
    if (!isInitialized.current) return;
    if (initialItems.length === 0) return;

    setItems(prev => {
      if (prev.length === 0) return initialItems;
      const byCode = new Map<string, Currency>(
        initialItems.map(c => [c.code, c] as [string, Currency])
      );
      const kept = prev
        .map(it => byCode.get(it.code))
        .filter(Boolean) as Currency[];
      const added = initialItems.filter(c => !prev.some(it => it.code === c.code));
      return [...kept, ...added];
    });
  }, [initialItems]);

  useEffect(() => {
    if (items.length > 0) {
      const order = items.map(item => item.code);
      const signature = order.join('|');

      if (signature === lastSavedOrderRef.current) return;
      lastSavedOrderRef.current = signature;

      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(order));

      if (userEmail) {
        saveOrderToAPI(order);
      }
    }
  }, [items, userEmail]);

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    
    if (active && over && active.id !== over.id) {
      const oldIndex = items.findIndex((item) => item.code === active.id);
      const newIndex = items.findIndex((item) => item.code === over.id);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        setItems((items) => {
          const newItems = [...items];
          const [moved] = newItems.splice(oldIndex, 1);
          newItems.splice(newIndex, 0, moved);
          return newItems;
        });
      }
    }
  };

  return {
    items,
    setItems,
    handleDragEnd
  };
}
