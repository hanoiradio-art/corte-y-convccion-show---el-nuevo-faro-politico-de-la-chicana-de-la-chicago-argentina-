// Firebase Cloud Messaging Service Worker for background push notifications
// Hanoi Radio 98.9 MHz - Rosario, Argentina

importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

const firebaseConfig = {
  projectId: "propane-time-gf6jr",
  appId: "1:589668975075:web:278cbab3077ee5a53620d6",
  apiKey: "AIzaSyAgyPaSBhml9SJ1XtMuKq-BdO3AgnF7Bos",
  authDomain: "propane-time-gf6jr.firebaseapp.com",
  messagingSenderId: "589668975075"
};

try {
  firebase.initializeApp(firebaseConfig);
  const messaging = firebase.messaging();

  // Background push notification handler
  messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Mensaje recibido en segundo plano:', payload);

    const notificationTitle = payload.notification?.title || payload.data?.title || 'Hanoi Radio 98.9 • ¡Programa en Vivo!';
    const notificationOptions = {
      body: payload.notification?.body || payload.data?.body || '¡Comenzó un nuevo programa de rock under en vivo! Tocá para escuchar.',
      icon: '/pwa-192x192.png',
      badge: '/icon.svg',
      tag: 'hanoi-live-show',
      renotify: true,
      vibrate: [200, 100, 200, 100, 400],
      data: {
        url: '/'
      }
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
  });
} catch (err) {
  console.warn('[firebase-messaging-sw.js] Error al inicializar FCM sw:', err);
}

// Notification click handler: opens the app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
