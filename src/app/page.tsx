'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { Navbar } from '@/components/ui/Navbar';
import { ResidentMealView } from '@/components/resident/ResidentMealView';
import { PushNotificationPrompt } from '@/components/pwa/PushNotificationPrompt';
import { LoginForm } from '@/components/auth/LoginForm';
import { Sparkles, Utensils, Shield } from 'lucide-react';
import Link from 'next/link';

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

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-2xl mx-auto w-full space-y-6">
        {isAuthenticated && user ? (
          <>
            {/* Welcome Resident Banner */}
            <div className="flex items-center justify-between px-1">
              <div>
                <p className="text-xs font-bold text-zinc-400">Welcome back,</p>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                  {user.name} 👋
                </h1>
              </div>
              <div className="text-right">
                <span className="inline-block text-xs font-black uppercase px-3 py-1 rounded-full bg-[#1e1e1e] border border-zinc-800 text-green-400">
                  Room {user.room_number || 'Resident'}
                </span>
              </div>
            </div>

            {/* Resident Meal Booking Interface */}
            <ResidentMealView />

            {/* Daily Web Push Notifications Banner */}
            <PushNotificationPrompt />
          </>
        ) : (
          <div className="py-4">
            <LoginForm />
          </div>
        )}
      </main>

      <footer className="text-center py-6 border-t border-zinc-900 text-xs text-zinc-600 font-medium">
        FoodBook • PG Canteen Meal Booking System • PWA
      </footer>
    </div>
  );
}
