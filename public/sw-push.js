// Web Push Notification Service Worker Handler for FoodBook
self.addEventListener('push', function (event) {
  if (!(self.Notification && self.Notification.permission === 'granted')) {
    return;
  }

  let data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'FoodBook Meal Alert', body: event.data.text() };
    }
  }

  const title = data.title || "Tap to book tonight's dinner! 🍛";
  const options = {
    body: data.body || "Hot dinner menu is ready. Lock in your attendance before 5:00 PM cutoff!",
    icon: '/icons/icon-192x192.png',
    badge: '/icons/favicon.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
    actions: [
      { action: 'book', title: "I'll Eat 🍽️" },
      { action: 'skip', title: "Skip 🛑" },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
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
