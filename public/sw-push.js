// Web Push Notification Service Worker Handler for FoodBook
// Handles 1-tap notification action buttons (✅ Yes / ❌ No) directly in the background

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

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

  const mealType = data.mealType || 'dinner';
  const emoji = mealType === 'breakfast' ? '🍳' : mealType === 'lunch' ? '🍛' : '🍲';
  const defaultMealNames = {
    breakfast: 'South Indian Idli & Vada',
    lunch: 'North Indian Veg Thali',
    dinner: 'Special Dum Biryani Feast',
  };

  const mealTitle = data.menuTitle || data.body || defaultMealNames[mealType] || 'Meal';
  const title = data.title || `${mealType.charAt(0).toUpperCase() + mealType.slice(1)} ${emoji}`;
  const options = {
    body: mealTitle,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/favicon.png',
    vibrate: [120, 40, 120],
    tag: `foodbook-meal-${mealType}-${data.menuId || 'current'}`,
    renotify: true,
    data: {
      url: data.url || `/?meal=${mealType}`,
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
        title: "❌ No (Skip)",
      },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function (event) {
  event.notification.close();

  const action = event.action;
  const notifData = event.notification.data || {};
  const urlToOpen = notifData.url || '/';

  // 1. If resident tapped an Action Button directly (✅ Yes / ❌ No)
  if (action === 'eating' || action === 'skipping' || action === 'book' || action === 'skip') {
    const status = (action === 'eating' || action === 'book') ? 'eating' : 'skipping';

    const bgBookingPromise = fetch('/api/booking/quick-toggle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        menuId: notifData.menuId,
        profileId: notifData.profileId,
        phone: notifData.phone,
        status: status,
      }),
    })
      .then(async (res) => {
        let respData = {};
        try {
          respData = await res.json();
        } catch (e) {}

        const isEat = status === 'eating';
        const feedbackTitle = isEat
          ? '✅ Booked to Eat 🍽️'
          : '🛑 Meal Skipped';
        const feedbackBody = notifData.menuTitle || notifData.mealType || 'Meal';

        // Show brief replacement feedback notification
        return self.registration.showNotification(feedbackTitle, {
          body: feedbackBody,
          icon: '/icons/icon-192x192.png',
          badge: '/icons/favicon.png',
          tag: 'foodbook-status-feedback',
          data: { url: notifData.url || '/' },
        });
      })
      .then(() => {
        // Broadcast update event to any open app tabs
        return self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
          clientList.forEach((client) => {
            client.postMessage({
              type: 'FOODBOOK_BOOKING_UPDATED',
              status: status,
              menuId: notifData.menuId,
              mealType: notifData.mealType,
            });
          });
        });
      })
      .catch((err) => {
        console.error('Service worker background quick-booking failed:', err);
      });

    event.waitUntil(bgBookingPromise);
    return;
  }

  // 2. If resident clicked the notification card body -> Focus or Open window
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i];
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          if ('navigate' in client && urlToOpen) {
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
