'use client';

import React, { useState, useEffect } from 'react';
import { Navbar } from '@/components/ui/Navbar';
import { TactileCard } from '@/components/ui/TactileCard';
import { TactileButton } from '@/components/ui/TactileButton';
import {
  Smartphone,
  Download,
  Share,
  PlusSquare,
  MoreVertical,
  Laptop,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Share2,
  Copy,
} from 'lucide-react';
import Link from 'next/link';

type OSType = 'ios' | 'android' | 'desktop';

export default function InstallPage() {
  const [selectedOS, setSelectedOS] = useState<OSType>('android');
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    // Detect OS
    const userAgent = window.navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setSelectedOS('ios');
    } else if (/android/.test(userAgent)) {
      setSelectedOS('android');
    } else {
      setSelectedOS('desktop');
    }

    // Check standalone
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone;

    if (isStandalone) {
      setIsInstalled(true);
    }

    // Listen for beforeinstallprompt
    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    return () => window.removeEventListener('beforeinstallprompt', handlePrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const copyGuideLink = () => {
    const url = typeof window !== 'undefined' ? window.location.href : 'https://bookurfood.vercel.app/install';
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#121212]">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-xl mx-auto w-full space-y-5">
        {/* HEADER */}
        <div className="text-center space-y-1.5">
          <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1e1e1e] border border-zinc-800 text-[11px] font-black text-green-400">
            <Sparkles className="w-3 h-3" />
            <span>PROGRESSIVE WEB APP</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Install <span className="text-green-500">FoodBook</span> on Your Device
          </h1>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto">
            Get 1-tap full-screen access to daily menus & meal bookings without opening the browser.
          </p>
        </div>

        {/* 1-CLICK NATIVE PROMPT IF AVAILABLE */}
        {isInstallable && !isInstalled && (
          <TactileCard variant="elevated" glow="green" className="p-4 sm:p-5 text-center space-y-3">
            <p className="text-xs font-black text-green-400 uppercase tracking-wider">
              Fast Install Available on this Browser
            </p>
            <TactileButton
              variant="green"
              size="lg"
              fullWidth
              onClick={handleInstallClick}
              leftIcon={<Download className="w-5 h-5" />}
            >
              Install FoodBook App Now
            </TactileButton>
          </TactileCard>
        )}

        {isInstalled && (
          <div className="p-4 rounded-3xl bg-green-950/60 border-2 border-green-500/80 text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-black text-green-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>FoodBook is already installed!</span>
            </div>
            <p className="text-[11px] text-zinc-300">
              You are running FoodBook as a standalone home-screen app.
            </p>
          </div>
        )}

        {/* OS SELECTOR TABS */}
        <div className="grid grid-cols-3 gap-2 p-1.5 rounded-2xl bg-[#181818] border border-zinc-800">
          <button
            type="button"
            onClick={() => setSelectedOS('android')}
            className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedOS === 'android'
                ? 'bg-green-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>🤖</span>
            <span>Android</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedOS('ios')}
            className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedOS === 'ios'
                ? 'bg-green-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>🍎</span>
            <span>iOS / iPhone</span>
          </button>

          <button
            type="button"
            onClick={() => setSelectedOS('desktop')}
            className={`py-2.5 px-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              selectedOS === 'desktop'
                ? 'bg-green-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <span>💻</span>
            <span>PC / Mac</span>
          </button>
        </div>

        {/* STEP-BY-STEP INSTRUCTIONS */}
        <TactileCard variant="elevated" className="p-5 sm:p-6 space-y-4">
          {/* ANDROID INSTRUCTIONS */}
          {selectedOS === 'android' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                <span className="text-xl">🤖</span>
                <div>
                  <h3 className="text-sm font-black text-white">How to Install on Android (Chrome / Brave)</h3>
                  <p className="text-[11px] text-zinc-400">Takes less than 10 seconds</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-green-500/20 text-green-400 font-black text-xs flex items-center justify-center flex-shrink-0 border border-green-500/40">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Open in Chrome or Brave</p>
                    <p className="text-[11px] text-zinc-400">
                      Open <code className="text-green-400">bookurfood.vercel.app</code> in your browser.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-green-500/20 text-green-400 font-black text-xs flex items-center justify-center flex-shrink-0 border border-green-500/40">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Tap the 3 Dots Menu (⋮)</p>
                    <p className="text-[11px] text-zinc-400">
                      Tap the menu in the top right corner of Chrome.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-green-500/20 text-green-400 font-black text-xs flex items-center justify-center flex-shrink-0 border border-green-500/40">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Tap &quot;Install app&quot; or &quot;Add to Home screen&quot;</p>
                    <p className="text-[11px] text-zinc-400">
                      Select <strong>Install</strong> to add FoodBook directly to your App Drawer & Home Screen.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* IOS INSTRUCTIONS */}
          {selectedOS === 'ios' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                <span className="text-xl">🍎</span>
                <div>
                  <h3 className="text-sm font-black text-white">How to Install on iPhone / iPad (Safari)</h3>
                  <p className="text-[11px] text-zinc-400">Apple iOS requires adding via Safari</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-green-500/20 text-green-400 font-black text-xs flex items-center justify-center flex-shrink-0 border border-green-500/40">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Open in Safari</p>
                    <p className="text-[11px] text-zinc-400">
                      Make sure you are browsing this site in <strong>Apple Safari</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-green-500/20 text-green-400 font-black text-xs flex items-center justify-center flex-shrink-0 border border-green-500/40">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Tap the Share Button (⎋)</p>
                    <p className="text-[11px] text-zinc-400">
                      Tap the blue square icon with the upward arrow at the bottom center of Safari.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-green-500/20 text-green-400 font-black text-xs flex items-center justify-center flex-shrink-0 border border-green-500/40">
                    3
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Tap &quot;Add to Home Screen&quot; (➕)</p>
                    <p className="text-[11px] text-zinc-400">
                      Scroll down the options list and tap <strong>Add to Home Screen</strong>.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-green-500/20 text-green-400 font-black text-xs flex items-center justify-center flex-shrink-0 border border-green-500/40">
                    4
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Tap &quot;Add&quot; at Top Right</p>
                    <p className="text-[11px] text-zinc-400">
                      The FoodBook icon will appear on your iPhone home screen!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* DESKTOP INSTRUCTIONS */}
          {selectedOS === 'desktop' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-zinc-800">
                <span className="text-xl">💻</span>
                <div>
                  <h3 className="text-sm font-black text-white">How to Install on PC / Mac (Chrome & Edge)</h3>
                  <p className="text-[11px] text-zinc-400">Run as a standalone desktop app</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-green-500/20 text-green-400 font-black text-xs flex items-center justify-center flex-shrink-0 border border-green-500/40">
                    1
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Look for the Install Icon in Address Bar</p>
                    <p className="text-[11px] text-zinc-400">
                      In the right side of the URL address bar, click the <strong>Install FoodBook</strong> icon.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-xl bg-green-500/20 text-green-400 font-black text-xs flex items-center justify-center flex-shrink-0 border border-green-500/40">
                    2
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white">Click &quot;Install&quot;</p>
                    <p className="text-[11px] text-zinc-400">
                      FoodBook will open in its own clean window and add a shortcut to your desktop.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SHARE INSTRUCTIONS BUTTON */}
          <div className="pt-2 border-t border-zinc-800 flex gap-2">
            <button
              type="button"
              onClick={copyGuideLink}
              className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer border border-zinc-700 transition-colors"
            >
              <Copy className="w-3.5 h-3.5 text-green-400" />
              <span>{copied ? '✓ Link Copied!' : 'Copy Guide Link'}</span>
            </button>

            <Link href="/" className="flex-1">
              <button
                type="button"
                className="w-full py-2.5 px-3 rounded-xl bg-green-500 hover:bg-green-400 text-black font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
              >
                <span>Go to FoodBook</span>
                <ArrowRight className="w-3.5 h-3.5 stroke-[2.5]" />
              </button>
            </Link>
          </div>
        </TactileCard>
      </main>

      <footer className="text-center py-4 border-t border-zinc-900 text-xs text-zinc-600 font-medium">
        FoodBook PWA Installation Guide • Compatible with iOS, Android & Desktop
      </footer>
    </div>
  );
}
