// Registrar o Service Worker para notificações push
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      console.log('Iniciando registro do Service Worker...');
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });
      
      console.log('Service Worker registrado com sucesso:', registration.scope);
      
      // Verificar o estado do service worker
      if (registration.installing) {
        console.log('Service Worker está instalando...');
        registration.installing.addEventListener('statechange', (event) => {
          console.log('Estado do Service Worker:', event.target.state);
        });
      } else if (registration.waiting) {
        console.log('Service Worker instalado e esperando...');
      } else if (registration.active) {
        console.log('Service Worker ativo e rodando');
      }
      
      return registration;
    } catch (error) {
      console.error('Falha ao registrar o Service Worker:', error);
      throw error;
    }
  });
}

// Função para solicitar permissão de notificação
async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('Este navegador não suporta notificações desktop');
    return false;
  }

  if (Notification.permission === 'granted') {
    console.log('Permissão para notificações já concedida');
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      console.log('Status da permissão:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Erro ao solicitar permissão:', error);
      return false;
    }
  }
  
  console.log('Permissão para notificações negada pelo usuário');
  return false;
}

// Função para verificar se o navegador suporta notificações push
function checkPushSupport() {
  if (!('serviceWorker' in navigator)) {
    console.log('Este navegador não suporta Service Workers');
    return false;
  }
  
  if (!('PushManager' in window)) {
    console.log('Este navegador não suporta a API Push');
    return false;
  }
  
  return true;
}

// Exportar funções para uso global
window.notificationUtils = {
  requestPermission: requestNotificationPermission,
  isSupported: checkPushSupport
};

console.log('sw-register.js carregado com sucesso');
