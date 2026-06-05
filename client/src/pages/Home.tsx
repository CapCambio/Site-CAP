import { useState, useEffect, lazy, Suspense, useRef } from "react";
import { TabType } from "../lib/types";
import { useCurrencyData } from "../hooks/useCurrencyData";
import { useHistoricalData } from "../hooks/useHistoricalData";
import { useDateSelection } from "../hooks/useDateSelection";
import { useIsMobile } from "../hooks/use-mobile";
import { useAuth } from "../hooks/use-auth";
import { useDragDrop } from "../hooks/use-drag-drop";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import { formatCurrencyValue, formatPercentage } from "../lib/currency";
import { format } from "date-fns";
import { useTranslation } from "react-i18next";

// Componentes leves importados normalmente
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CurrencyLogo } from "../components/CurrencyLogo";
import { DraggableCurrencyCard } from "../components/DraggableCurrencyCard";
import { WhatsAppFloatingButton } from "@/components/WhatsAppFloatingButton";
import { Toaster } from "@/components/ui/toaster";

// Componentes pesados com lazy loading otimizado
const HistoryChart = lazy(() => import("@/components/HistoryChart").then(module => ({ default: module.HistoryChart })));
const HistoryTable = lazy(() => import("@/components/HistoryTable").then(module => ({ default: module.HistoryTable })));
const HistorySelection = lazy(() => import("@/components/HistorySelection").then(module => ({ default: module.HistorySelection })));
const CurrencyConverter = lazy(() => import("@/components/CurrencyConverter").then(module => ({ default: module.CurrencyConverter })));
const DatePicker = lazy(() => import("@/components/DatePicker").then(module => ({ default: module.DatePicker })));

// Componente de carregamento para o Suspense
const Loader = () => (
  <div className="flex items-center justify-center p-8">
    <Loader2 className="h-8 w-8 animate-spin text-primary" />
  </div>
);


