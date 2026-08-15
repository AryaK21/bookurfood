'use client';

import React, { useState, useEffect } from 'react';
import { TactileButton } from '@/components/ui/TactileButton';
import { Bell, BellRing, CheckCircle2, Sparkles, Send } from 'lucide-react';
import { motion } from 'framer-motion';

export function PushNotificationPrompt() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [feedback, setFeedback] = useState('');

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
        return registration;
      } catch (err) {
        console.error('Service worker registration failed:', err);
      }
    }
    return null;
  };

  const handleSubscribe = async () => {
    if (!('Notification' in window)) {
      alert('This browser does not support desktop notifications');
      return;
    }

    const reg = await registerServiceWorker();
    const result = await Notification.requestPermission();
    setPermission(result);

    if (result === 'granted') {
      setIsSubscribed(true);
      setFeedback('Notifications enabled! You will be reminded daily before cutoff.');

      if (reg) {
        reg.showNotification("FoodBook Reminders Active! 🔔", {
          body: "You'll receive a daily reminder at 3:00 PM to book tonight's dinner.",
          icon: '/icons/icon-192x192.png',
        });
      }
    }
  };

  const handleSendTestPush = async () => {
    setIsSending(true);
    setFeedback('');

    if (Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification("Tap to book tonight's dinner! 🍛", {
          body: "Special Dum Biryani is on the menu! Lock in before 5:00 PM cutoff.",
          icon: '/icons/icon-192x192.png',
          badge: '/icons/favicon.png',
          vibrate: [150, 50, 150],
        } as any);
      } else {
        new Notification("Tap to book tonight's dinner! 🍛", {
          body: "Special Dum Biryani is on the menu! Lock in before 5:00 PM cutoff.",
          icon: '/icons/icon-192x192.png',
        } as any);
      }
      setFeedback('Simulated 3:00 PM push alert triggered!');
    } else {
      await handleSubscribe();
    }
    setIsSending(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-3xl p-5 bg-[#171717] border border-zinc-800/80 space-y-3.5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center border border-amber-500/30">
            <BellRing className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-black text-white">Daily Meal Reminders</h4>
            <p className="text-xs text-zinc-400">
              Get an alert at 3:00 PM: &ldquo;Tap to book tonight&apos;s dinner! 🍛&rdquo;
            </p>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="p-2.5 rounded-xl bg-green-950/40 border border-green-800/50 text-xs text-green-300 flex items-center gap-2 font-bold">
          <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2 pt-1">
        {permission !== 'granted' ? (
          <TactileButton
            variant="green"
            size="sm"
            onClick={handleSubscribe}
            leftIcon={<Bell className="w-4 h-4" />}
          >
            Enable Web Push Alerts
          </TactileButton>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-green-500/15 text-green-400 border border-green-500/30 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Push Notifications Active
          </span>
        )}

        <TactileButton
          variant="neutral"
          size="sm"
          onClick={handleSendTestPush}
          isLoading={isSending}
          leftIcon={<Send className="w-3.5 h-3.5 text-amber-400" />}
        >
          Test 3 PM Reminder
        </TactileButton>
      </div>
    </motion.div>
  );
}
