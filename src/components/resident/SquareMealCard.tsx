'use client';

import React from 'react';
import { motion } from 'framer-motion';
import type { Menu, BookingStatus, MenuItem } from '@/types/database.types';
import { MEAL_SCHEDULES } from '@/lib/data/data-store';
import { triggerMealConfetti } from '@/components/ui/Confetti';
import { Check, X, Lock } from 'lucide-react';

interface SquareMealCardProps {
  menu: Menu;
  bookingStatus: BookingStatus | 'unbooked';
  onSelectStatus: (status: BookingStatus) => Promise<void>;
  onOpenDetails: () => void;
  isLoading?: boolean;
}

export function SquareMealCard({
  menu,
  bookingStatus,
  onSelectStatus,
  onOpenDetails,
  isLoading = false,
}: SquareMealCardProps) {
  const schedule = MEAL_SCHEDULES[menu.meal_type] || MEAL_SCHEDULES.dinner;

  // Check if cutoff has passed
  const cutoffTime = new Date(menu.cutoff_time).getTime();
  const isCutoffPassed = Date.now() > cutoffTime;

  const handleAction = async (e: React.MouseEvent, status: BookingStatus) => {
    e.stopPropagation(); // Don't trigger modal popup when tapping the buttons
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

  // Classy Duolingo 3D Tactile Card Style
  const getCardStyle = () => {
    if (bookingStatus === 'eating') {
      return 'bg-[#122315] border-2 border-green-500 border-b-6 border-b-green-700 shadow-[0_6px_20px_rgba(34,197,94,0.25)]';
    }
    if (bookingStatus === 'skipping') {
      return 'bg-[#251313] border-2 border-red-500/80 border-b-6 border-b-red-800 shadow-[0_6px_20px_rgba(239,68,68,0.2)]';
    }
    return 'bg-[#181818] border-2 border-zinc-800 border-b-6 border-b-zinc-900 hover:border-zinc-700 shadow-[0_4px_16px_rgba(0,0,0,0.5)]';
  };

  const isMenuPending =
    menu.title === 'Menu not added yet' || (menu.items as MenuItem[]).length === 0;

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onOpenDetails}
      className={`
        ${getCardStyle()}
        rounded-3xl p-4 sm:p-5 flex flex-col justify-between cursor-pointer relative select-none transition-all duration-150
        min-h-[175px] sm:min-h-[190px] w-full
      `}
    >
      {/* CARD TOP: EMOJI + MEAL NAME + SERVING TIME */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-2xl sm:text-3xl">{getMealEmoji()}</span>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white capitalize leading-tight">
                {menu.meal_type}
              </h3>
              <span className="text-[11px] font-bold text-zinc-400 block">
                {menu.serving_start && menu.serving_end
                  ? `${menu.serving_start} - ${menu.serving_end}`
                  : schedule.servingTime}
              </span>
            </div>
          </div>
        </div>

        {/* CLEAN STATUS BADGE (ONLY IF CONFIRMED OR CLOSED) */}
        <div>
          {isCutoffPassed ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
              <Lock className="w-3 h-3" /> Closed
            </span>
          ) : bookingStatus === 'eating' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-green-500 text-black shadow-sm">
              <Check className="w-3.5 h-3.5 stroke-[3]" /> Eating
            </span>
          ) : bookingStatus === 'skipping' ? (
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-3 py-1 rounded-full bg-red-500 text-white shadow-sm">
              <X className="w-3.5 h-3.5 stroke-[3]" /> Skipping
            </span>
          ) : null}
        </div>
      </div>

      {/* CARD MIDDLE: CLEAN MENU DISH NAME */}
      <div className="my-2.5">
        <p
          className={`text-sm font-black line-clamp-1 ${
            isMenuPending ? 'text-zinc-400 italic' : 'text-zinc-100'
          }`}
        >
          {menu.title}
        </p>
        <p className="text-xs font-medium text-zinc-400 line-clamp-1">
          {isMenuPending
            ? 'Tap to view full details'
            : (menu.items as MenuItem[]).map((i) => i.name).slice(0, 3).join(' • ')}
        </p>
      </div>

      {/* CARD BOTTOM: LARGE SATISFYING TACTILE ACTION BUTTONS */}
      <div className="pt-1 flex items-center gap-2.5">
        {isCutoffPassed ? (
          <div className="w-full py-2 text-center text-xs font-bold text-zinc-500 bg-black/40 rounded-2xl border border-zinc-800">
            Booking closed (1 hr prior deadline)
          </div>
        ) : (
          <>
            {/* LARGE RED SKIP BUTTON */}
            <button
              type="button"
              onClick={(e) => handleAction(e, 'skipping')}
              disabled={isLoading}
              aria-label="Skip this meal"
              className={`
                flex-1 py-2.5 sm:py-3 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-black
                transition-all duration-100 select-none cursor-pointer
                ${
                  bookingStatus === 'skipping'
                    ? 'bg-red-500 text-white border-b-4 border-b-red-700 shadow-sm scale-[1.02]'
                    : 'bg-[#281616] hover:bg-red-950/80 text-red-400 border border-red-500/30 border-b-4 border-b-[#160c0c] active:border-b-0 active:translate-y-1'
                }
              `}
            >
              <X className="w-4 h-4 stroke-[3]" />
              <span>{bookingStatus === 'skipping' ? 'Skipping' : 'Skip'}</span>
            </button>

            {/* LARGE GREEN EAT BUTTON */}
            <button
              type="button"
              onClick={(e) => handleAction(e, 'eating')}
              disabled={isLoading}
              aria-label="Eat this meal"
              className={`
                flex-1 py-2.5 sm:py-3 px-3 rounded-2xl flex items-center justify-center gap-1.5 text-xs sm:text-sm font-black
                transition-all duration-100 select-none cursor-pointer
                ${
                  bookingStatus === 'eating'
                    ? 'bg-green-500 text-black border-b-4 border-b-green-700 shadow-sm scale-[1.02]'
                    : 'bg-[#162819] hover:bg-green-950/80 text-green-400 border border-green-500/30 border-b-4 border-b-[#0c160e] active:border-b-0 active:translate-y-1'
                }
              `}
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{bookingStatus === 'eating' ? 'Eating' : 'Eat'}</span>
            </button>
          </>
        )}
      </div>
    </motion.div>
  );
}
