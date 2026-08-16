'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';
import { DataStore, MEAL_SCHEDULES, isSupabaseConfigured } from '@/lib/data/data-store';
import type { Menu, Booking, BookingStatus, MenuItem, MealType } from '@/types/database.types';
import { triggerMealConfetti } from '@/components/ui/Confetti';
import {
  Check,
  X,
  Clock,
  Coffee,
  Sun,
  Moon,
  Lock,
  Flame,
  CheckCircle2,
  XCircle,
  UtensilsCrossed,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function ResidentMealView() {
  const { user } = useAuth();
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');
  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [menus, setMenus] = useState<Menu[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load menus & bookings
  const refreshData = async () => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: dbMenus } = await supabase.from('menus').select('*');
        if (dbMenus && dbMenus.length > 0) {
          DataStore.saveMenus(dbMenus as Menu[]);
          setMenus(dbMenus as Menu[]);
        }
        const { data: dbBookings } = await supabase.from('bookings').select('*');
        if (dbBookings) {
          DataStore.saveBookings(dbBookings as Booking[]);
          setBookings(dbBookings as Booking[]);
        }
      } catch (err) {
        console.error('Live sync error:', err);
      }
    }
    const loadedMenus = DataStore.getMenus();
    setMenus(loadedMenus);
    const loadedBookings = DataStore.getBookings();
    setBookings(loadedBookings);
  };

  useEffect(() => {
    refreshData();
  }, [user]);

  // Listen to Service Worker background updates
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

    const handleSwMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'FOODBOOK_BOOKING_UPDATED') {
        refreshData();
      }
    };

    navigator.serviceWorker.addEventListener('message', handleSwMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', handleSwMessage);
    };
  }, []);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const targetDateStr = selectedDay === 'today' ? todayStr : tomorrowStr;
  const mealsForSelectedDay = DataStore.getMealsForDate(targetDateStr);

  // Current active menu based on selectedMealType
  const activeMenu =
    mealsForSelectedDay.find((m) => m.meal_type === selectedMealType) ||
    mealsForSelectedDay[0];

  const activeSchedule = MEAL_SCHEDULES[selectedMealType] || MEAL_SCHEDULES.dinner;

  // Active menu booking status for logged-in user (matches direct ID or slot)
  const activeBooking =
    user && activeMenu
      ? bookings.find(
          (b) =>
            b.profile_id === user.id &&
            (b.menu_id === activeMenu.id ||
              menus.some(
                (m) =>
                  m.id === b.menu_id &&
                  m.date === targetDateStr &&
                  m.meal_type === selectedMealType
              ))
        )
      : undefined;

  const currentStatus: BookingStatus | 'unbooked' = activeBooking
    ? activeBooking.status
    : 'unbooked';

  // Check if cutoff has passed for active meal
  const cutoffTime = activeMenu ? new Date(activeMenu.cutoff_time).getTime() : 0;
  const isCutoffPassed = Date.now() > cutoffTime;

  // Handle booking toggle
  const handleSelectStatus = async (status: BookingStatus) => {
    if (!user || !activeMenu || isCutoffPassed || isLoading) return;

    setIsLoading(true);
    try {
      if (status === 'eating') {
        triggerMealConfetti();
      }
      await DataStore.toggleBooking(activeMenu.id, user.id, status);
      await refreshData();
    } catch (err: any) {
      console.error('Failed to update booking:', err);
      alert(err.message || 'Failed to update booking');
    } finally {
      setIsLoading(false);
    }
  };

  const isMenuPending =
    !activeMenu ||
    activeMenu.title === 'Menu not added yet' ||
    (activeMenu.items as MenuItem[]).length === 0;

  return (
    <div className="w-full max-w-md mx-auto space-y-3.5">
      {/* 1. TOP BAR: HEADER + TODAY / TOMORROW TOGGLE */}
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Book Food
        </h2>

        {/* DAY TOGGLE (TODAY vs TOMORROW) */}
        <div className="p-1 rounded-2xl bg-[#181818] border border-zinc-800 flex items-center gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setSelectedDay('today')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              selectedDay === 'today'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => setSelectedDay('tomorrow')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
              selectedDay === 'tomorrow'
                ? 'bg-amber-500 text-black shadow-sm'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tomorrow
          </button>
        </div>
      </div>

      {/* 2. THREE BIG MEAL SELECTOR CARDS (EXACTLY LIKE ADMIN) */}
      <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
        {(['breakfast', 'lunch', 'dinner'] as MealType[]).map((mealType) => {
          const mealMenu = mealsForSelectedDay.find((m) => m.meal_type === mealType);
          const mealBooking =
            user && mealMenu
              ? bookings.find(
                  (b) => b.menu_id === mealMenu.id && b.profile_id === user.id
                )
              : undefined;
          const status = mealBooking ? mealBooking.status : 'unbooked';

          const isSelected = selectedMealType === mealType;
          const schedule = MEAL_SCHEDULES[mealType];

          const emoji = mealType === 'breakfast' ? '🍳' : mealType === 'lunch' ? '🍛' : '🍲';

          // Selection styling
          let activeStyles = 'bg-[#181818] text-zinc-300 border-2 border-zinc-800 border-b-6 border-b-zinc-900 hover:border-zinc-700';

          if (isSelected) {
            if (mealType === 'breakfast') {
              activeStyles = 'bg-amber-500 text-black border-2 border-amber-400 border-b-6 border-b-amber-700 scale-[1.03] shadow-[0_6px_20px_rgba(245,158,11,0.35)]';
            } else if (mealType === 'lunch') {
              activeStyles = 'bg-orange-500 text-black border-2 border-orange-400 border-b-6 border-b-orange-700 scale-[1.03] shadow-[0_6px_20px_rgba(249,115,22,0.35)]';
            } else {
              activeStyles = 'bg-green-500 text-black border-2 border-green-400 border-b-6 border-b-green-700 scale-[1.03] shadow-[0_6px_20px_rgba(34,197,94,0.35)]';
            }
          }

          return (
            <button
              key={mealType}
              type="button"
              onClick={() => setSelectedMealType(mealType)}
              className={`
                ${activeStyles}
                p-3 sm:p-3.5 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all select-none cursor-pointer relative
              `}
            >
              {/* BOOKING STATUS DOT ON TOP CORNER */}
              {status === 'eating' && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-green-400 ring-2 ring-black" />
              )}
              {status === 'skipping' && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-red-500 ring-2 ring-black" />
              )}

              <span className="text-2xl sm:text-3xl">{emoji}</span>
              <span className="text-xs sm:text-sm font-black capitalize">{mealType}</span>
              <span
                className={`text-[10px] font-bold ${
                  isSelected ? 'text-black/80 font-black' : 'text-zinc-500'
                }`}
              >
                {schedule.servingTime}
              </span>
            </button>
          );
        })}
      </div>

      {/* 3. ACTIVE MEAL DETAIL & CONFIRMATION CARD (MINIMAL & CLEAN) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${selectedDay}-${selectedMealType}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.15 }}
          className="p-4 sm:p-5 rounded-3xl bg-[#181818] border-2 border-zinc-700/80 border-b-6 border-b-zinc-900 space-y-4 shadow-xl"
        >
          {/* MEAL TITLE & CUTOFF */}
          <div className="flex items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
            <h3 className="text-base sm:text-lg font-black text-white leading-tight">
              {activeMenu?.title || 'Menu not added yet'}
            </h3>

            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-400 border border-zinc-700 flex-shrink-0">
              <Clock className="w-3 h-3 text-amber-400" />
              Cutoff{' '}
              {activeMenu
                ? new Date(activeMenu.cutoff_time).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })
                : activeSchedule.cutoffTime}
            </span>
          </div>

          {/* DISHES LIST */}
          <div>
            {!isMenuPending && activeMenu && (activeMenu.items as MenuItem[]).length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {(activeMenu.items as MenuItem[]).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center gap-2 p-2.5 rounded-2xl bg-[#121212] border border-zinc-800 text-xs font-bold text-zinc-200"
                  >
                    <span
                      className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        item.is_veg === false ? 'bg-red-500' : 'bg-green-500'
                      }`}
                    />
                    <span className="truncate">{item.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-3 px-4 rounded-2xl bg-[#121212] border border-zinc-800 text-center">
                <p className="text-xs font-bold text-zinc-400">
                  👨‍🍳 Menu items updating from kitchen • Plate booking is open
                </p>
              </div>
            )}
          </div>

          {/* 3D TACTILE CONFIRMATION BUTTONS */}
          <div className="pt-1">
            {isCutoffPassed ? (
              <div className="py-2.5 px-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-xs font-bold text-zinc-500">
                🔒 Booking deadline passed for this meal
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {/* RED SKIP BUTTON */}
                <button
                  type="button"
                  onClick={() => handleSelectStatus('skipping')}
                  disabled={isLoading}
                  className={`
                    py-3 sm:py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5
                    transition-all select-none cursor-pointer
                    ${
                      currentStatus === 'skipping'
                        ? 'bg-red-500 text-white border-b-4 border-b-red-700 shadow-md scale-[1.02]'
                        : 'bg-[#2a1b1b] hover:bg-red-950/90 text-red-400 border border-red-500/40 border-b-4 border-b-[#190f0f] active:border-b-0 active:translate-y-1'
                    }
                  `}
                >
                  <X className="w-4 h-4 stroke-[3]" />
                  <span>{currentStatus === 'skipping' ? 'Skipping' : 'Skip'}</span>
                </button>

                {/* GREEN EAT BUTTON */}
                <button
                  type="button"
                  onClick={() => handleSelectStatus('eating')}
                  disabled={isLoading}
                  className={`
                    py-3 sm:py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5
                    transition-all select-none cursor-pointer
                    ${
                      currentStatus === 'eating'
                        ? 'bg-green-500 text-black border-b-4 border-b-green-700 shadow-md scale-[1.02]'
                        : 'bg-[#1b2a1e] hover:bg-green-950/90 text-green-400 border border-green-500/40 border-b-4 border-b-[#0f1910] active:border-b-0 active:translate-y-1'
                    }
                  `}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{currentStatus === 'eating' ? 'Eating' : 'Eat'}</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
