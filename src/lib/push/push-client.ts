// Web Push Client Utilities for FoodBook

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerPushNotifications(profileId?: string, phone?: string): Promise<{
  success: boolean;
  permission: NotificationPermission;
  error?: string;
}> {
  if (typeof window === 'undefined') {
    return { success: false, permission: 'default', error: 'Window not available' };
  }

  if (!('Notification' in window) || !('serviceWorker' in navigator)) {
    return {
      success: false,
      permission: 'denied',
      error: 'This browser or device does not support Web Push notifications.',
    };
  }

  try {
    // 1. Request Permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { success: false, permission, error: 'Notification permission was denied or dismissed.' };
    }

    // 2. Register Service Worker with push capability
    const registration = await navigator.serviceWorker.register('/sw-push.js');
    await navigator.serviceWorker.ready;

    // 3. Subscribe to Web Push Manager
    const vapidKey =
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ||
      'BNG537UsV9LSw6rsxzYHNX4gzkSA4HEZOBgXS6z12R_wlbXtUW6rtCp2l9Vxr43egBUsDXYkobb8ttizRU8SqaA';

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
      const convertedVapidKey = urlBase64ToUint8Array(vapidKey);
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });
    }

    // 4. Save Subscription to Database via API
    if (subscription) {
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'subscribe',
          subscription,
          profileId,
          phone,
        }),
      });
    }

    // 5. Trigger Welcome Confirmation Notification
    registration.showNotification('FoodBook Alerts Active 🔔', {
      body: 'You will receive 1-tap alerts when food is ready and before meal deadlines!',
      icon: '/icons/icon-192x192.png',
      badge: '/icons/favicon.png',
      vibrate: [150, 50, 150],
      tag: 'foodbook-welcome',
    } as any);

    return { success: true, permission: 'granted' };
  } catch (err: any) {
    console.error('Push notification registration failed:', err);
    return {
      success: false,
      permission: Notification.permission,
      error: err.message || 'Failed to subscribe to push notifications.',
    };
  }
}
