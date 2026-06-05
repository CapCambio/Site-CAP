// Service Worker integrado com Workbox
importScripts('https://storage.googleapis.com/workbox-cdn/releases/6.5.4/workbox-sw.js');

// Configuração do Workbox
workbox.routing.registerRoute(
  ({ request }) => request.destination === 'image',
  new workbox.strategies.CacheFirst({
    cacheName: 'images',
    plugins: [
      new workbox.expiration.ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 30 * 24 * 60 * 60, // 30 dias
      }),
    ],
  })
);

workbox.routing.registerRoute(
  ({ request }) => request.destination === 'script' || request.destination === 'style',
  new workbox.strategies.StaleWhileRevalidate({
    cacheName: 'static-resources',
  })
);

// Notificações push — delegar para o mesmo comportamento do SW principal (public/sw.js via /sw.js)
self.addEventListener('push', function(event) {
  if (!event.data) return;
  let data;
  try {
    data = event.data.json();
  } catch (e) {
    console.error('[SW client/public] Erro ao processar push:', e);
    return;
  }
  const title = data.title || '💰 Alerta de cotações';
  const options = {
    body: data.body || '',
    icon: data.icon || '/optimized/favicon-32x32.webp',
    badge: data.badge || '/optimized/favicon-32x32.webp',
    data: {
      url: data.data?.url || '/',
      actionUrl: data.data?.actionUrl || 'https://capcambio.com.br/cotacoes',
    },
    tag: 'cap-cotacao-alert',
    renotify: true,
    requireInteraction: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Lidar com cliques nas notificações
self.addEventListener('notificationclick', function(event) {
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

// Workbox: precache dos assets essenciais
workbox.precaching.precacheAndRoute([
  { url: '/', revision: '1' },
  { url: '/offline.html', revision: '1' },
  { url: '/favicon.ico', revision: '1' }
]);

// Workbox: offline fallback
workbox.routing.setCatchHandler(({ event }) => {
  if (event.request.destination === 'document') {
    return workbox.precaching.match('/offline.html');
  }
  return Response.error();
});
