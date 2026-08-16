'use client';

import { useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DataStore, MEAL_SCHEDULES } from '@/lib/data/data-store';
import type { MealType } from '@/types/database.types';

export function AutoMealNotifier() {
  const { user } = useAuth();

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    const checkMealDeadlines = async () => {
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const todayStr = now.toISOString().split('T')[0];

      const meals: { type: MealType; h: number; m: number; title: string }[] = [
        { type: 'breakfast', h: 7, m: 0, title: 'Breakfast 🍳' },
        { type: 'lunch', h: 11, m: 30, title: 'Lunch 🍛' },
        { type: 'dinner', h: 18, m: 30, title: 'Dinner 🍲' },
      ];

      for (const meal of meals) {
        // Check if within 5 minute window of schedule
        const diffMinutes = Math.abs(currentHour * 60 + currentMinute - (meal.h * 60 + meal.m));
        if (diffMinutes <= 3) {
          const storageKey = `foodbook_autonotif_${todayStr}_${meal.type}`;
          const alreadyNotified = localStorage.getItem(storageKey);

          if (!alreadyNotified) {
            localStorage.setItem(storageKey, 'true');

            // Fetch today's menu
            const todaysMenus = DataStore.getMealsForDate(todayStr);
            const targetMenu = todaysMenus.find((m) => m.meal_type === meal.type);
            const bodyText =
              targetMenu?.title && targetMenu.title !== 'Menu not added yet'
                ? targetMenu.title
                : 'Food is ready in the dining hall! Confirm your plate.';

            if ('serviceWorker' in navigator) {
              const reg = await navigator.serviceWorker.ready;
              reg.showNotification(meal.title, {
                body: bodyText,
                icon: '/icons/icon-192x192.png',
                badge: '/icons/favicon.png',
                vibrate: [150, 50, 150],
                tag: `foodbook-auto-${meal.type}-${todayStr}`,
                actions: [
                  { action: 'eating', title: "✅ Yes (I'll Eat)" },
                  { action: 'skipping', title: '❌ No (Skip)' },
                ],
                data: {
                  url: `/?meal=${meal.type}`,
                  mealType: meal.type,
                  profileId: user?.id,
                },
              } as any);
            }
          }
        }
      }
    };

    // Check immediately and then every 60 seconds
    checkMealDeadlines();
    const interval = setInterval(checkMealDeadlines, 60000);
    return () => clearInterval(interval);
  }, [user]);

  return null;
}
