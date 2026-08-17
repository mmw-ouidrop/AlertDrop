// Service Worker : s'exécute en arrière-plan même si l'onglet est fermé.
// Reçoit l'événement push et affiche une notification système.

self.addEventListener('push', (event) => {
  let data = { title: '🚨 ALERTE', body: 'Alerte déclenchée' };
  try {
    data = event.data.json();
  } catch (e) {
    // fallback si le payload n'est pas du JSON
  }

  const options = {
    body: data.body,
    // Vibration forte et répétée, importante sur Android pour attirer l'attention
    vibrate: [500, 200, 500, 200, 500, 200, 500],
    // Empêche la notification de disparaître toute seule
    requireInteraction: true,
    tag: 'alerte-urgence',
    renotify: true,
    silent: false,
    // Un tag/icône distinct aide à repérer visuellement l'alerte
    badge: undefined,
    icon: undefined,
    data: { url: '/' }
  };

  event.waitUntil(self.registration.showNotification(data.title, options));
});

// Au clic sur la notification, ouvrir/focus l'application
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});
