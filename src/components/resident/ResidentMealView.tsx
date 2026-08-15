'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DataStore } from '@/lib/data/data-store';
import type { Menu, Booking, BookingStatus, MenuItem } from '@/types/database.types';
import { TactileButton } from '@/components/ui/TactileButton';
import { TactileCard } from '@/components/ui/TactileCard';
import { Badge } from '@/components/ui/Badge';
import { triggerMealConfetti } from '@/components/ui/Confetti';
import { 
  UtensilsCrossed, 
  Check, 
  X, 
  Clock, 
  AlertTriangle, 
  Sparkles, 
  Flame, 
  Sun, 
  Moon, 
  CheckCircle2, 
  XCircle,
  HelpCircle,
  Bell,
  RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ResidentMealView() {
  const { user } = useAuth();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<'lunch' | 'dinner'>('dinner');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isToggling, setIsToggling] = useState(false);
  const [timeRemainingText, setTimeRemainingText] = useState<string>('');
  const [isCutoffPassed, setIsCutoffPassed] = useState(false);

  // Load active menus and user booking status
  const refreshData = () => {
    const loadedMenus = DataStore.getMenus();
    setMenus(loadedMenus);
    const loadedBookings = DataStore.getBookings();
    setBookings(loadedBookings);
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  // Select current active menu based on mealType
  const currentMenu = menus.find((m) => m.meal_type === selectedMealType) || menus[0];

  // Get current user's booking for this menu
  const userBooking = user && currentMenu
    ? bookings.find((b) => b.menu_id === currentMenu.id && b.profile_id === user.id)
    : undefined;

  const currentStatus: BookingStatus | 'unbooked' = userBooking ? userBooking.status : 'unbooked';

  // Calculate cutoff time countdown
  useEffect(() => {
    if (!currentMenu) return;

    const checkCutoff = () => {
      const cutoff = new Date(currentMenu.cutoff_time).getTime();
      const now = new Date().getTime();
      const diff = cutoff - now;

      if (diff <= 0) {
        setIsCutoffPassed(true);
        const cutoffDate = new Date(currentMenu.cutoff_time);
        const formattedTime = cutoffDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setTimeRemainingText(`Cutoff passed (${formattedTime})`);
      } else {
        setIsCutoffPassed(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        if (hours > 0) {
          setTimeRemainingText(`Closes in ${hours}h ${minutes}m`);
        } else {
          setTimeRemainingText(`Closes in ${minutes} mins!`);
        }
      }
    };

    checkCutoff();
    const interval = setInterval(checkCutoff, 30000);
    return () => clearInterval(interval);
  }, [currentMenu]);

  // Handle Attendance Toggle
  const handleToggle = async (status: BookingStatus) => {
    if (!user || !currentMenu || isCutoffPassed || isToggling) return;

    setIsToggling(true);
    try {
      await DataStore.toggleBooking(currentMenu.id, user.id, status);
      refreshData();

      if (status === 'eating') {
        triggerMealConfetti();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update meal booking');
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <div className="w-full max-w-xl mx-auto space-y-6 pb-12">
      {/* MEAL SWITCHER (LUNCH vs DINNER PILLS) */}
      <div className="flex items-center justify-center">
        <div className="p-1.5 rounded-full bg-[#181818] border border-zinc-800/90 flex items-center gap-1.5 shadow-inner">
          <button
            onClick={() => setSelectedMealType('lunch')}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all select-none
              ${selectedMealType === 'lunch'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_2px_12px_rgba(245,158,11,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200'
              }
            `}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Today&apos;s Lunch</span>
          </button>

          <button
            onClick={() => setSelectedMealType('dinner')}
            className={`
              flex items-center gap-2 px-5 py-2.5 rounded-full text-xs font-black transition-all select-none
              ${selectedMealType === 'dinner'
                ? 'bg-[#22c55e]/20 text-[#4ade80] border border-[#22c55e]/40 shadow-[0_2px_12px_rgba(34,197,94,0.25)]'
                : 'text-zinc-400 hover:text-zinc-200'
              }
            `}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Tonight&apos;s Dinner</span>
          </button>
        </div>
      </div>

      {/* HERO MENU CARD */}
      {currentMenu ? (
        <TactileCard
          variant="elevated"
          glow={currentStatus === 'eating' ? 'green' : 'none'}
          className="p-6 sm:p-8 space-y-6 relative border-t border-zinc-700/40"
        >
          {/* Header & Cutoff Tag */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge
                  variant={selectedMealType === 'dinner' ? 'green' : 'orange'}
                  size="sm"
                  icon={selectedMealType === 'dinner' ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
                >
                  {selectedMealType.toUpperCase()} SPECIAL
                </Badge>
                <span className="text-xs text-zinc-400 font-bold">
                  {new Date(currentMenu.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {currentMenu.title}
              </h2>
            </div>

            {/* Cutoff Status Badge */}
            <div className={`
              inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold self-start sm:self-auto
              ${isCutoffPassed 
                ? 'bg-red-950/40 text-red-400 border border-red-800/60' 
                : 'bg-zinc-800 text-amber-300 border border-amber-500/30 animate-pulse-subtle'
              }
            `}>
              <Clock className="w-3.5 h-3.5" />
              <span>{timeRemainingText}</span>
            </div>
          </div>

          {/* APPETIZING MENU ITEMS LIST */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                What&apos;s Cooking
              </span>
              <span className="text-[11px] text-zinc-500 font-medium">All items included</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(currentMenu.items as MenuItem[]).map((item, idx) => (
                <motion.div
                  key={item.id || idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-3 p-3.5 rounded-2xl bg-[#171717] border border-zinc-800/80 hover:border-zinc-700 transition-colors"
                >
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 flex items-center justify-center border border-zinc-700">
                    <span className={`w-1.5 h-1.5 rounded-full ${item.is_veg === false ? 'bg-red-500' : 'bg-green-500'}`} />
                  </div>
                  <span className="text-sm font-bold text-zinc-200">{item.name}</span>
                </motion.div>
              ))}
            </div>

            {currentMenu.notes && (
              <p className="text-xs text-zinc-400 italic pt-1 text-center">
                &ldquo;{currentMenu.notes}&rdquo;
              </p>
            )}
          </div>

          {/* CURRENT BOOKING STATUS FEEDBACK BANNER */}
          <div className="pt-2">
            <AnimatePresence mode="wait">
              {currentStatus === 'eating' && (
                <motion.div
                  key="status-eating"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-2xl bg-gradient-to-r from-green-950/70 to-emerald-950/50 border-2 border-green-500/40 text-center space-y-1 shadow-[0_4px_20px_rgba(34,197,94,0.15)]"
                >
                  <div className="inline-flex items-center gap-2 text-green-400 font-black text-base">
                    <CheckCircle2 className="w-5 h-5 fill-green-500 text-black stroke-[2.5]" />
                    <span>YOU ARE BOOKED TO EAT! 🍛</span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Your plate is confirmed with the kitchen. Enjoy your hot meal!
                  </p>
                </motion.div>
              )}

              {currentStatus === 'skipping' && (
                <motion.div
                  key="status-skipping"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="p-4 rounded-2xl bg-gradient-to-r from-red-950/60 to-orange-950/40 border-2 border-red-500/40 text-center space-y-1"
                >
                  <div className="inline-flex items-center gap-2 text-red-400 font-black text-base">
                    <XCircle className="w-5 h-5 fill-red-500 text-black stroke-[2.5]" />
                    <span>YOU ARE SKIPPING THIS MEAL 🛑</span>
                  </div>
                  <p className="text-xs text-zinc-300">
                    Marked absent. No food will be prepared for you.
                  </p>
                </motion.div>
              )}

              {currentStatus === 'unbooked' && (
                <motion.div
                  key="status-unbooked"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="p-3.5 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center text-xs text-zinc-400 font-medium"
                >
                  Please choose your meal preference before the cutoff time.
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* MASSIVE TACTILE TOGGLE SWITCH (EATING vs SKIPPING) */}
          <div className="pt-2 space-y-3">
            {isCutoffPassed ? (
              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center space-y-1">
                <p className="text-sm font-bold text-zinc-300 flex items-center justify-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                  Booking Closed for this Meal
                </p>
                <p className="text-xs text-zinc-500">
                  Cutoff deadline has passed. Contact the kitchen manager for emergency changes.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* MASSIVE GREEN EATING BUTTON */}
                <TactileButton
                  variant="green"
                  size="massive"
                  fullWidth
                  onClick={() => handleToggle('eating')}
                  isLoading={isToggling && currentStatus !== 'eating'}
                  className={currentStatus === 'eating' ? 'ring-4 ring-green-400/50 scale-[1.02]' : ''}
                  leftIcon={<UtensilsCrossed className="w-6 h-6 stroke-[2.8]" />}
                >
                  {currentStatus === 'eating' ? "✓ I'M EATING" : "I'LL EAT"}
                </TactileButton>

                {/* MASSIVE RED/ORANGE SKIPPING BUTTON */}
                <TactileButton
                  variant={currentStatus === 'skipping' ? 'red' : 'neutral'}
                  size="massive"
                  fullWidth
                  onClick={() => handleToggle('skipping')}
                  isLoading={isToggling && currentStatus !== 'skipping'}
                  className={currentStatus === 'skipping' ? 'ring-4 ring-red-400/50 scale-[1.02]' : ''}
                  leftIcon={<X className="w-6 h-6 stroke-[2.8]" />}
                >
                  {currentStatus === 'skipping' ? "✓ SKIPPING" : "SKIPPING"}
                </TactileButton>
              </div>
            )}

            {!isCutoffPassed && (
              <p className="text-[11px] text-zinc-400 text-center font-medium">
                ⚡ Tap either button to lock in your attendance. You can change your choice anytime before cutoff.
              </p>
            )}
          </div>
        </TactileCard>
      ) : (
        <TactileCard className="p-8 text-center text-zinc-400">
          <p>No published menu found for this meal.</p>
        </TactileCard>
      )}
    </div>
  );
}
