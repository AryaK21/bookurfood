'use client';

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import type { Menu, BookingStatus, MenuItem, MealType } from '@/types/database.types';
import { MEAL_SCHEDULES } from '@/lib/data/data-store';
import { triggerMealConfetti } from '@/components/ui/Confetti';
import { Badge } from '@/components/ui/Badge';
import {
  Check,
  X,
  UtensilsCrossed,
  Clock,
  Flame,
  Sun,
  SunMedium,
  Moon,
  CheckCircle2,
  XCircle,
  Coffee,
  Sparkles,
  Lock,
  RotateCcw,
  Calendar,
  AlertTriangle,
} from 'lucide-react';

interface TinderMealCardProps {
  menu: Menu;
  bookingStatus: BookingStatus | 'unbooked';
  onSelectStatus: (status: BookingStatus) => Promise<void>;
  isLoading?: boolean;
  isToday?: boolean;
}

export function TinderMealCard({
  menu,
  bookingStatus,
  onSelectStatus,
  isLoading = false,
  isToday = true,
}: TinderMealCardProps) {
  const [timeRemainingText, setTimeRemainingText] = useState<string>('');
  const [isCutoffPassed, setIsCutoffPassed] = useState(false);
  const [stampFeedback, setStampFeedback] = useState<'eating' | 'skipping' | null>(null);

  // Motion values for swipe gestures
  const x = useMotionValue(0);
  const rotate = useTransform(x, [-200, 200], [-18, 18]);
  const likeStampOpacity = useTransform(x, [20, 100], [0, 1]);
  const nopeStampOpacity = useTransform(x, [-20, -100], [0, 1]);
  const cardScale = useTransform(x, [-150, 0, 150], [0.96, 1, 0.96]);

  const schedule = MEAL_SCHEDULES[menu.meal_type] || MEAL_SCHEDULES.dinner;

  // Real-time countdown calculation
  useEffect(() => {
    const updateCountdown = () => {
      const cutoff = new Date(menu.cutoff_time).getTime();
      const now = new Date().getTime();
      const diff = cutoff - now;

      if (diff <= 0) {
        setIsCutoffPassed(true);
        const cutoffDate = new Date(menu.cutoff_time);
        const timeStr = cutoffDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setTimeRemainingText(`Deadline passed (${timeStr})`);
      } else {
        setIsCutoffPassed(false);
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);

        if (hours > 0) {
          setTimeRemainingText(`Deadline in ${hours}h ${minutes}m`);
        } else if (minutes > 0) {
          setTimeRemainingText(`Closes in ${minutes}m ${seconds}s!`);
        } else {
          setTimeRemainingText(`Closes in ${seconds}s!`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [menu.cutoff_time]);

  // Handle Corner Button / Tap Actions
  const handleAction = async (status: BookingStatus) => {
    if (isCutoffPassed || isLoading) return;

    setStampFeedback(status);
    setTimeout(() => setStampFeedback(null), 1200);

    if (status === 'eating') {
      triggerMealConfetti();
    }

    await onSelectStatus(status);
  };

  // Handle Drag End (Swipe Right for Eat, Swipe Left for Skip)
  const handleDragEnd = async (_: any, info: any) => {
    if (isCutoffPassed || isLoading) return;

    const threshold = 75;
    if (info.offset.x > threshold) {
      // Swiped Right -> Eat (Tick)
      handleAction('eating');
    } else if (info.offset.x < -threshold) {
      // Swiped Left -> Skip (Cross)
      handleAction('skipping');
    }
  };

  // Color theme per meal type
  const getTheme = () => {
    switch (menu.meal_type) {
      case 'breakfast':
        return {
          accent: 'amber',
          badgeVariant: 'orange' as const,
          icon: <Coffee className="w-3.5 h-3.5" />,
          gradient: 'from-amber-500/15 via-zinc-900 to-zinc-950',
          borderGlow: 'hover:border-amber-500/40',
          glowShadow: 'shadow-[0_8px_30px_rgba(245,158,11,0.12)]',
        };
      case 'lunch':
        return {
          accent: 'orange',
          badgeVariant: 'orange' as const,
          icon: <Sun className="w-3.5 h-3.5" />,
          gradient: 'from-orange-500/15 via-zinc-900 to-zinc-950',
          borderGlow: 'hover:border-orange-500/40',
          glowShadow: 'shadow-[0_8px_30px_rgba(249,115,22,0.12)]',
        };
      case 'dinner':
      default:
        return {
          accent: 'green',
          badgeVariant: 'green' as const,
          icon: <Moon className="w-3.5 h-3.5" />,
          gradient: 'from-emerald-500/15 via-zinc-900 to-zinc-950',
          borderGlow: 'hover:border-emerald-500/40',
          glowShadow: 'shadow-[0_8px_30px_rgba(34,197,94,0.12)]',
        };
    }
  };

  const theme = getTheme();

  return (
    <div className="w-full relative flex flex-col items-center select-none touch-none">
      {/* TINDER CARD CONTAINER WITH DRAG GESTURE */}
      <motion.div
        style={{ x, rotate, scale: cardScale }}
        drag={!isCutoffPassed ? 'x' : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.65}
        onDragEnd={handleDragEnd}
        whileTap={{ cursor: 'grabbing' }}
        className={`
          w-full rounded-[2.25rem] bg-gradient-to-b ${theme.gradient}
          border-2 border-zinc-750/70 p-5 sm:p-7 relative overflow-hidden
          shadow-[0_16px_40px_rgba(0,0,0,0.6)] ${theme.borderGlow}
          transition-colors duration-200 cursor-grab
        `}
      >
        {/* TINDER SWIPE STAMP OVERLAYS */}
        {/* 1. GREEN "EATING" / "LIKE" STAMP (Visible when dragging right or eating) */}
        <motion.div
          style={{
            opacity: stampFeedback === 'eating' ? 1 : likeStampOpacity,
          }}
          className="pointer-events-none absolute top-8 right-8 z-30 transform rotate-[16deg] border-4 border-green-400 bg-black/60 px-4 py-1.5 rounded-2xl shadow-[0_0_25px_rgba(34,197,94,0.6)]"
        >
          <span className="text-xl sm:text-2xl font-black uppercase tracking-wider text-green-400 flex items-center gap-1.5">
            <Check className="w-6 h-6 stroke-[3.5]" />
            EATING
          </span>
        </motion.div>

        {/* 2. RED "SKIPPING" / "NOPE" STAMP (Visible when dragging left or skipping) */}
        <motion.div
          style={{
            opacity: stampFeedback === 'skipping' ? 1 : nopeStampOpacity,
          }}
          className="pointer-events-none absolute top-8 left-8 z-30 transform -rotate-[16deg] border-4 border-red-500 bg-black/60 px-4 py-1.5 rounded-2xl shadow-[0_0_25px_rgba(239,68,68,0.6)]"
        >
          <span className="text-xl sm:text-2xl font-black uppercase tracking-wider text-red-500 flex items-center gap-1.5">
            <X className="w-6 h-6 stroke-[3.5]" />
            SKIPPING
          </span>
        </motion.div>

        {/* CARD TOP META BAR */}
        <div className="flex items-start justify-between gap-3 border-b border-zinc-800/80 pb-4 mb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={theme.badgeVariant} size="sm" icon={theme.icon}>
                {menu.meal_type.toUpperCase()}
              </Badge>

              <span className="text-xs font-bold text-zinc-400 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-zinc-500" />
                {new Date(menu.date).toLocaleDateString(undefined, {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>

            {/* Meal Serving Window */}
            <p className="text-[11px] font-bold text-zinc-400 flex items-center gap-1.5 pt-0.5">
              <span>Serving Time:</span>
              <span className="text-white font-black bg-zinc-800/80 px-2 py-0.5 rounded-md border border-zinc-700/60">
                {menu.serving_start && menu.serving_end
                  ? `${menu.serving_start} - ${menu.serving_end}`
                  : schedule.servingTime}
              </span>
            </p>
          </div>

          {/* 1-Hour Cutoff Deadline Countdown Pill */}
          <div
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black self-start
              ${
                isCutoffPassed
                  ? 'bg-red-950/60 text-red-400 border border-red-800/60'
                  : 'bg-amber-500/15 text-amber-300 border border-amber-500/40 shadow-[0_0_15px_rgba(245,158,11,0.2)]'
              }
            `}
          >
            {isCutoffPassed ? (
              <Lock className="w-3.5 h-3.5 text-red-400" />
            ) : (
              <Clock className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            )}
            <span>{timeRemainingText}</span>
          </div>
        </div>

        {/* HERO TITLE */}
        <div className="space-y-2 mb-5">
          <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
            {menu.title}
          </h3>
          {menu.notes && (
            <p className="text-xs text-zinc-400 italic">
              &ldquo;{menu.notes}&rdquo;
            </p>
          )}
        </div>

        {/* APPETIZING MENU ITEMS GRID */}
        <div className="space-y-2.5 mb-6">
          <div className="flex items-center justify-between text-xs font-black uppercase tracking-wider text-zinc-400">
            <span className="flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5 text-orange-500" />
              Menu Spread
            </span>
            <span className="text-[10px] text-zinc-500 font-bold lowercase">
              {(menu.items as MenuItem[]).length} delicious items
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {(menu.items as MenuItem[]).map((item, idx) => (
              <div
                key={item.id || idx}
                className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#171717]/90 border border-zinc-800/90 hover:border-zinc-700 transition-colors"
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
        </div>

        {/* CURRENT BOOKING STATUS STAMP & EDITABILITY FEEDBACK */}
        <div className="mb-6">
          <AnimatePresence mode="wait">
            {bookingStatus === 'eating' && (
              <motion.div
                key="booked-eating"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3.5 rounded-2xl bg-green-950/60 border-2 border-green-500/50 flex items-center justify-between gap-2 shadow-[0_0_20px_rgba(34,197,94,0.2)]"
              >
                <div className="flex items-center gap-2.5">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 stroke-[2.5]" />
                  <div>
                    <p className="text-xs font-black text-green-300 uppercase tracking-wide">
                      YOU ARE BOOKED TO EAT! 🍽️
                    </p>
                    <p className="text-[11px] text-zinc-300">
                      Your plate is confirmed with the canteen kitchen.
                    </p>
                  </div>
                </div>
                {!isCutoffPassed && (
                  <span className="text-[10px] font-bold text-zinc-400 uppercase bg-zinc-900/90 px-2 py-1 rounded-lg border border-zinc-800 flex-shrink-0">
                    Editable
                  </span>
                )}
              </motion.div>
            )}

            {bookingStatus === 'skipping' && (
              <motion.div
                key="booked-skipping"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-3.5 rounded-2xl bg-red-950/50 border-2 border-red-500/50 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2.5">
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 stroke-[2.5]" />
                  <div>
                    <p className="text-xs font-black text-red-300 uppercase tracking-wide">
                      YOU ARE SKIPPING THIS MEAL 🛑
                    </p>
                    <p className="text-[11px] text-zinc-300">
                      Marked absent. No food will be wasted.
                    </p>
                  </div>
                </div>
                {!isCutoffPassed && (
                  <span className="text-[10px] font-bold text-zinc-400 uppercase bg-zinc-900/90 px-2 py-1 rounded-lg border border-zinc-800 flex-shrink-0">
                    Editable
                  </span>
                )}
              </motion.div>
            )}

            {bookingStatus === 'unbooked' && (
              <motion.div
                key="unbooked"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 text-center text-xs text-zinc-400 font-bold"
              >
                👉 Tap <span className="text-green-400">✅ Tick</span> on bottom-right to Eat, or <span className="text-red-400">❌ Cross</span> on bottom-left to Skip!
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ========================================================================= */}
        {/* TINDER BOTTOM CORNER ACTION BUTTONS (The core interactive mechanic)       */}
        {/* Bottom Left = ❌ Cross (Skip) | Bottom Right = ✅ Tick (Eat)               */}
        {/* ========================================================================= */}
        <div className="pt-2 border-t border-zinc-800/90 flex items-center justify-between gap-3">
          {/* BOTTOM LEFT CORNER: ❌ RED CROSS BUTTON (SKIP) */}
          <button
            type="button"
            disabled={isCutoffPassed || isLoading}
            onClick={() => handleAction('skipping')}
            aria-label="Skip this meal"
            className={`
              group relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full
              transition-all duration-150 transform select-none cursor-pointer
              ${
                bookingStatus === 'skipping'
                  ? 'bg-red-500 text-black scale-105 shadow-[0_0_30px_rgba(239,68,68,0.6)] border-4 border-red-300'
                  : 'bg-[#201515] text-red-400 border-2 border-red-500/50 hover:bg-red-950/70 hover:border-red-400 hover:scale-105 active:scale-95 shadow-[0_6px_20px_rgba(239,68,68,0.25)]'
              }
              ${isCutoffPassed ? 'opacity-40 cursor-not-allowed filter grayscale' : ''}
            `}
          >
            <div className="flex flex-col items-center">
              <X className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3.5] transition-transform group-hover:rotate-[-8deg]" />
              <span className="text-[9px] font-black uppercase tracking-tight -mt-0.5">
                {bookingStatus === 'skipping' ? 'Skipping' : 'Skip'}
              </span>
            </div>
          </button>

          {/* CENTER HELPER: DEADLINE / EDIT INFO PILL */}
          <div className="flex-1 text-center px-1">
            {isCutoffPassed ? (
              <div className="flex flex-col items-center text-zinc-500">
                <Lock className="w-4 h-4 mb-0.5 text-zinc-500" />
                <span className="text-[11px] font-bold">Booking Closed</span>
                <span className="text-[10px] text-zinc-600">Cutoff 1hr before meal</span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <span className="text-[11px] font-black text-zinc-300 uppercase tracking-wide flex items-center gap-1">
                  <RotateCcw className="w-3 h-3 text-amber-400" />
                  Tap to Choose
                </span>
                <span className="text-[10px] text-zinc-400 font-medium">
                  {bookingStatus !== 'unbooked'
                    ? '✏️ Editable until deadline'
                    : 'Swipe or tap corner'}
                </span>
              </div>
            )}
          </div>

          {/* BOTTOM RIGHT CORNER: ✅ GREEN TICK BUTTON (EAT) */}
          <button
            type="button"
            disabled={isCutoffPassed || isLoading}
            onClick={() => handleAction('eating')}
            aria-label="Eat this meal"
            className={`
              group relative flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full
              transition-all duration-150 transform select-none cursor-pointer
              ${
                bookingStatus === 'eating'
                  ? 'bg-green-500 text-black scale-105 shadow-[0_0_30px_rgba(34,197,94,0.7)] border-4 border-green-300'
                  : 'bg-[#122216] text-green-400 border-2 border-green-500/50 hover:bg-green-950/70 hover:border-green-400 hover:scale-105 active:scale-95 shadow-[0_6px_20px_rgba(34,197,94,0.28)]'
              }
              ${isCutoffPassed ? 'opacity-40 cursor-not-allowed filter grayscale' : ''}
            `}
          >
            <div className="flex flex-col items-center">
              <Check className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3.5] transition-transform group-hover:scale-110" />
              <span className="text-[9px] font-black uppercase tracking-tight -mt-0.5">
                {bookingStatus === 'eating' ? "I'm Eating" : "I'll Eat"}
              </span>
            </div>
          </button>
        </div>
      </motion.div>

      {/* SWIPE HINT BAR */}
      {!isCutoffPassed && (
        <div className="flex items-center justify-between w-full px-4 pt-2.5 text-[11px] text-zinc-500 font-bold">
          <span className="flex items-center gap-1 text-red-400/80">
            👈 Swipe Left (Skip)
          </span>
          <span className="text-zinc-600 font-medium">Or tap bottom corners</span>
          <span className="flex items-center gap-1 text-green-400/80">
            Swipe Right (Eat) 👉
          </span>
        </div>
      )}
    </div>
  );
}
