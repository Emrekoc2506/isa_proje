self.addEventListener('push', function (event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    data = { title: 'Muhristan', body: event.data ? event.data.text() : '' };
  }

  const title = data.title || 'Muhristan';
  const options = {
    body: data.body || 'Yeni bir sipariş bildirimi!',
    icon: '/logo-2.png',
    badge: '/logo-2.png',
    vibrate: [200, 100, 200],
    tag: 'order-notification',
    renotify: true,
    data: {
      url: data.url || '/admin?tab=orders'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/admin?tab=orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes('/admin') && 'focus' in client) {
          if ('navigate' in client && client.url !== urlToOpen) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
