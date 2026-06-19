// Service Worker simplificado para cache e push notifications

const CACHE_NAME = 'cap-cotacoes-v5';
const OFFLINE_PAGE = '/offline.html';

// Adiciona uma mensagem para debug
console.log('[Service Worker] Iniciando...');

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  
  // Pular a fase de espera para ativação imediata
  self.skipWaiting();
  
  // Pré-cache de recursos essenciais
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache aberto');
        // Pré-cache do manifest, ícones, splash screen e vídeo
        return cache.addAll([
          '/manifest.json',
          '/optimized/android-chrome-96x96.png',
          '/optimized/android-chrome-144x144.png',
          '/optimized/android-chrome-192x192.png',
          '/optimized/android-chrome-512x512.png',
          '/optimized/apple-touch-icon.png',
          '/splash-video.html',
          '/splash.mp4'
        ]).then(() => {
          console.log('[Service Worker] Recursos essenciais cacheados');
        }).catch(err => {
          console.log('[Service Worker] Erro ao cachear recursos:', err);
        });
      })
  );
});

// Ativação do Service Worker
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Ativado');
  
  // Limpar caches antigos
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('[Service Worker] Caches encontrados:', cacheNames);
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => {
            console.log('[Service Worker] Removendo cache antigo:', name);
            return caches.delete(name);
          })
      );
    }).then(() => {
      console.log('[Service Worker] Ativado e pronto para controlar clientes');
      return self.clients.claim();
    })
  );
});

// Estratégia de cache: Network First, fallback para cache
self.addEventListener('fetch', (event) => {
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar requisições de extensões do navegador
  if (event.request.url.startsWith('chrome-extension://') || 
      event.request.url.includes('extension') || 
      !(event.request.url.startsWith('http'))) {
    return;
  }
  
  // Ignorar requisições de analytics
  if (event.request.url.includes('google-analytics') || 
      event.request.url.includes('analytics')) {
    return;
  }
  
  // Para requisições de API, usar estratégia Network First sem cache
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request, { credentials: 'include' })
        .catch(() => {
          return new Response(JSON.stringify({ error: 'Offline' }), {
            status: 503,
            headers: { 'Content-Type': 'application/json' }
          });
        })
    );
    return;
  }
  
  // Para recursos estáticos, usar Network First com fallback para cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Se a resposta é válida, armazena em cache
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // Se falhar, tenta buscar no cache
        return caches.match(event.request)
          .then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Se for uma navegação, retorna a página offline
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_PAGE);
            }
            return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
          });
      })
  );
});

// Gerenciamento de notificações push
self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('Erro ao processar notificação push:', e);
    return;
  }

  // Formata o título e corpo da notificação
  const notificationTitle = data.title || '💰 Atualização de Cotações';
  const notificationBody = data.body || 'Confira as melhores taxas de câmbio disponíveis agora mesmo!';

  const options = {
    body: notificationBody,
    icon: data.icon || '/optimized/android-chrome-192x192.png',
    badge: data.badge || '/optimized/android-chrome-96x96.png',
    image: data.image,
    vibrate: [100, 50, 100],
    requireInteraction: false,
    data: {
      url: data.data?.url || '/',
      actionUrl: data.data?.actionUrl || 'https://capcambio.com.br/cotacoes'
    },
    actions: data.actions || [
      {
        action: 'view-quotes',
        title: 'Ver Cotações',
        icon: '/optimized/android-chrome-96x96.png'
      }
    ]
  };

  const showOptions = {
    ...options,
    tag: 'cap-cotacao-alert',
    renotify: true,
    requireInteraction: true,
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, showOptions)
  );
});

// Manipulação de cliques nas notificações
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Sempre redireciona para a página de cotações, independentemente de onde clicou
  const targetUrl = event.notification.data.actionUrl || 'https://capcambio.com.br/cotacoes';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(function(clientList) {
        // Tenta focar em uma janela existente com o mesmo URL
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Se não encontrou, abre uma nova janela
        if (clients.openWindow) {
          return clients.openWindow(targetUrl);
        }
      })
  );
});

// Atualização em segundo plano
self.addEventListener('sync', (event) => {
  if (event.tag === 'update-rates') {
    console.log('[Service Worker] Sincronização de cotações em segundo plano');
    // Aqui você pode adicionar lógica para sincronização em segundo plano
  }
});

// Limpar cache quando solicitado
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'clear-cache') {
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Recarregar a página após limpar o cache
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ action: 'reload' }));
      });
    });
  }
});
