'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { createClient } from '@/lib/supabase/client';
import { DataStore, MEAL_SCHEDULES, isSupabaseConfigured } from '@/lib/data/data-store';
import type { Menu, Profile, Booking, MenuItem, MealType } from '@/types/database.types';
import {
  ChefHat,
  Users,
  Utensils,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  X,
  Clock,
  Copy,
  Sun,
  Moon,
  Coffee,
  Search,
  UserPlus,
  Flame,
  Check,
  Calendar,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Settings2,
  RotateCcw,
  Bell,
  Share2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'headcount' | 'menu' | 'residents'>('headcount');

  const [selectedMealType, setSelectedMealType] = useState<MealType>('lunch');
  const [selectedDay, setSelectedDay] = useState<'today' | 'tomorrow'>('today');

  const [menus, setMenus] = useState<Menu[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Food Ready broadcast state & rate limit
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);

  // Simple 2-field menu form state
  const [menuTitle, setMenuTitle] = useState('');
  const [menuItemsText, setMenuItemsText] = useState('');
  const [menuCutoffHour, setMenuCutoffHour] = useState('11:30');
  const [menuNotes, setMenuNotes] = useState('');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [menuFeedback, setMenuFeedback] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Add resident simple form state
  const [newResidentName, setNewResidentName] = useState('');
  const [newResidentPhone, setNewResidentPhone] = useState('');
  const [newResidentRoom, setNewResidentRoom] = useState('');
  const [residentSearchQuery, setResidentSearchQuery] = useState('');
  const [residentAddError, setResidentAddError] = useState('');
  const [residentAddSuccess, setResidentAddSuccess] = useState('');

  const [copiedSummary, setCopiedSummary] = useState(false);

  const todayStr = new Date().toISOString().split('T')[0];
  const tomorrowDate = new Date();
  tomorrowDate.setDate(tomorrowDate.getDate() + 1);
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0];

  const targetDateStr = selectedDay === 'today' ? todayStr : tomorrowStr;

  const refreshAdminData = async () => {
    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data: dbMenus } = await supabase.from('menus').select('*');
        if (dbMenus && dbMenus.length > 0) {
          DataStore.saveMenus(dbMenus as Menu[]);
          setMenus(dbMenus as Menu[]);
        }
        const { data: dbProfiles } = await supabase.from('profiles').select('*');
        if (dbProfiles && dbProfiles.length > 0) {
          DataStore.saveProfiles(dbProfiles as Profile[]);
          setProfiles(dbProfiles as Profile[]);
        }
        const { data: dbBookings } = await supabase.from('bookings').select('*');
        if (dbBookings) {
          DataStore.saveBookings(dbBookings as Booking[]);
          setBookings(dbBookings as Booking[]);
        }
      } catch (err) {
        console.error('Admin live sync error:', err);
      }
    }
    const loadedMenus = DataStore.getMenus();
    setMenus(loadedMenus);
    const loadedProfiles = DataStore.getProfiles();
    setProfiles(loadedProfiles);
    const loadedBookings = DataStore.getBookings();
    setBookings(loadedBookings);
  };

  useEffect(() => {
    refreshAdminData();
  }, []);

  // Find active menu or placeholder for selected meal and day
  const mealsForSelectedDay = DataStore.getMealsForDate(targetDateStr);
  const activeMenu =
    mealsForSelectedDay.find((m) => m.meal_type === selectedMealType) ||
    mealsForSelectedDay[0];

  const hasExistingCustomMenu =
    activeMenu &&
    activeMenu.title !== 'Menu not added yet' &&
    !activeMenu.id.startsWith('unconfigured-');

  // Initialize menu editor when activeMenu or selectedMealType changes
  useEffect(() => {
    if (activeMenu) {
      const isPlaceholder = activeMenu.title === 'Menu not added yet';
      setMenuTitle(isPlaceholder ? '' : activeMenu.title);

      const itemsList = (activeMenu.items as MenuItem[]).map((i) => i.name).join(', ');
      setMenuItemsText(itemsList);

      const cutoff = new Date(activeMenu.cutoff_time);
      const hh = String(cutoff.getHours()).padStart(2, '0');
      const mm = String(cutoff.getMinutes()).padStart(2, '0');
      setMenuCutoffHour(`${hh}:${mm}`);

      setMenuNotes(activeMenu.notes || '');
    }
  }, [activeMenu?.id, selectedMealType, selectedDay]);

  // Headcount calculation
  const activeResidents = profiles.filter((p) => p.role === 'resident' && p.is_active);
  const headcount = activeMenu
    ? DataStore.getHeadcount(activeMenu.id, activeResidents.length)
    : { eating: 0, skipping: 0, unbooked: 0, total: activeResidents.length, percentage: 0 };

  // Handle Save Menu (Simplified for food operator)
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMenu) return;

    const titleToSave = menuTitle.trim() || `${selectedMealType.toUpperCase()} Special`;

    const rawItems = menuItemsText.trim() ? menuItemsText.split(',') : [titleToSave];
    const itemsArray: MenuItem[] = rawItems
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name, i) => ({
        id: `item-${Date.now()}-${i}`,
        name,
        category: 'main',
        is_veg:
          !name.toLowerCase().includes('chicken') &&
          !name.toLowerCase().includes('mutton') &&
          !name.toLowerCase().includes('egg') &&
          !name.toLowerCase().includes('fish') &&
          !name.toLowerCase().includes('non-veg') &&
          !name.toLowerCase().includes('non veg'),
      }));

    const [hh, mm] = menuCutoffHour.split(':').map(Number);
    const [y, m, d] = targetDateStr.split('-').map(Number);
    const cutoffDate = new Date(y, m - 1, d, hh || 12, mm || 0, 0);

    const schedule = MEAL_SCHEDULES[selectedMealType];

    try {
      await DataStore.saveMenu({
        id: activeMenu.id,
        date: targetDateStr,
        meal_type: selectedMealType,
        title: titleToSave,
        items: itemsArray,
        cutoff_time: cutoffDate.toISOString(),
        serving_start: schedule.servingStart,
        serving_end: schedule.servingEnd,
        notes: menuNotes || `Served fresh between ${schedule.servingTime}`,
        is_published: true,
      });

      setMenuFeedback({
        text: `✓ ${selectedMealType.toUpperCase()} menu published to residents!`,
        type: 'success',
      });
      setTimeout(() => setMenuFeedback(null), 3500);
      refreshAdminData();
    } catch (err: any) {
      setMenuFeedback({ text: err.message || 'Failed to save menu', type: 'error' });
    }
  };

  // Handle Delete / Reset Menu
  const handleDeleteMenu = async () => {
    if (!confirm(`Are you sure you want to delete the ${selectedMealType.toUpperCase()} menu for ${selectedDay}?`)) {
      return;
    }

    try {
      await DataStore.deleteMenu(targetDateStr, selectedMealType);
      setMenuTitle('');
      setMenuItemsText('');
      setMenuFeedback({ text: `✓ ${selectedMealType.toUpperCase()} menu deleted.`, type: 'success' });
      setTimeout(() => setMenuFeedback(null), 3000);
      refreshAdminData();
    } catch (err: any) {
      setMenuFeedback({ text: err.message || 'Failed to delete menu', type: 'error' });
    }
  };

  // 1-Tap Quick presets (Multiple options: Veg Thali, Non-Veg Thali, Biryani, etc.)
  const applyQuickMeal = (title: string, dishes: string) => {
    setMenuTitle(title);
    setMenuItemsText(dishes);
  };

  // Handle Add Resident
  const handleAddResident = async (e: React.FormEvent) => {
    e.preventDefault();
    setResidentAddError('');
    setResidentAddSuccess('');

    const cleanDigits = newResidentPhone.replace(/\D/g, '');
    if (!newResidentName.trim() || cleanDigits.length !== 10) {
      setResidentAddError('Please enter a valid 10-digit mobile number.');
      return;
    }

    try {
      await DataStore.addProfile({
        name: newResidentName.trim(),
        phone_number: `+91${cleanDigits}`,
        room_number: newResidentRoom.trim() || null,
        role: 'resident',
        is_active: true,
      });

      setResidentAddSuccess(`✓ Added ${newResidentName} (+91 ${cleanDigits}) to resident list!`);
      setNewResidentName('');
      setNewResidentPhone('');
      setNewResidentRoom('');
      refreshAdminData();
    } catch (err: any) {
      setResidentAddError(err.message || 'Failed to add resident');
    }
  };

  // Handle Remove Resident
  const handleRemoveResident = async (id: string, name: string) => {
    if (confirm(`Remove ${name} from resident list?`)) {
      try {
        await DataStore.removeProfile(id);
        refreshAdminData();
      } catch (err: any) {
        alert(err.message || 'Failed to remove resident');
      }
    }
  };

  // WhatsApp Kitchen Copy
  const copyKitchenSummary = () => {
    const text = `📋 *PG KITCHEN HEADCOUNT REPORT*\n*Meal:* ${selectedMealType.toUpperCase()} (${activeMenu?.title || 'Daily Meal'})\n*Date:* ${targetDateStr}\n\n🍽️ *TOTAL PLATES TO COOK:* ${headcount.eating} / ${headcount.total}\n🛑 *SKIPPING:* ${headcount.skipping}\n⏳ *PENDING:* ${headcount.unbooked}\n\n*Generated via FoodBook*`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  // Check rate limit (1 broadcast per meal per day)
  const isMealNotified = DataStore.isMealNotified(targetDateStr, selectedMealType);

  // Broadcast "Food is Ready" push notification to all resident devices
  const handleSendFoodReadyAlert = async () => {
    if (isMealNotified || isBroadcasting) return;

    setIsBroadcasting(true);
    setBroadcastFeedback(null);

    const mealName =
      activeMenu?.title && activeMenu.title !== 'Menu not added yet'
        ? activeMenu.title
        : `${selectedMealType.toUpperCase()} Special`;

    try {
      await fetch('/api/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broadcast: true,
          mealType: selectedMealType,
          menuId: activeMenu?.id,
          payload: {
            title: `${selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)} Food Alert 🍽️`,
            body: `${mealName} is ready in the dining hall!`,
          },
        }),
      });

      DataStore.markMealNotified(targetDateStr, selectedMealType);
      setBroadcastFeedback(`✓ Alert sent for ${selectedMealType.toUpperCase()}! (Rate limit: 1 per meal)`);
      setTimeout(() => setBroadcastFeedback(null), 4500);
    } catch (err: any) {
      setBroadcastFeedback('Failed to send notification: ' + err.message);
    } finally {
      setIsBroadcasting(false);
    }
  };

  // Share registration/menu link via WhatsApp for unwhitelisted or new residents
  const shareRegistrationLink = () => {
    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://bookurfood.vercel.app';
    const text = `🍽️ *PG FOOD ALERT: ${selectedMealType.toUpperCase()} IS READY!*\n*Menu:* ${activeMenu?.title || 'Daily Meal'}\n\n👉 *Tap here to book your plate or register:* ${appUrl}`;
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  return (
    <div className="w-full max-w-md mx-auto pb-28 pt-1 space-y-4">
      {/* CLEAN HEADER WITH DAY TOGGLE (ONLY FOR HEADCOUNT & MENU) */}
      <div className="flex items-center justify-between px-1">
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          {activeTab === 'headcount' && 'Kitchen Headcount'}
          {activeTab === 'menu' && 'Food Menu'}
          {activeTab === 'residents' && 'Resident Directory'}
        </h1>

        {/* DAY TOGGLE (TODAY vs TOMORROW) - ONLY FOR HEADCOUNT & MENU */}
        {activeTab !== 'residents' && (
          <div className="p-1 rounded-2xl bg-[#181818] border border-zinc-800 flex items-center gap-1 shadow-inner">
            <button
              type="button"
              onClick={() => setSelectedDay('today')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedDay === 'today' ? 'bg-amber-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setSelectedDay('tomorrow')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                selectedDay === 'tomorrow' ? 'bg-amber-500 text-black shadow-sm' : 'text-zinc-400 hover:text-white'
              }`}
            >
              Tomorrow
            </button>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* BIG MEAL SELECTOR CARDS (Breakfast • Lunch • Dinner)           */}
      {/* ============================================================= */}
      {(activeTab === 'headcount' || activeTab === 'menu') && (
        <div className="grid grid-cols-3 gap-2 sm:gap-2.5">
          {/* Breakfast Card */}
          <button
            type="button"
            onClick={() => setSelectedMealType('breakfast')}
            className={`
              p-3 sm:p-3.5 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all select-none cursor-pointer
              ${
                selectedMealType === 'breakfast'
                  ? 'bg-amber-500 text-black border-2 border-amber-400 border-b-6 border-b-amber-700 scale-[1.03] shadow-[0_6px_20px_rgba(245,158,11,0.35)]'
                  : 'bg-[#181818] text-zinc-300 border-2 border-zinc-800 border-b-6 border-b-zinc-900 hover:border-zinc-700'
              }
            `}
          >
            <span className="text-2xl sm:text-3xl">🍳</span>
            <span className="text-xs sm:text-sm font-black capitalize">Breakfast</span>
            <span className={`text-[10px] font-bold ${selectedMealType === 'breakfast' ? 'text-black/80 font-black' : 'text-zinc-500'}`}>
              8:00 - 10:30 AM
            </span>
          </button>

          {/* Lunch Card */}
          <button
            type="button"
            onClick={() => setSelectedMealType('lunch')}
            className={`
              p-3 sm:p-3.5 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all select-none cursor-pointer
              ${
                selectedMealType === 'lunch'
                  ? 'bg-orange-500 text-black border-2 border-orange-400 border-b-6 border-b-orange-700 scale-[1.03] shadow-[0_6px_20px_rgba(249,115,22,0.35)]'
                  : 'bg-[#181818] text-zinc-300 border-2 border-zinc-800 border-b-6 border-b-zinc-900 hover:border-zinc-700'
              }
            `}
          >
            <span className="text-2xl sm:text-3xl">🍛</span>
            <span className="text-xs sm:text-sm font-black capitalize">Lunch</span>
            <span className={`text-[10px] font-bold ${selectedMealType === 'lunch' ? 'text-black/80 font-black' : 'text-zinc-500'}`}>
              12:30 - 2:00 PM
            </span>
          </button>

          {/* Dinner Card */}
          <button
            type="button"
            onClick={() => setSelectedMealType('dinner')}
            className={`
              p-3 sm:p-3.5 rounded-3xl flex flex-col items-center justify-center gap-1 transition-all select-none cursor-pointer
              ${
                selectedMealType === 'dinner'
                  ? 'bg-green-500 text-black border-2 border-green-400 border-b-6 border-b-green-700 scale-[1.03] shadow-[0_6px_20px_rgba(34,197,94,0.35)]'
                  : 'bg-[#181818] text-zinc-300 border-2 border-zinc-800 border-b-6 border-b-zinc-900 hover:border-zinc-700'
              }
            `}
          >
            <span className="text-2xl sm:text-3xl">🍲</span>
            <span className="text-xs sm:text-sm font-black capitalize">Dinner</span>
            <span className={`text-[10px] font-bold ${selectedMealType === 'dinner' ? 'text-black/80 font-black' : 'text-zinc-500'}`}>
              7:30 - 9:30 PM
            </span>
          </button>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 1: KITCHEN HEADCOUNT (ONLY HEADCOUNT NUMBERS - NO NAMES)  */}
      {/* ============================================================= */}
      {activeTab === 'headcount' && (
        <div className="space-y-3.5">
          {/* CURRENT MEAL TITLE */}
          <div className="p-3.5 rounded-2xl bg-[#181818] border border-zinc-800 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-black text-amber-400 uppercase tracking-wide">
                {selectedMealType} Menu
              </p>
              <p className="text-sm font-black text-white truncate max-w-[220px]">
                {activeMenu.title}
              </p>
            </div>
            <span className="text-[11px] font-black uppercase px-2.5 py-1 rounded-full bg-zinc-900 text-zinc-300 border border-zinc-700">
              Cutoff {new Date(activeMenu.cutoff_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          {/* GIANT HEADCOUNT SUMMARY CARDS */}
          <div className="grid grid-cols-3 gap-2.5">
            {/* Plates to cook */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#132516] border-2 border-green-500/80 border-b-6 border-b-green-700 text-center space-y-0.5 shadow-lg">
              <span className="text-4xl sm:text-5xl font-black text-green-400 block tracking-tight">
                {headcount.eating}
              </span>
              <span className="text-[11px] sm:text-xs font-black uppercase text-green-300">
                Plates to Cook
              </span>
            </div>

            {/* Skipping */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#251414] border-2 border-red-500/70 border-b-6 border-b-red-800 text-center space-y-0.5">
              <span className="text-4xl sm:text-5xl font-black text-red-400 block tracking-tight">
                {headcount.skipping}
              </span>
              <span className="text-[11px] sm:text-xs font-black uppercase text-red-300">
                Skipping
              </span>
            </div>

            {/* Unbooked */}
            <div className="p-4 sm:p-5 rounded-3xl bg-[#1c1c1c] border-2 border-zinc-700 border-b-6 border-b-zinc-850 text-center space-y-0.5">
              <span className="text-4xl sm:text-5xl font-black text-zinc-400 block tracking-tight">
                {headcount.unbooked}
              </span>
              <span className="text-[11px] sm:text-xs font-black uppercase text-zinc-400">
                Pending
              </span>
            </div>
          </div>

          {/* BROADCAST ALERT FEEDBACK */}
          {broadcastFeedback && (
            <div className="p-3 rounded-2xl bg-amber-950/70 border border-amber-800 text-xs text-amber-300 font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{broadcastFeedback}</span>
            </div>
          )}

          {/* ACTION BUTTON 1: BROADCAST "FOOD IS READY" NOTIFICATION (RATE-LIMITED 1 PER MEAL) */}
          <div className="space-y-2 pt-1">
            <button
              type="button"
              disabled={isMealNotified || isBroadcasting}
              onClick={handleSendFoodReadyAlert}
              className={`
                w-full py-3.5 px-4 rounded-2xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-md
                ${
                  isMealNotified
                    ? 'bg-zinc-900 border-2 border-zinc-800 text-zinc-500 cursor-not-allowed'
                    : 'bg-amber-500 hover:bg-amber-400 text-black border-b-4 border-b-amber-700 active:border-b-0 active:translate-y-1 cursor-pointer'
                }
              `}
            >
              <Bell className="w-4 h-4" />
              <span>
                {isMealNotified
                  ? `✓ Alert Sent for ${selectedMealType.toUpperCase()} (1 per meal limit)`
                  : isBroadcasting
                  ? 'Sending Alerts to Residents...'
                  : `🔔 Alert Residents: ${selectedMealType.toUpperCase()} is Ready`}
              </span>
            </button>

            {/* ACTION BUTTON 2: WHATSAPP HEADCOUNT & REGISTRATION SHARE */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={copyKitchenSummary}
                className="py-3 px-3 rounded-2xl bg-[#181818] hover:bg-zinc-800 text-zinc-200 border border-zinc-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Copy className="w-3.5 h-3.5 text-green-400" />
                <span>{copiedSummary ? '✓ Copied!' : 'Copy Count'}</span>
              </button>

              <button
                type="button"
                onClick={shareRegistrationLink}
                className="py-3 px-3 rounded-2xl bg-green-950/40 hover:bg-green-950/70 text-green-300 border border-green-800/80 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
              >
                <Share2 className="w-3.5 h-3.5 text-green-400" />
                <span>Share WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 2: UPDATE FOOD MENU (SUPER SIMPLE 2-FIELD FOOD FORM)      */}
      {/* ============================================================= */}
      {activeTab === 'menu' && (
        <div className="p-4 sm:p-5 rounded-3xl bg-[#181818] border-2 border-zinc-700/80 border-b-6 border-b-zinc-900 space-y-4 shadow-xl">
          {/* HEADER & EDIT/NEW STATUS */}
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <h2 className="text-base sm:text-lg font-black text-white capitalize flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-amber-400" />
              {hasExistingCustomMenu ? `Edit ${selectedMealType}` : `Set ${selectedMealType}`} ({selectedDay})
            </h2>

            {/* CORNER MORE OPTIONS LINK */}
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="text-[11px] font-bold text-zinc-400 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>More Options</span>
              {showAdvancedOptions ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>

          {/* FEEDBACK ALERT */}
          {menuFeedback && (
            <div
              className={`p-3 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                menuFeedback.type === 'success'
                  ? 'bg-green-950/70 border border-green-800 text-green-300'
                  : 'bg-red-950/70 border border-red-800 text-red-300'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>{menuFeedback.text}</span>
            </div>
          )}

          {/* 1-TAP QUICK MEAL CHIPS (POHA, UPMA, VADA PAV / VEG THALI, NON-VEG THALI) */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block">
              💡 1-Tap Quick Meals (Tap to fill):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {selectedMealType === 'breakfast' && (
                <>
                  <button
                    type="button"
                    onClick={() => applyQuickMeal('Poha', '')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-[11px] font-bold text-zinc-200 cursor-pointer"
                  >
                    🍚 Poha
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickMeal('Upma', '')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-[11px] font-bold text-zinc-200 cursor-pointer"
                  >
                    🥣 Upma
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickMeal('Vada Pav', '')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-amber-500/50 text-[11px] font-bold text-zinc-200 cursor-pointer"
                  >
                    🍔 Vada Pav
                  </button>
                </>
              )}

              {(selectedMealType === 'lunch' || selectedMealType === 'dinner') && (
                <>
                  <button
                    type="button"
                    onClick={() => applyQuickMeal('Veg Thali', '')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-green-500/50 text-[11px] font-bold text-green-300 cursor-pointer flex items-center gap-1"
                  >
                    <span>🟢</span> Veg Thali
                  </button>
                  <button
                    type="button"
                    onClick={() => applyQuickMeal('Non-Veg Thali', '')}
                    className="px-3 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-red-500/50 text-[11px] font-bold text-red-300 cursor-pointer flex items-center gap-1"
                  >
                    <span>🔴</span> Non-Veg Thali
                  </button>
                </>
              )}
            </div>
          </div>

          {/* MAIN 2-FIELD FOOD FORM */}
          <form onSubmit={handleSaveMenu} className="space-y-3.5">
            {/* 1. MEAL NAME */}
            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                Meal Name
              </label>
              <input
                type="text"
                value={menuTitle}
                onChange={(e) => setMenuTitle(e.target.value)}
                placeholder="e.g. Veg Thali / Poha"
                required
                className="w-full px-4 py-3 rounded-2xl bg-[#141414] border border-zinc-700 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* 2. DISHES DESCRIPTION (OPTIONAL) */}
            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                Dishes in this Meal <span className="text-zinc-500 normal-case">(Optional)</span>
              </label>
              <textarea
                value={menuItemsText}
                onChange={(e) => setMenuItemsText(e.target.value)}
                rows={2}
                placeholder="Optional: e.g. Paneer Butter Masala, Roti, Rice"
                className="w-full px-4 py-3 rounded-2xl bg-[#141414] border border-zinc-700 text-white font-medium text-sm focus:outline-none focus:border-amber-500 leading-relaxed"
              />
            </div>

            {/* ADVANCED TIMINGS & DEADLINE (UNDER MORE OPTIONS) */}
            <AnimatePresence>
              {showAdvancedOptions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-2.5 overflow-hidden"
                >
                  <div className="flex items-center justify-between text-xs font-bold text-amber-400">
                    <span>⚙️ Custom Timings & Deadline</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-black uppercase text-zinc-400">
                        Cutoff Deadline
                      </label>
                      <input
                        type="time"
                        value={menuCutoffHour}
                        onChange={(e) => setMenuCutoffHour(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-zinc-700 text-white font-bold text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black uppercase text-zinc-400">
                        Custom Note
                      </label>
                      <input
                        type="text"
                        value={menuNotes}
                        onChange={(e) => setMenuNotes(e.target.value)}
                        placeholder="Served hot from kitchen"
                        className="w-full px-3 py-2 rounded-xl bg-[#141414] border border-zinc-700 text-white font-medium text-xs"
                      />
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* ACTION BUTTONS (SAVE + DELETE/RESET) */}
            <div className="pt-2 flex items-center gap-2">
              <button
                type="submit"
                className="flex-1 py-3.5 px-4 rounded-2xl bg-amber-500 hover:bg-amber-400 text-black font-black text-sm border-b-4 border-b-amber-700 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
              >
                <ChefHat className="w-4 h-4" />
                <span>{hasExistingCustomMenu ? 'Save Changes' : 'Publish Menu to Residents'}</span>
              </button>

              {hasExistingCustomMenu && (
                <button
                  type="button"
                  onClick={handleDeleteMenu}
                  className="py-3.5 px-4 rounded-2xl bg-[#281616] hover:bg-red-950 text-red-400 font-black text-sm border border-red-500/30 border-b-4 border-b-[#160c0c] active:border-b-0 active:translate-y-1 flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  title="Delete menu"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
              )}
            </div>
          </form>
        </div>
      )}

      {/* ============================================================= */}
      {/* TAB 3: RESIDENTS (RIGHT TAB: REGISTER NEW PEOPLE)             */}
      {/* ============================================================= */}
      {activeTab === 'residents' && (
        <div className="space-y-4">
          {/* BIG EASY ADD RESIDENT CARD */}
          <div className="p-4 sm:p-5 rounded-3xl bg-[#181818] border-2 border-zinc-700/80 border-b-6 border-b-zinc-900 space-y-3.5 shadow-xl">
            <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-2.5">
              <UserPlus className="w-5 h-5 text-green-400" />
              <h2 className="text-base sm:text-lg font-black text-white">
                Register New Resident
              </h2>
            </div>

            {residentAddSuccess && (
              <div className="p-3 rounded-2xl bg-green-950/70 border border-green-800 text-xs text-green-300 font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                <span>{residentAddSuccess}</span>
              </div>
            )}

            {residentAddError && (
              <div className="p-3 rounded-2xl bg-red-950/70 border border-red-800 text-xs text-red-300 font-bold">
                {residentAddError}
              </div>
            )}

            <form onSubmit={handleAddResident} className="space-y-3">
              {/* 1. Full Name */}
              <div className="space-y-1">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                  Full Name
                </label>
                <input
                  type="text"
                  value={newResidentName}
                  onChange={(e) => setNewResidentName(e.target.value)}
                  placeholder="e.g. Rahul Sharma"
                  required
                  className="w-full px-4 py-3 rounded-2xl bg-[#141414] border border-zinc-700 text-white font-bold text-sm focus:outline-none focus:border-green-500"
                />
              </div>

              {/* 2. Phone Number with locked +91 */}
              <div className="space-y-1">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                  Mobile Number
                </label>
                <div className="relative flex items-center rounded-2xl bg-[#141414] border border-zinc-700 focus-within:border-green-500 overflow-hidden shadow-inner">
                  <div className="flex items-center gap-1.5 pl-3.5 pr-2.5 py-3 bg-zinc-900 border-r border-zinc-700/80 text-zinc-300 font-black text-xs select-none flex-shrink-0">
                    <span className="text-sm">🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={newResidentPhone}
                    onChange={(e) => setNewResidentPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    placeholder="98765 43210"
                    required
                    className="w-full px-3.5 py-3 bg-transparent text-white font-black text-sm tracking-wider focus:outline-none placeholder-zinc-600"
                  />
                </div>
              </div>

              {/* 3. Room Number */}
              <div className="space-y-1">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                  Room Number
                </label>
                <input
                  type="text"
                  value={newResidentRoom}
                  onChange={(e) => setNewResidentRoom(e.target.value)}
                  placeholder="e.g. Room 204"
                  className="w-full px-4 py-3 rounded-2xl bg-[#141414] border border-zinc-700 text-white font-bold text-sm focus:outline-none focus:border-green-500"
                />
              </div>

              {/* Big Green Add Button */}
              <div className="pt-1">
                <button
                  type="submit"
                  className="w-full py-3.5 px-4 rounded-2xl bg-green-500 hover:bg-green-400 text-black font-black text-sm border-b-4 border-b-green-700 active:border-b-0 active:translate-y-1 flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>Add Resident to PG</span>
                </button>
              </div>
            </form>
          </div>

          {/* VIEW REGISTERED RESIDENTS (COLLAPSED UNDER ONE BUTTON) */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
              className="w-full py-3 px-4 rounded-2xl bg-[#181818] border border-zinc-800 hover:border-zinc-700 text-zinc-300 font-bold text-xs flex items-center justify-between cursor-pointer transition-all shadow-sm"
            >
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-amber-400" />
                <span>View Registered Residents ({profiles.length})</span>
              </div>
              {showAdvancedOptions ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>

            {/* EXPANDABLE RESIDENT DIRECTORY LIST */}
            <AnimatePresence>
              {showAdvancedOptions && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="p-4 rounded-3xl bg-[#181818] border border-zinc-800 space-y-3 overflow-hidden shadow-xl"
                >
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-zinc-500" />
                    <input
                      type="text"
                      value={residentSearchQuery}
                      onChange={(e) => setResidentSearchQuery(e.target.value)}
                      placeholder="Search resident name or room..."
                      className="w-full pl-8 pr-3 py-2 rounded-2xl bg-[#141414] border border-zinc-700 text-xs text-white focus:outline-none focus:border-green-500"
                    />
                  </div>

                  <div className="divide-y divide-zinc-850 max-h-64 overflow-y-auto pr-1">
                    {profiles
                      .filter(
                        (p) =>
                          p.name.toLowerCase().includes(residentSearchQuery.toLowerCase()) ||
                          (p.room_number || '').toLowerCase().includes(residentSearchQuery.toLowerCase()) ||
                          p.phone_number.includes(residentSearchQuery)
                      )
                      .map((profile) => (
                        <div key={profile.id} className="py-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black ${
                                profile.role === 'admin'
                                  ? 'bg-amber-500 text-black'
                                  : 'bg-green-500 text-black'
                              }`}
                            >
                              {profile.name.charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <p className="text-xs sm:text-sm font-bold text-white leading-tight">{profile.name}</p>
                                <span
                                  className={`text-[8px] font-black uppercase px-1.5 py-0.2 rounded ${
                                    profile.role === 'admin'
                                      ? 'bg-amber-500/20 text-amber-300'
                                      : 'bg-zinc-800 text-zinc-400'
                                  }`}
                                >
                                  {profile.role}
                                </span>
                              </div>
                              <p className="text-[11px] text-zinc-500">
                                Room <span className="text-zinc-300 font-bold">{profile.room_number || 'N/A'}</span> • {profile.phone_number}
                              </p>
                            </div>
                          </div>

                          {profile.role !== 'admin' && (
                            <button
                              type="button"
                              onClick={() => handleRemoveResident(profile.id, profile.name)}
                              className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Remove resident"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* INSTAGRAM-STYLE 3-SECTION BOTTOM NAVIGATION BAR               */}
      {/* 1. Count (Headcount) | 2. Middle + Add Meal | 3. Residents   */}
      {/* ============================================================= */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#121212]/95 backdrop-blur-xl border-t border-zinc-800/90 shadow-[0_-8px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-md mx-auto px-4 py-2 flex items-center justify-around relative">
          {/* TAB 1 (LEFT): HEADCOUNT / PLATES COUNT */}
          <button
            type="button"
            onClick={() => setActiveTab('headcount')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'headcount'
                ? 'text-amber-400 scale-105'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className="relative">
              <Utensils className={`w-5 h-5 ${activeTab === 'headcount' ? 'stroke-[2.8]' : 'stroke-2'}`} />
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-green-500 text-black text-[9px] font-black flex items-center justify-center">
                {headcount.eating}
              </span>
            </div>
            <span className="text-[10px] font-black tracking-tight">Count</span>
          </button>

          {/* TAB 2 (MIDDLE): ELEVATED INSTAGRAM-STYLE ADD MEALS BUTTON */}
          <button
            type="button"
            onClick={() => setActiveTab('menu')}
            aria-label="Add or edit meal menu"
            className={`
              -mt-5 w-14 h-14 rounded-full flex flex-col items-center justify-center gap-0.5
              transition-all duration-150 transform cursor-pointer shadow-[0_6px_20px_rgba(245,158,11,0.35)]
              ${
                activeTab === 'menu'
                  ? 'bg-amber-400 text-black scale-110 border-4 border-black ring-4 ring-amber-500/40'
                  : 'bg-amber-500 hover:bg-amber-400 text-black border-4 border-black active:scale-95'
              }
            `}
          >
            <Plus className="w-6 h-6 stroke-[3.5]" />
          </button>

          {/* TAB 3 (RIGHT): REGISTER RESIDENTS */}
          <button
            type="button"
            onClick={() => setActiveTab('residents')}
            className={`flex flex-col items-center gap-1 py-1 px-4 rounded-2xl transition-all cursor-pointer ${
              activeTab === 'residents'
                ? 'text-amber-400 scale-105'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <div className="relative">
              <UserPlus className={`w-5 h-5 ${activeTab === 'residents' ? 'stroke-[2.8]' : 'stroke-2'}`} />
              <span className="absolute -top-1 -right-2 w-4 h-4 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 text-[9px] font-bold flex items-center justify-center">
                {activeResidents.length}
              </span>
            </div>
            <span className="text-[10px] font-black tracking-tight">Residents</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
