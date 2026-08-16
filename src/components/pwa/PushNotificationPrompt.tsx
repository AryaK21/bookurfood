'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import type { MealType } from '@/types/database.types';
import {
  Bell,
  BellRing,
  CheckCircle2,
  Send,
  Coffee,
  Sun,
  Moon,
  Zap,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function PushNotificationPrompt() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSending, setIsSending] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      if (Notification.permission === 'granted') {
        setIsSubscribed(true);
      }
    }
  }, []);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw-push.js');
        await navigator.serviceWorker.ready;
        return registration;
      } catch (err) {
        console.error('Service worker registration failed:', err);
      }
    }
    return null;
  };

  const handleSubscribe = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop/mobile notifications.');
      return;
    }

    const reg = await registerServiceWorker();
    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      setIsSubscribed(true);
      setFeedback('1-Tap Notifications enabled! Tap ✅ or ❌ directly inside alerts.');

      if (reg) {
        reg.showNotification("FoodBook 1-Tap Reminders Active! 🔔", {
          body: "You'll receive 1-tap alerts before Breakfast (7:00 AM), Lunch (11:30 AM), and Dinner (6:30 PM) deadlines.",
          icon: '/icons/icon-192x192.png',
          badge: '/icons/favicon.png',
        });
      }
    }
  };

  // Dispatch simulated push notification with 1-tap ✅ and ❌ buttons
  const handleSendTestPush = async (meal: MealType) => {
    setIsSending(meal);
    setFeedback('');

    const mealConfig = {
      breakfast: {
        title: "Breakfast 🍳",
        body: "South Indian Idli & Vada",
        menuTitle: "Idli & Vada",
      },
      lunch: {
        title: "Lunch 🍛",
        body: "North Indian Veg Thali",
        menuTitle: "Veg Thali",
      },
      dinner: {
        title: "Dinner 🍲",
        body: "Special Dum Biryani Feast",
        menuTitle: "Dum Biryani",
      },
    }[meal];

    if (Notification.permission === 'granted') {
      try {
        const reg = await registerServiceWorker();
        if (reg) {
          await reg.showNotification(mealConfig.title, {
            body: mealConfig.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/favicon.png',
            vibrate: [150, 50, 150],
            tag: `foodbook-test-${meal}`,
            renotify: true,
            data: {
              url: `/?meal=${meal}`,
              mealType: meal,
              profileId: user?.id,
              phone: user?.phone_number,
              menuTitle: mealConfig.menuTitle,
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
          } as any);

          setFeedback(
            `Simulated ${meal.toUpperCase()} alert sent! Check your notification tray to tap ✅ or ❌.`
          );
        }
      } catch (err: any) {
        console.error('Test notification trigger error:', err);
        setFeedback('Failed to deliver test notification: ' + err.message);
      }
    } else {
      await handleSubscribe();
    }
    setIsSending(null);
  };

  return (
    <div className="rounded-2xl p-3.5 bg-[#171717] border border-zinc-800 space-y-2.5 text-xs">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30 flex-shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-black text-white">1-Tap Notification Alerts</span>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.2 rounded bg-green-500/20 text-green-300">
                Zero-Friction
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Confirm with <span className="text-green-400 font-bold">✅ Yes</span> or <span className="text-red-400 font-bold">❌ No</span> directly in alerts
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {permission !== 'granted' ? (
            <button
              type="button"
              onClick={handleSubscribe}
              className="px-3 py-1.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-black text-xs border-b-2 border-b-green-700 cursor-pointer"
            >
              Enable
            </button>
          ) : (
            <span className="px-2.5 py-1 rounded-xl bg-green-950/60 border border-green-800 text-green-300 font-bold text-[11px] flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-green-400" />
              <span>Active</span>
            </span>
          )}
        </div>
      </div>

      {feedback && (
        <div className="p-2 rounded-xl bg-green-950/40 border border-green-800/50 text-[11px] text-green-300 flex items-center gap-1.5 font-bold">
          <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}
    </div>
  );
}
