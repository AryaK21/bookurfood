'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { DataStore } from '@/lib/data/data-store';
import type { Menu, Profile, Booking, MenuItem } from '@/types/database.types';
import { TactileButton } from '@/components/ui/TactileButton';
import { TactileCard } from '@/components/ui/TactileCard';
import { Badge } from '@/components/ui/Badge';
import { 
  Users, 
  Utensils, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Copy, 
  Sun, 
  Moon, 
  Search, 
  UserPlus, 
  ChefHat, 
  BellRing,
  ShieldCheck,
  Phone,
  Flame
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'headcount' | 'menu' | 'residents'>('headcount');

  const [menus, setMenus] = useState<Menu[]>([]);
  const [selectedMealType, setSelectedMealType] = useState<'lunch' | 'dinner'>('dinner');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);

  // Add resident form state
  const [newResidentName, setNewResidentName] = useState('');
  const [newResidentPhone, setNewResidentPhone] = useState('+91');
  const [newResidentRoom, setNewResidentRoom] = useState('');
  const [residentSearchQuery, setResidentSearchQuery] = useState('');
  const [residentAddError, setResidentAddError] = useState('');
  const [residentAddSuccess, setResidentAddSuccess] = useState('');

  // Menu editor form state
  const [menuTitle, setMenuTitle] = useState('');
  const [menuItemsText, setMenuItemsText] = useState('');
  const [menuCutoffHour, setMenuCutoffHour] = useState('17:00');
  const [menuNotes, setMenuNotes] = useState('');
  const [menuSaveSuccess, setMenuSaveSuccess] = useState('');

  const [copiedSummary, setCopiedSummary] = useState(false);

  const refreshAdminData = () => {
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

  const activeMenu = menus.find((m) => m.meal_type === selectedMealType) || menus[0];

  // Initialize menu editor when activeMenu changes
  useEffect(() => {
    if (activeMenu) {
      setMenuTitle(activeMenu.title);
      const itemsList = (activeMenu.items as MenuItem[]).map((i) => i.name).join(', ');
      setMenuItemsText(itemsList);
      const cutoff = new Date(activeMenu.cutoff_time);
      const hh = String(cutoff.getHours()).padStart(2, '0');
      const mm = String(cutoff.getMinutes()).padStart(2, '0');
      setMenuCutoffHour(`${hh}:${mm}`);
      setMenuNotes(activeMenu.notes || '');
    }
  }, [activeMenu, selectedMealType]);

  // Headcount calculation
  const activeResidents = profiles.filter((p) => p.role === 'resident' && p.is_active);
  const headcount = activeMenu
    ? DataStore.getHeadcount(activeMenu.id, activeResidents.length)
    : { eating: 0, skipping: 0, unbooked: 0, total: activeResidents.length, percentage: 0 };

  // Handle Add Resident to Whitelist
  const handleAddResident = async (e: React.FormEvent) => {
    e.preventDefault();
    setResidentAddError('');
    setResidentAddSuccess('');

    if (!newResidentName || !newResidentPhone || newResidentPhone.length < 10) {
      setResidentAddError('Please enter a valid resident name and mobile number.');
      return;
    }

    try {
      await DataStore.addProfile({
        name: newResidentName,
        phone_number: newResidentPhone,
        room_number: newResidentRoom || null,
        role: 'resident',
        is_active: true,
      });

      setResidentAddSuccess(`Added ${newResidentName} to the resident whitelist!`);
      setNewResidentName('');
      setNewResidentPhone('+91');
      setNewResidentRoom('');
      refreshAdminData();
    } catch (err: any) {
      setResidentAddError(err.message || 'Failed to add resident');
    }
  };

  // Handle Remove Resident
  const handleRemoveResident = async (id: string, name: string) => {
    if (confirm(`Remove ${name} from the resident whitelist? They will no longer be able to log in.`)) {
      try {
        await DataStore.removeProfile(id);
        refreshAdminData();
      } catch (err: any) {
        alert(err.message || 'Failed to remove resident');
      }
    }
  };

  // Handle Save Menu
  const handleSaveMenu = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeMenu) return;

    const itemsArray: MenuItem[] = menuItemsText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((name, i) => ({
        id: `item-${Date.now()}-${i}`,
        name,
        category: 'main',
        is_veg: !name.toLowerCase().includes('chicken') && !name.toLowerCase().includes('mutton') && !name.toLowerCase().includes('egg'),
      }));

    const [hh, mm] = menuCutoffHour.split(':').map(Number);
    const cutoffDate = new Date();
    cutoffDate.setHours(hh || 17, mm || 0, 0, 0);

    try {
      await DataStore.saveMenu({
        id: activeMenu.id,
        date: activeMenu.date,
        meal_type: selectedMealType,
        title: menuTitle,
        items: itemsArray,
        cutoff_time: cutoffDate.toISOString(),
        notes: menuNotes,
        is_published: true,
      });

      setMenuSaveSuccess('Menu updated and published to residents!');
      setTimeout(() => setMenuSaveSuccess(''), 3000);
      refreshAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to save menu');
    }
  };

  // Generate WhatsApp summary
  const copyKitchenSummary = () => {
    const eatingResidents = activeResidents.filter((p) => {
      const b = bookings.find((bk) => bk.menu_id === activeMenu?.id && bk.profile_id === p.id);
      return b?.status === 'eating';
    });

    const skippingResidents = activeResidents.filter((p) => {
      const b = bookings.find((bk) => bk.menu_id === activeMenu?.id && bk.profile_id === p.id);
      return b?.status === 'skipping';
    });

    const text = `📋 *PG CANTEEN HEADCOUNT REPORT*\n*Meal:* ${selectedMealType.toUpperCase()} (${activeMenu?.title})\n*Date:* ${new Date().toLocaleDateString()}\n\n🍽️ *TOTAL EATING:* ${headcount.eating} / ${headcount.total} (${headcount.percentage}%)\n🛑 *SKIPPING:* ${headcount.skipping}\n⏳ *UNBOOKED:* ${headcount.unbooked}\n\n*Eating List:*\n${eatingResidents.map((r, i) => `${i + 1}. ${r.name} (Room ${r.room_number || 'N/A'})`).join('\n') || 'None'}\n\n*Generated via FoodBook App*`;

    navigator.clipboard.writeText(text);
    setCopiedSummary(true);
    setTimeout(() => setCopiedSummary(false), 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 pb-16">
      {/* ADMIN PORTAL HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-black mb-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CANTEEN MANAGEMENT PORTAL</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Admin <span className="text-amber-400">Dashboard</span>
          </h1>
        </div>

        {/* Tab Switcher Pills */}
        <div className="p-1 rounded-full bg-[#181818] border border-zinc-800 flex items-center gap-1">
          <button
            onClick={() => setActiveTab('headcount')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
              activeTab === 'headcount'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Headcount
          </button>
          <button
            onClick={() => setActiveTab('menu')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
              activeTab === 'menu'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Edit Menu
          </button>
          <button
            onClick={() => setActiveTab('residents')}
            className={`px-4 py-2 rounded-full text-xs font-black transition-all ${
              activeTab === 'residents'
                ? 'bg-amber-500 text-black shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Whitelist ({activeResidents.length})
          </button>
        </div>
      </div>

      {/* TAB 1: HEADCOUNT OVERVIEW */}
      {activeTab === 'headcount' && (
        <div className="space-y-6">
          {/* Meal Type Switcher for Headcount */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="p-1 rounded-full bg-[#181818] border border-zinc-800 inline-flex items-center gap-1">
              <button
                onClick={() => setSelectedMealType('lunch')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedMealType === 'lunch'
                    ? 'bg-orange-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                Lunch
              </button>
              <button
                onClick={() => setSelectedMealType('dinner')}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                  selectedMealType === 'dinner'
                    ? 'bg-green-500 text-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                Dinner
              </button>
            </div>

            <TactileButton
              variant="neutral"
              size="sm"
              onClick={copyKitchenSummary}
              leftIcon={<Copy className="w-4 h-4 text-green-400" />}
            >
              {copiedSummary ? '✓ Copied for Kitchen!' : 'Copy WhatsApp Report'}
            </TactileButton>
          </div>

          {/* MASSIVE TYPOGRAPHY HEADCOUNT HERO CARD */}
          <TactileCard variant="elevated" glow="green" className="p-7 sm:p-9 text-center space-y-6">
            <div className="space-y-2">
              <Badge variant="green" size="md">
                LIVE HEADCOUNT • {selectedMealType.toUpperCase()}
              </Badge>
              {/* BIG TYPOGRAPHY */}
              <div className="pt-2">
                <span className="text-6xl sm:text-7xl font-black text-white tracking-tighter">
                  {headcount.eating}
                </span>
                <span className="text-3xl sm:text-4xl font-bold text-zinc-500 tracking-tight">
                  {' '}/ {headcount.total}
                </span>
              </div>
              <p className="text-lg font-black text-green-400 uppercase tracking-wide">
                Residents Eating Today
              </p>
            </div>

            {/* Progress Bar */}
            <div className="w-full max-w-md mx-auto space-y-2">
              <div className="h-4 w-full bg-zinc-800 rounded-full overflow-hidden p-0.5 border border-zinc-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${headcount.percentage}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                />
              </div>
              <div className="flex items-center justify-between text-xs font-bold text-zinc-400">
                <span>{headcount.percentage}% Turnout</span>
                <span>Cutoff: {new Date(activeMenu?.cutoff_time || '').toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>

            {/* Three Breakdown Cards */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="p-4 rounded-2xl bg-green-950/30 border border-green-800/40">
                <span className="text-2xl sm:text-3xl font-black text-green-400 block">
                  {headcount.eating}
                </span>
                <span className="text-[11px] font-bold text-zinc-400 uppercase">Eating</span>
              </div>

              <div className="p-4 rounded-2xl bg-red-950/30 border border-red-800/40">
                <span className="text-2xl sm:text-3xl font-black text-red-400 block">
                  {headcount.skipping}
                </span>
                <span className="text-[11px] font-bold text-zinc-400 uppercase">Skipping</span>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900 border border-zinc-800">
                <span className="text-2xl sm:text-3xl font-black text-zinc-400 block">
                  {headcount.unbooked}
                </span>
                <span className="text-[11px] font-bold text-zinc-500 uppercase">Pending</span>
              </div>
            </div>
          </TactileCard>

          {/* RESIDENT-BY-RESIDENT ATTENDANCE TABLE */}
          <TactileCard variant="default" className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-green-400" />
                Resident Attendance Breakdown
              </h3>
              <span className="text-xs text-zinc-400 font-bold">
                {activeResidents.length} Total Registered
              </span>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {activeResidents.map((res) => {
                const b = bookings.find((bk) => bk.menu_id === activeMenu?.id && bk.profile_id === res.id);
                const status = b ? b.status : 'pending';

                return (
                  <div key={res.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-200 flex items-center justify-center text-xs font-black">
                        {res.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white leading-tight">{res.name}</p>
                        <p className="text-xs text-zinc-400">
                          Room {res.room_number || 'N/A'} • {res.phone_number}
                        </p>
                      </div>
                    </div>

                    <div>
                      {status === 'eating' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-green-500/20 text-green-400 border border-green-500/40">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Eating
                        </span>
                      )}
                      {status === 'skipping' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-red-500/20 text-red-400 border border-red-500/40">
                          <XCircle className="w-3.5 h-3.5" />
                          Skipping
                        </span>
                      )}
                      {status === 'pending' && (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400">
                          <Clock className="w-3.5 h-3.5" />
                          Unbooked
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </TactileCard>
        </div>
      )}

      {/* TAB 2: MENU EDITOR */}
      {activeTab === 'menu' && (
        <TactileCard variant="elevated" className="p-7 space-y-6">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                <ChefHat className="w-5 h-5 text-amber-400" />
                Set Daily Menu & Cutoff Time
              </h2>
              <p className="text-xs text-zinc-400">
                Changes reflect instantly on resident screens.
              </p>
            </div>

            <div className="p-1 rounded-full bg-[#181818] border border-zinc-800 inline-flex items-center gap-1">
              <button
                type="button"
                onClick={() => setSelectedMealType('lunch')}
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedMealType === 'lunch' ? 'bg-amber-500 text-black' : 'text-zinc-400'
                }`}
              >
                Lunch
              </button>
              <button
                type="button"
                onClick={() => setSelectedMealType('dinner')}
                className={`px-3 py-1 rounded-full text-xs font-bold ${
                  selectedMealType === 'dinner' ? 'bg-amber-500 text-black' : 'text-zinc-400'
                }`}
              >
                Dinner
              </button>
            </div>
          </div>

          {menuSaveSuccess && (
            <div className="p-3.5 rounded-2xl bg-green-950/40 border border-green-800/60 text-xs text-green-300 flex items-center gap-2 font-bold">
              <CheckCircle2 className="w-4 h-4 text-green-400" />
              <span>{menuSaveSuccess}</span>
            </div>
          )}

          <form onSubmit={handleSaveMenu} className="space-y-4">
            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">
                Menu Theme / Title
              </label>
              <input
                type="text"
                value={menuTitle}
                onChange={(e) => setMenuTitle(e.target.value)}
                placeholder="e.g. Special Dum Biryani Night"
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-[#161616] border border-zinc-700 text-white font-bold placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">
                Food Items (Comma separated)
              </label>
              <textarea
                value={menuItemsText}
                onChange={(e) => setMenuItemsText(e.target.value)}
                rows={3}
                placeholder="Paneer Butter Masala, Dal Tadka, Butter Phulka, Jeera Rice, Gulab Jamun"
                required
                className="w-full px-4 py-3.5 rounded-2xl bg-[#161616] border border-zinc-700 text-white font-medium placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">
                  Strict Cutoff Time (24h format)
                </label>
                <input
                  type="time"
                  value={menuCutoffHour}
                  onChange={(e) => setMenuCutoffHour(e.target.value)}
                  required
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#161616] border border-zinc-700 text-white font-bold focus:outline-none focus:border-amber-500 transition-all text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">
                  Special Notes / Serving Timings
                </label>
                <input
                  type="text"
                  value={menuNotes}
                  onChange={(e) => setMenuNotes(e.target.value)}
                  placeholder="Dinner served from 8:00 PM to 10:00 PM"
                  className="w-full px-4 py-3.5 rounded-2xl bg-[#161616] border border-zinc-700 text-white font-medium focus:outline-none focus:border-amber-500 transition-all text-sm"
                />
              </div>
            </div>

            <div className="pt-3">
              <TactileButton
                type="submit"
                variant="orange"
                size="lg"
                fullWidth
                rightIcon={<ChefHat className="w-5 h-5" />}
              >
                Save & Broadcast Menu
              </TactileButton>
            </div>
          </form>
        </TactileCard>
      )}

      {/* TAB 3: RESIDENT WHITELIST DIRECTORY */}
      {activeTab === 'residents' && (
        <div className="space-y-6">
          {/* ADD RESIDENT FORM */}
          <TactileCard variant="elevated" className="p-7 space-y-4">
            <h2 className="text-xl font-black text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-green-400" />
              Add Resident to Whitelist
            </h2>
            <p className="text-xs text-zinc-400">
              Only phone numbers added here will be permitted to log in via OTP.
            </p>

            {residentAddSuccess && (
              <div className="p-3 rounded-2xl bg-green-950/40 border border-green-800/60 text-xs text-green-300 flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-green-400" />
                <span>{residentAddSuccess}</span>
              </div>
            )}

            {residentAddError && (
              <div className="p-3 rounded-2xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 font-bold">
                {residentAddError}
              </div>
            )}

            <form onSubmit={handleAddResident} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                value={newResidentName}
                onChange={(e) => setNewResidentName(e.target.value)}
                placeholder="Full Name (e.g. Sanya Gupta)"
                required
                className="px-4 py-3 rounded-2xl bg-[#161616] border border-zinc-700 text-white font-bold text-sm focus:outline-none focus:border-green-500"
              />

              <input
                type="tel"
                value={newResidentPhone}
                onChange={(e) => setNewResidentPhone(e.target.value)}
                placeholder="+91 9876543210"
                required
                className="px-4 py-3 rounded-2xl bg-[#161616] border border-zinc-700 text-white font-bold text-sm focus:outline-none focus:border-green-500"
              />

              <div className="flex gap-2">
                <input
                  type="text"
                  value={newResidentRoom}
                  onChange={(e) => setNewResidentRoom(e.target.value)}
                  placeholder="Room (e.g. 201-B)"
                  className="w-28 px-3 py-3 rounded-2xl bg-[#161616] border border-zinc-700 text-white font-bold text-sm focus:outline-none focus:border-green-500"
                />
                <TactileButton
                  type="submit"
                  variant="green"
                  size="md"
                  className="flex-1"
                  leftIcon={<Plus className="w-4 h-4 stroke-[3]" />}
                >
                  Add
                </TactileButton>
              </div>
            </form>
          </TactileCard>

          {/* WHITELIST DIRECTORY LIST */}
          <TactileCard variant="default" className="p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-green-400" />
                Authorized Whitelist ({profiles.length})
              </h3>

              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-500" />
                <input
                  type="text"
                  value={residentSearchQuery}
                  onChange={(e) => setResidentSearchQuery(e.target.value)}
                  placeholder="Search name or room..."
                  className="pl-9 pr-4 py-2 rounded-full bg-[#141414] border border-zinc-700 text-xs text-white focus:outline-none focus:border-green-500 w-full sm:w-56"
                />
              </div>
            </div>

            <div className="divide-y divide-zinc-800/80">
              {profiles
                .filter((p) =>
                  p.name.toLowerCase().includes(residentSearchQuery.toLowerCase()) ||
                  (p.room_number || '').toLowerCase().includes(residentSearchQuery.toLowerCase()) ||
                  p.phone_number.includes(residentSearchQuery)
                )
                .map((profile) => (
                  <div key={profile.id} className="py-3.5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-black ${
                        profile.role === 'admin' ? 'bg-amber-500 text-black' : 'bg-green-500 text-black'
                      }`}>
                        {profile.name.charAt(0)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-bold text-white leading-tight">{profile.name}</p>
                          <span className={`text-[10px] font-black uppercase px-2 py-0.2 rounded-full ${
                            profile.role === 'admin' ? 'bg-amber-500/20 text-amber-300' : 'bg-zinc-800 text-zinc-300'
                          }`}>
                            {profile.role}
                          </span>
                        </div>
                        <p className="text-xs text-zinc-400">
                          {profile.phone_number} • Room: <span className="text-zinc-300 font-bold">{profile.room_number || 'N/A'}</span>
                        </p>
                      </div>
                    </div>

                    {profile.role !== 'admin' && (
                      <button
                        onClick={() => handleRemoveResident(profile.id, profile.name)}
                        className="p-2 rounded-full text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Remove from whitelist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
            </div>
          </TactileCard>
        </div>
      )}
    </div>
  );
}
