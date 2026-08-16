'use client';

import React, { useState, useEffect } from 'react';
import { Download, Sparkles, X, Smartphone, ArrowRight, Check } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

export function InstallAppPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // Check if already in standalone PWA mode
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone ||
      document.referrer.includes('android-app://');

    if (isStandalone) {
      setIsInstalled(true);
      return;
    }

    // Check if iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if previously dismissed in this session
    const dismissed = sessionStorage.getItem('foodbook_install_dismissed');
    if (dismissed) {
      setIsDismissed(true);
    }

    // Listen for beforeinstallprompt event (Android/Chrome/Edge)
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    // Listen for appinstalled event
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // Redirect to /install instructions if native prompt isn't available (e.g. iOS)
      window.location.href = '/install';
      return;
    }

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    sessionStorage.setItem('foodbook_install_dismissed', 'true');
  };

  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        className="w-full"
      >
        <div className="p-3.5 rounded-3xl bg-gradient-to-r from-[#182a1b] via-[#1c221d] to-[#1a1a1a] border-2 border-green-500/50 shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-center justify-between gap-3">
          {/* Left info */}
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="w-10 h-10 rounded-2xl bg-green-500 flex items-center justify-center text-black font-black flex-shrink-0 shadow-[0_0_15px_rgba(34,197,94,0.4)]">
              <Smartphone className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-black text-white">Install FoodBook App</span>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                  Fast 1-Tap
                </span>
              </div>
              <p className="text-[11px] text-zinc-300 truncate">
                Add to your home screen for instant meal booking.
              </p>
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <Link
              href="/install"
              className="text-[11px] font-bold text-zinc-400 hover:text-white px-2 py-1.5 transition-colors"
            >
              How to install?
            </Link>

            <button
              type="button"
              onClick={handleInstallClick}
              className="py-2 px-3.5 rounded-xl bg-green-500 hover:bg-green-400 text-black font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>{isIOS ? 'Install Guide' : 'Install App'}</span>
            </button>

            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss install banner"
              className="p-1.5 text-zinc-400 hover:text-zinc-200 rounded-lg hover:bg-zinc-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
