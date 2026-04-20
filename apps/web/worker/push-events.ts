/// <reference lib="webworker" />

interface PushPayload {
  title: string;
  body: string;
  icon: string;
  badge: string;
  data: {
    url: string;
    event: string;
  };
}

declare const self: ServiceWorkerGlobalScope;

// Gère les événements push entrants
// Si le dashboard est ouvert (app en foreground), la notification système est supprimée
// car le flux SSE a déjà affiché l'événement en temps réel
self.addEventListener('push', (event: PushEvent) => {
  if (!event.data) return;

  let payload: PushPayload;
  try {
    payload = event.data.json() as PushPayload;
  } catch {
    return;
  }

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // App ouverte dans au moins un onglet — SSE gère déjà l'affichage
        if (clients.length > 0) return Promise.resolve();

        return self.registration.showNotification(payload.title, {
          body: payload.body,
          icon: payload.icon,
          badge: payload.badge,
          data: payload.data,
          requireInteraction: false,
        });
      }),
  );
});

// Gère le clic sur la notification — deep link vers la fiche concernée
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const notifData = event.notification.data as { url?: string } | undefined;
  const url = notifData?.url ?? '/';

  event.waitUntil(
    self.clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clients) => {
        // Cherche un onglet déjà ouvert sur cette URL
        const existing = clients.find((c) => {
          try { return new URL(c.url).pathname === url; } catch { return false; }
        });
        if (existing) {
          return existing.focus();
        }
        return self.clients.openWindow(url);
      }),
  );
});
