'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { Utensils, Shield, LogOut, User, ChevronDown, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Navbar() {
  const { user, isAdmin, logout, loginAsDemoUser } = useAuth();
  const pathname = usePathname();
  const [showSwitchMenu, setShowSwitchMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#121212]/85 border-b border-zinc-800/80 px-4 sm:px-6 py-3.5 transition-all">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-[#22c55e] to-[#15803d] flex items-center justify-center shadow-[0_4px_12px_rgba(34,197,94,0.35)] border-b-[3px] border-[#166534] group-hover:scale-105 transition-transform">
            <Utensils className="w-5 h-5 text-black font-extrabold stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-lg font-black tracking-tight text-white group-hover:text-green-400 transition-colors">
                FoodBook
              </span>
              <span className="px-1.5 py-0.2 text-[10px] font-black uppercase tracking-wider bg-green-500/20 text-green-400 border border-green-500/30 rounded-md">
                PG
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium leading-none">
              Smart Meal Booking
            </p>
          </div>
        </Link>

        {/* Right Action Area */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Admin Navigation Button */}
          {isAdmin && (
            <Link href={pathname === '/admin' ? '/' : '/admin'}>
              <button className={`
                flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all border-b-[3px]
                ${pathname === '/admin' 
                  ? 'bg-zinc-800 text-zinc-300 border-zinc-950 hover:bg-zinc-700' 
                  : 'bg-gradient-to-r from-amber-500 to-orange-500 text-black border-amber-700 shadow-[0_4px_12px_rgba(245,158,11,0.3)] hover:brightness-110'
                }
              `}>
                <Shield className="w-3.5 h-3.5" />
                <span>{pathname === '/admin' ? 'Resident View' : 'Admin Portal'}</span>
              </button>
            </Link>
          )}

          {/* User Profile Pill & Demo Switcher */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowSwitchMenu(!showSwitchMenu)}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#1e1e1e] border border-zinc-700/70 border-b-[3px] border-b-zinc-900 text-xs font-bold text-zinc-200 hover:bg-[#252525] transition-all"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${
                  user.role === 'admin' ? 'bg-amber-500 text-black' : 'bg-green-500 text-black'
                }`}>
                  {user.name.charAt(0)}
                </div>
                <div className="text-left hidden xs:block sm:block max-w-[110px] truncate">
                  <span className="block truncate leading-tight">{user.name.split(' ')[0]}</span>
                  <span className="text-[10px] text-zinc-400 font-medium">
                    {user.room_number || user.role}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
              </button>

              {/* Quick Persona Switcher Dropdown */}
              <AnimatePresence>
                {showSwitchMenu && (
                  <>
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowSwitchMenu(false)}
                    />
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#1c1c1c] border border-zinc-700 shadow-2xl p-2 z-50 overflow-hidden"
                    >
                      <div className="px-3 py-2 border-b border-zinc-800">
                        <p className="text-xs font-bold text-white truncate">{user.name}</p>
                        <p className="text-[11px] text-zinc-400">{user.phone_number}</p>
                        <span className="inline-block mt-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300">
                          {user.role} • Room {user.room_number || 'N/A'}
                        </span>
                      </div>

                      <div className="p-1">
                        <button
                          onClick={() => {
                            logout();
                            setShowSwitchMenu(false);
                          }}
                          className="w-full text-left px-3 py-2.5 rounded-xl text-xs font-bold text-red-400 hover:bg-red-500/10 flex items-center gap-2 transition-colors cursor-pointer"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/login">
              <button className="px-4 py-2 rounded-full bg-green-500 text-black text-xs font-black border-b-[3px] border-green-700 hover:bg-green-400 transition-all">
                Sign In
              </button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
