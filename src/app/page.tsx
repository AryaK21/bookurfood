'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Navbar } from '@/components/ui/Navbar';
import { ResidentMealView } from '@/components/resident/ResidentMealView';
import { LoginForm } from '@/components/auth/LoginForm';
import { InstallAppPrompt } from '@/components/pwa/InstallAppPrompt';
import { Utensils } from 'lucide-react';
import Link from 'next/link';

import { AdminDashboard } from '@/components/admin/AdminDashboard';

export default function HomePage() {
  const { user, isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212] text-zinc-400 font-bold">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-green-500/20 border border-green-500/40 flex items-center justify-center text-green-400 animate-bounce">
            <Utensils className="w-6 h-6 stroke-[2.5]" />
          </div>
          <span>Loading FoodBook...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#121212]">
      <Navbar />

      <main className="flex-1 px-3.5 sm:px-6 py-3 sm:py-5 max-w-2xl mx-auto w-full space-y-3.5 sm:space-y-4 flex flex-col justify-center">
        {/* PWA 1-Tap Browser Install Prompt */}
        <InstallAppPrompt />

        {isAuthenticated && user ? (
          isAdmin ? (
            /* DIRECT ADMIN DASHBOARD VIEW FOR ADMIN ACCOUNT */
            <AdminDashboard />
          ) : (
            /* RESIDENT VIEW */
            <>
              {/* Welcome Resident Mini Bar */}
              <div className="flex items-center justify-between px-1">
                <div>
                  <p className="text-[11px] font-bold text-zinc-400">Welcome back,</p>
                  <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                    {user.name} 👋
                  </h1>
                </div>
                <div className="text-right">
                  <span className="inline-block text-[11px] font-black uppercase px-2.5 py-1 rounded-full bg-[#1e1e1e] border border-zinc-800 text-green-400">
                    Room {user.room_number || 'Resident'}
                  </span>
                </div>
              </div>

              {/* Resident Square Cards Meal Booking Interface */}
              <ResidentMealView />
            </>
          )
        ) : (
          <div className="py-2">
            <LoginForm />
          </div>
        )}
      </main>

      {!isAdmin && (
        <footer className="text-center py-2.5 border-t border-zinc-900/80 text-[11px] text-zinc-500 font-medium flex items-center justify-center gap-3">
          <span>FoodBook • PG Meal System</span>
          <span>•</span>
          <Link href="/install" className="text-zinc-400 hover:text-green-400 font-bold transition-colors">
            📲 Install as App
          </Link>
        </footer>
      )}
    </div>
  );
}
