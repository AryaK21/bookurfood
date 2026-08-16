// Custom Service Worker for Push Notifications and 1-Tap Quick Actions
// Bundled automatically into sw.js by @ducanh2912/next-pwa

self.addEventListener('push', function (event) {
  if (!self.Notification || self.Notification.permission !== 'granted') {
    return;
  }

  var data = {};
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data = { title: 'FoodBook Meal Alert', body: event.data.text() };
    }
  }

  var mealType = data.mealType || 'lunch';
  var emoji = mealType === 'breakfast' ? '🍳' : mealType === 'lunch' ? '🍛' : '🍲';
  var mealTitle = data.menuTitle || data.body || 'Meal';
  var title = data.title || (mealType.charAt(0).toUpperCase() + mealType.slice(1) + ' ' + emoji);

  var options = {
    body: mealTitle,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/favicon.png',
    vibrate: [150, 50, 150],
    tag: 'foodbook-meal-' + mealType + '-' + (data.menuId || 'current'),
    renotify: true,
    data: {
      url: data.url || ('/?meal=' + mealType),
      menuId: data.menuId,
      profileId: data.profileId,
      phone: data.phone,
      mealType: mealType,
      menuTitle: mealTitle,
    },
    actions: [
      {
        action: 'eating',
        title: "✅ Yes (I'll Eat)",
      },
      {
        action: 'skipping',
        title: '❌ No (Skip)',
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  var action = event.action;
  var notifData = event.notification.data || {};
  var urlToOpen = notifData.url || '/';

  // 1-Tap quick booking from notification buttons
  if (action === 'eating' || action === 'skipping') {
    var bgPromise = fetch('/api/booking/quick-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menuId: notifData.menuId,
        profileId: notifData.profileId,
        phone: notifData.phone,
        status: action,
      }),
    })
      .then(function () {
        var isEat = action === 'eating';
        return self.registration.showNotification(
          isEat ? '✅ Booked to Eat 🍽️' : '🛑 Marked Absent',
          {
            body: notifData.menuTitle || notifData.mealType || 'Meal response recorded',
            icon: '/icons/icon-192x192.png',
            badge: '/icons/favicon.png',
            tag: 'foodbook-status-feedback',
            data: { url: notifData.url || '/' },
          }
        );
      })
      .catch(function (err) {
        console.error('Quick booking SW error:', err);
      });

    event.waitUntil(bgPromise);
    return;
  }

  // Open or focus app window
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url.indexOf(self.location.origin) !== -1 && 'focus' in client) {
          if ('navigate' in client && urlToOpen) {
            client.navigate(urlToOpen);
          }
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});
