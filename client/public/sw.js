// Service Worker seguro - não intercepta assets do Vite

const CACHE_NAME = 'cap-cotacoes-v7';
const OFFLINE_PAGE = '/offline.html';

console.log('[Service Worker] Iniciando...');

// Instalação do Service Worker
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Instalando...');
  self.skipWaiting();
  
  // Pré-cache de recursos essenciais (apenas recursos estáticos)
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Cache aberto');
        return cache.addAll([
          '/manifest.json',
          '/optimized/android-chrome-96x96.png',
          '/optimized/android-chrome-144x144.png',
          '/optimized/android-chrome-192x192.png',
          '/optimized/android-chrome-512x512.png',
          '/optimized/apple-touch-icon.png'
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
      console.log('[Service Worker] Ativado e pronto');
      return self.clients.claim();
    })
  );
});

// Estratégia de cache - NÃO intercepta assets do Vite
self.addEventListener('fetch', (event) => {
  const url = event.request.url;
  
  // Ignorar requisições que não são GET
  if (event.request.method !== 'GET') return;
  
  // Ignorar requisições de extensões do navegador
  if (url.startsWith('chrome-extension://') || 
      url.includes('extension') || 
      !url.startsWith('http')) {
    return;
  }
  
  // IGNORAR assets do Vite (não interceptar)
  if (url.includes('/assets/') || url.includes('/src/')) {
    return;
  }
  
  // Ignorar requisições de analytics
  if (url.includes('google-analytics') || url.includes('analytics')) {
    return;
  }
  
  // Para requisições de API, usar Network First sem cache
  if (url.includes('/api/')) {
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
  
  // Para recursos estáticos específicos (manifest, ícones), usar Cache First
  if (url.includes('/manifest.json') || 
      url.includes('/optimized/') ||
      url.includes('/splash/')) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(event.request).then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
              });
            }
            return response;
          });
        })
    );
    return;
  }
  
  // Para outras requisições, usar Network First com fallback
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_PAGE);
          }
          return new Response('Offline', { status: 503 });
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
  
  const targetUrl = event.notification.data.actionUrl || 'https://capcambio.com.br/cotacoes';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then(function(clientList) {
        for (const client of clientList) {
          if (client.url === targetUrl && 'focus' in client) {
            return client.focus();
          }
        }
        
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
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ action: 'reload' }));
      });
    });
  }
});
