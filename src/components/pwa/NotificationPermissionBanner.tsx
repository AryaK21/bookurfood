'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { registerPushNotifications } from '@/lib/push/push-client';
import { Bell, BellRing, CheckCircle2, X, Sparkles, Send } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function NotificationPermissionBanner() {
  const { user } = useAuth();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
      const isDismissed = sessionStorage.getItem('foodbook_notif_banner_dismissed');
      if (isDismissed) {
        setDismissed(true);
      }
    }
  }, []);

  const handleEnable = async () => {
    setLoading(true);
    setSuccessMsg('');

    const res = await registerPushNotifications(user?.id, user?.phone_number);
    setLoading(false);

    if (res.success) {
      setPermission('granted');
      setSuccessMsg('✓ Food alerts enabled! You will receive meal ready notifications.');
      setTimeout(() => {
        setSuccessMsg('');
      }, 5000);
    } else {
      setPermission(res.permission);
    }
  };

  const handleSendTestNotification = async () => {
    setTesting(true);
    try {
      if (typeof window !== 'undefined' && 'serviceWorker' in navigator && Notification.permission === 'granted') {
        const reg = await navigator.serviceWorker.ready;
        reg.showNotification('FoodBook Alert 🔔', {
          body: 'Kitchen notifications are active on this device!',
          icon: '/icons/icon-192x192.png',
          badge: '/icons/favicon.png',
          vibrate: [150, 50, 150],
          tag: 'foodbook-test-user-alert',
          actions: [
            { action: 'eating', title: "✅ Yes (I'll Eat)" },
            { action: 'skipping', title: '❌ No (Skip)' },
          ],
        } as any);
      }
      setSuccessMsg('✓ Test alert sent to your device!');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err: any) {
      console.error('Test alert error:', err);
    } finally {
      setTesting(false);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    sessionStorage.setItem('foodbook_notif_banner_dismissed', 'true');
  };

  if (dismissed || permission === 'denied') {
    return null;
  }

  // If already granted, show a compact test badge
  if (permission === 'granted') {
    return (
      <div className="w-full flex items-center justify-between px-3 py-1.5 rounded-2xl bg-[#181818] border border-zinc-800 text-[11px] text-zinc-400">
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-zinc-300 font-bold">Food Alerts Active 🔔</span>
        </div>
        <button
          type="button"
          onClick={handleSendTestNotification}
          disabled={testing}
          className="px-2.5 py-0.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-amber-300 font-black cursor-pointer transition-all active:scale-95 text-[10px]"
        >
          {testing ? 'Sending...' : 'Test Alert 🔔'}
        </button>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        className="w-full"
      >
        {successMsg ? (
          <div className="p-3 rounded-2xl bg-green-950/70 border border-green-800 text-xs text-green-300 font-bold flex items-center gap-2 shadow-lg">
            <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span>{successMsg}</span>
          </div>
        ) : (
          <div className="p-3.5 rounded-3xl bg-gradient-to-r from-[#201c13] via-[#1a1916] to-[#171717] border-2 border-amber-500/60 shadow-lg flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 flex-shrink-0 shadow-[0_0_12px_rgba(245,158,11,0.3)]">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-white leading-tight">
                  Enable Meal Alerts 🔔
                </p>
                <p className="text-[11px] text-zinc-400 leading-tight">
                  Get notified when food is ready in the dining hall.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleEnable}
                disabled={loading}
                className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-black text-xs cursor-pointer shadow-md transition-all active:scale-95 flex items-center gap-1"
              >
                <Bell className="w-3.5 h-3.5" />
                <span>{loading ? 'Enabling...' : 'Enable Alerts'}</span>
              </button>

              <button
                type="button"
                onClick={handleDismiss}
                aria-label="Dismiss notification prompt"
                className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