export default function Home() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>("current");
  const isMobile = useIsMobile();
  const [showCalculator, setShowCalculator] = useState(false);
  const [isHistoricalView, setIsHistoricalView] = useState(false);
  const [expandedCards, setExpandedCards] = useState<{[key: string]: boolean}>({});
  const { user, showAdminPanel } = useAuth();

  const { 
    currencies, 
    isLoading: isLoadingCurrencies, 
    isRefreshing,
    refreshData, 
    getFormattedLastUpdate 
  } = useCurrencyData();

  // Hook de drag and drop com persistência por usuário
  const {
    items: orderedCurrencies,
    setItems: setOrderedCurrencies,
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
  } = useDragDrop(currencies, user?.email);

  // Estado para controlar tooltip de primeira vez
  const [showReorderHint, setShowReorderHint] = useState(false);
  const [isTooltipFading, setIsTooltipFading] = useState(false);
  const hintTimerRef = useRef<NodeJS.Timeout | null>(null);
  const fadeTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Verificar se já viu o hint
  useEffect(() => {
    // Não mostrar tooltip para admin
    if (user?.isAdmin) {
      return;
    }
    
    const userEmail = user?.email || 'guest';
    const desktopKey = `hasSeenReorderHint-desktop-${userEmail}`;
    const mobileKey = `hasSeenReorderHint-mobile-${userEmail}`;
    const key = isMobile ? mobileKey : desktopKey;
    
    const hasSeen = localStorage.getItem(key);
    
    // Mostrar hint se ainda não viu e tiver cards
    if (!hasSeen && (orderedCurrencies.length > 0 || currencies.length > 0)) {
      setShowReorderHint(true);
      
      // Auto-fechar após 15 segundos com fade
      hintTimerRef.current = setTimeout(() => {
        startTooltipFade();
      }, 15000);
    }
    
    // Limpar timer ao desmontar
    return () => {
      if (hintTimerRef.current) {
        clearTimeout(hintTimerRef.current);
      }
      if (fadeTimerRef.current) {
        clearTimeout(fadeTimerRef.current);
      }
    };
  }, [isMobile, orderedCurrencies, currencies, user?.email, user?.isAdmin]);
  
  // Iniciar fade suave
  const startTooltipFade = () => {
    setIsTooltipFading(true);
    
    // Remover do DOM após o fade completar
    fadeTimerRef.current = setTimeout(() => {
      dismissReorderHint();
    }, 300); // 300ms para o fade
  };
  
  // Fechar hint e marcar como visto
  const dismissReorderHint = () => {
    // Não salvar flag para admin
    if (user?.isAdmin) {
      setShowReorderHint(false);
      setIsTooltipFading(false);
      return;
    }
    
    const userEmail = user?.email || 'guest';
    const desktopKey = `hasSeenReorderHint-desktop-${userEmail}`;
    const mobileKey = `hasSeenReorderHint-mobile-${userEmail}`;
    const key = isMobile ? mobileKey : desktopKey;
    
    localStorage.setItem(key, 'true');
    setShowReorderHint(false);
    setIsTooltipFading(false);
    
    // Limpar timers se existirem
    if (hintTimerRef.current) {
      clearTimeout(hintTimerRef.current);
      hintTimerRef.current = null;
    }
    if (fadeTimerRef.current) {
      clearTimeout(fadeTimerRef.current);
      fadeTimerRef.current = null;
    }
  };
  
  // Fechar hint após primeiro arrasto
  useEffect(() => {
    if (showReorderHint && draggedItem) {
      startTooltipFade();
    }
  }, [draggedItem, showReorderHint]);

  const {
    historicalData,
    chartData,
    filter,
    updateFilter,
    isLoading: isLoadingHistory,
    refetch: fetchHistoricalData
  } = useHistoricalData();

  const {
    selectedDate,
    setSelectedDate,
    historicalPrices,
    isLoading: isLoadingDateSelection
  } = useDateSelection();

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    if (tab === "history") {
      fetchHistoricalData();
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDate(date);
    setIsHistoricalView(true);
  };

  const handleResetToCurrentView = () => {
    setIsHistoricalView(false);
  };

  const handleToggleCardExpand = (code: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [code]: !prev[code]
    }));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="container mx-auto px-4 pb-12 flex-grow">
        <Suspense fallback={<Loader />}>
          {!isLoadingCurrencies && activeTab === "current" && (
            <div className="max-w-3xl mx-auto">
              <CurrencyConverter currencies={currencies} userEmail={user?.email || null} />
            </div>
          )}

          {activeTab === "current" && (
            <div className={`${isMobile ? '' : 'currency-grid'}`}>
              {/* Tooltip de primeira vez - aparece só uma vez por dispositivo */}
              {showReorderHint && (
                <div className={`mb-4 transition-all duration-300 ease-in-out ${
                  isTooltipFading ? 'opacity-0 transform -translate-y-2 pointer-events-none' : 'opacity-100 transform translate-y-0'
                } ${isTooltipFading ? 'h-0 overflow-hidden' : ''}`}>
                  <div className="text-center text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200 relative">
                    {isMobile ? 
                      t('home.reorderHint') : 
                      t('home.dragToReorder')
                    }
                  </div>
                </div>
              )}
              
              {isLoadingCurrencies || isLoadingDateSelection ? (
                <div className={`grid ${isMobile ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="h-36 bg-gray-100 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className={`${isMobile ? 'space-y-3' : 'currency-desktop-layout'}`}>
                  {/* Usar orderedCurrencies se tiver dados, senão usar currencies */}
                  {(orderedCurrencies.length > 0 ? orderedCurrencies : currencies).map((currency, index) => (
                    <DraggableCurrencyCard
                      key={currency.code}
                      currency={currency}
                      isExpanded={expandedCards[currency.code] || false}
                      onToggleExpand={() => handleToggleCardExpand(currency.code)}
                      isHistoricalView={isHistoricalView}
                      historicalPrice={historicalPrices[currency.code]}
                      selectedDate={selectedDate}
                      index={index}
                      isDragging={draggedItem?.index === index}
                      isDragOver={dragOverIndex === index}
                      draggedIndex={draggedIndex}
                      selectedForDrag={selectedForDrag}
                      onDragStart={handleDragStart}
                      onDragEnd={handleDragEnd}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      handleMouseDown={handleMouseDown}
                      handleMouseUp={handleMouseUp}
                      handleTouchStart={handleTouchStart}
                      handleTouchEnd={handleTouchEnd}
                      cancelDragMode={cancelDragMode}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "history" && (
            <div className="block">
              <Suspense fallback={<div>{t('common.loading')}</div>}>
                <HistorySelection 
                  filter={filter}
                  onFilterChange={updateFilter}
                  onSubmit={fetchHistoricalData}
                />

                <HistoryChart 
                  data={chartData}
                  filter={filter}
                  isLoading={isLoadingHistory}
                />

                <HistoryTable 
                  data={historicalData}
                  code={filter.code}
                  isLoading={isLoadingHistory}
                />
              </Suspense>
            </div>
          )}
        </Suspense>
      </main>
      {isLoadingCurrencies && <Loader />}
      <Footer />

      {/* Botão flutuante do WhatsApp - aparece apenas quando AdminPanel NÃO está aberto */}
      {!showAdminPanel && <WhatsAppFloatingButton />}

      <Toaster />
    </div>
  );
}