'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Menu, BookingStatus, MenuItem } from '@/types/database.types';
import { MEAL_SCHEDULES } from '@/lib/data/data-store';
import { triggerMealConfetti } from '@/components/ui/Confetti';
import {
  X,
  Check,
  Clock,
  Flame,
  UtensilsCrossed,
  Sparkles,
  Lock,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

interface MealDetailModalProps {
  menu: Menu | null;
  isOpen: boolean;
  onClose: () => void;
  bookingStatus: BookingStatus | 'unbooked';
  onSelectStatus: (status: BookingStatus) => Promise<void>;
  isLoading?: boolean;
}

export function MealDetailModal({
  menu,
  isOpen,
  onClose,
  bookingStatus,
  onSelectStatus,
  isLoading = false,
}: MealDetailModalProps) {
  if (!isOpen || !menu) return null;

  const schedule = MEAL_SCHEDULES[menu.meal_type] || MEAL_SCHEDULES.dinner;
  const cutoffTime = new Date(menu.cutoff_time).getTime();
  const isCutoffPassed = Date.now() > cutoffTime;

  const handleAction = async (status: BookingStatus) => {
    if (isCutoffPassed || isLoading) return;

    if (status === 'eating') {
      triggerMealConfetti();
    }
    await onSelectStatus(status);
  };

  const getMealEmoji = () => {
    switch (menu.meal_type) {
      case 'breakfast':
        return '🍳';
      case 'lunch':
        return '🍛';
      case 'dinner':
      default:
        return '🍲';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        {/* BACKDROP TAP TO CLOSE */}
        <div className="absolute inset-0" onClick={onClose} />

        {/* MODAL CARD */}
        <motion.div
          initial={{ opacity: 0, scale: 0.92, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.92, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="relative w-full max-w-lg rounded-[2.5rem] bg-[#1a1a1a] border-2 border-zinc-700 border-b-[8px] border-b-zinc-900 p-6 sm:p-7 shadow-2xl space-y-5 z-10 max-h-[90vh] overflow-y-auto"
        >
          {/* HEADER ROW */}
          <div className="flex items-start justify-between gap-3 border-b border-zinc-800 pb-3.5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getMealEmoji()}</span>
                <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/15 px-2.5 py-0.5 rounded-full border border-amber-500/30">
                  {menu.meal_type} Menu
                </span>
                <span className="text-xs text-zinc-400 font-bold">
                  {new Date(menu.date).toLocaleDateString(undefined, {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric',
                  })}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {menu.title}
              </h2>
            </div>

            {/* CLOSE BUTTON */}
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer border border-zinc-700"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
          </div>

          {/* SERVING & CUTOFF META PILL */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-xs">
            <div className="flex items-center gap-1.5 text-zinc-300 font-bold">
              <span>Serving:</span>
              <span className="text-white font-black bg-zinc-800 px-2 py-0.5 rounded-md">
                {menu.serving_start && menu.serving_end
                  ? `${menu.serving_start} - ${menu.serving_end}`
                  : schedule.servingTime}
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-amber-400 font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Cutoff:{' '}
                {new Date(menu.cutoff_time).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </span>
            </div>
          </div>

          {/* FULL MENU ITEMS SPREAD */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-400">
              <span className="flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-orange-500" />
                Included Dishes
              </span>
              <span className="text-[10px] text-zinc-500 font-bold lowercase">
                {(menu.items as MenuItem[]).length > 0
                  ? `${(menu.items as MenuItem[]).length} items`
                  : 'menu updating'}
              </span>
            </div>

            {(menu.items as MenuItem[]).length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(menu.items as MenuItem[]).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#141414] border border-zinc-800"
                  >
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 flex items-center justify-center border border-zinc-700">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.is_veg === false ? 'bg-red-500' : 'bg-green-500'
                        }`}
                      />
                    </div>
                    <span className="text-xs sm:text-sm font-bold text-zinc-200 truncate">
                      {item.name}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#141414] border border-zinc-800 text-center space-y-1.5">
                <p className="text-sm font-black text-amber-300">
                  👨‍🍳 Menu details updating from kitchen
                </p>
                <p className="text-xs text-zinc-400">
                  The admin hasn&apos;t entered the exact dishes for this meal yet, but plate booking is open! Lock in your choice below so your plate is counted.
                </p>
              </div>
            )}

            {menu.notes && (
              <p className="text-xs text-zinc-400 italic pt-1 text-center">
                &ldquo;{menu.notes}&rdquo;
              </p>
            )}
          </div>

          {/* STATUS CONFIRMATION BANNER */}
          <div>
            {bookingStatus === 'eating' ? (
              <div className="p-3.5 rounded-2xl bg-green-950/60 border-2 border-green-500/50 flex items-center justify-between gap-2 shadow-[0_0_15px_rgba(34,197,94,0.15)]">
                <div className="flex items-center gap-2 text-green-400 font-black text-xs sm:text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-400 stroke-[2.5]" />
                  <span>YOU ARE BOOKED TO EAT! 🍽️</span>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase bg-zinc-900 px-2 py-0.5 rounded-md">
                  Confirmed
                </span>
              </div>
            ) : bookingStatus === 'skipping' ? (
              <div className="p-3.5 rounded-2xl bg-red-950/60 border-2 border-red-500/50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-red-400 font-black text-xs sm:text-sm">
                  <XCircle className="w-4 h-4 text-red-400 stroke-[2.5]" />
                  <span>YOU ARE SKIPPING THIS MEAL 🛑</span>
                </div>
                <span className="text-[10px] font-bold text-zinc-400 uppercase bg-zinc-900 px-2 py-0.5 rounded-md">
                  Absent
                </span>
              </div>
            ) : (
              <div className="p-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-xs text-zinc-400 font-bold">
                Lock in your meal preference below before the 1-hour cutoff.
              </div>
            )}
          </div>

          {/* DUOLINGO 3D TACTILE ACTION BUTTONS */}
          <div className="pt-1">
            {isCutoffPassed ? (
              <div className="p-3.5 rounded-2xl bg-zinc-900 border border-zinc-800 text-center text-xs font-bold text-zinc-500">
                🔒 Booking is closed for this meal.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {/* MASSIVE RED SKIPPING BUTTON */}
                <button
                  type="button"
                  onClick={() => handleAction('skipping')}
                  disabled={isLoading}
                  className={`
                    py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2
                    transition-all select-none cursor-pointer
                    ${
                      bookingStatus === 'skipping'
                        ? 'bg-red-500 text-white border-b-4 border-b-red-700 shadow-md scale-[1.02]'
                        : 'bg-[#2a1b1b] hover:bg-red-950/90 text-red-400 border border-red-500/40 border-b-4 border-b-[#190f0f] active:border-b-0 active:translate-y-1'
                    }
                  `}
                >
                  <X className="w-4 h-4 stroke-[3]" />
                  <span>{bookingStatus === 'skipping' ? '✓ SKIPPING' : 'SKIP MEAL'}</span>
                </button>

                {/* MASSIVE GREEN EATING BUTTON */}
                <button
                  type="button"
                  onClick={() => handleAction('eating')}
                  disabled={isLoading}
                  className={`
                    py-3.5 px-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2
                    transition-all select-none cursor-pointer
                    ${
                      bookingStatus === 'eating'
                        ? 'bg-green-500 text-black border-b-4 border-b-green-700 shadow-md scale-[1.02]'
                        : 'bg-[#1b2a1e] hover:bg-green-950/90 text-green-400 border border-green-500/40 border-b-4 border-b-[#0f1910] active:border-b-0 active:translate-y-1'
                    }
                  `}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{bookingStatus === 'eating' ? "✓ I'M EATING" : "I'LL EAT"}</span>
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
