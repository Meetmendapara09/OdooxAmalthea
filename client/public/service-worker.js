self.addEventListener('push', event => {
  if (!event.data) {
    return;
  }

  let payload = {};
  try {
    payload = event.data.json();
  } catch (error) {
    console.error('Failed to parse push payload', error);
    payload = { title: 'Notification', body: event.data.text() };
  }

  const title = payload.title || 'Expense Update';
  const options = {
    body: payload.body,
    data: payload.data || {},
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    actions: payload.actions || [],
  };

  if (payload.url) {
    options.data = { ...(options.data || {}), url: payload.url };
  }

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  const url = event.notification.data && event.notification.data.url;
  if (url) {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
        for (const client of windowClients) {
          if (client.url === url && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(url);
        }
        return undefined;
      })
    );
  }
});
