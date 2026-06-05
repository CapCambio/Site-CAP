import { useEffect } from 'react';

export function useServiceWorker() {
  useEffect(() => {
    // Verificar se o navegador suporta service workers
    if (!('serviceWorker' in navigator)) {
      console.warn('Este navegador não suporta Service Workers');
      return;
    }

    // Função para registrar o service worker
    const registerServiceWorker = async () => {
      try {
        console.log('Tentando registrar o Service Worker...');
        const registration = await navigator.serviceWorker.register('/sw.js', {
          scope: '/',
        });
        
        // Verificar se há uma atualização disponível
        if (registration.waiting) {
          console.log('Service Worker está aguardando para ativar');
        }
        
        if (registration.installing) {
          console.log('Service Worker está instalando...');
          const installingWorker = registration.installing;
          installingWorker.onstatechange = () => {
            console.log('Estado do Service Worker:', installingWorker.state);
          };
        } else if (registration.active) {
          console.log('Service Worker está ativo');
        }
        
        console.log('Service Worker registrado com sucesso:', registration);
        return registration;
      } catch (error) {
        console.error('Falha ao registrar Service Worker:', error);
        throw error;
      }
    };

    // Registrar o Service Worker após o carregamento da página
    const handleLoad = () => {
      console.log('Página carregada, registrando Service Worker...');
      registerServiceWorker().catch(console.error);
    };

    // Adicionar listener para quando a página estiver totalmente carregada
    if (document.readyState === 'complete') {
      // Se a página já estiver carregada, registrar imediatamente
      handleLoad();
    } else {
      // Caso contrário, aguardar o evento de carregamento
      window.addEventListener('load', handleLoad);
    }

    // Limpar o listener quando o componente for desmontado
    return () => {
      window.removeEventListener('load', handleLoad);
    };
  }, []);
}
