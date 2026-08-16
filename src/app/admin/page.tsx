'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { Navbar } from '@/components/ui/Navbar';
import { TactileCard } from '@/components/ui/TactileCard';
import { TactileButton } from '@/components/ui/TactileButton';
import { Shield, KeyRound, User, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { user, isAdmin, isLoading, loginAsDevAdmin, error, clearError } = useAuth();

  const [adminId, setAdminId] = useState('');
  const [adminPass, setAdminPass] = useState('');
  const [devError, setDevError] = useState('');
  const [devLoading, setDevLoading] = useState(false);

  const handleDevLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setDevError('');

    if (!adminId || !adminPass) {
      setDevError('Please enter admin ID and password.');
      return;
    }

    setDevLoading(true);
    const result = await loginAsDevAdmin(adminId, adminPass);
    setDevLoading(false);

    if (!result.success) {
      setDevError(result.error || 'Invalid developer admin credentials.');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#121212] text-zinc-400 font-bold">
        Loading Admin Portal...
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-[#121212]">
      <Navbar />

      <main className="flex-1 px-4 sm:px-6 py-6 sm:py-8 max-w-4xl mx-auto w-full">
        {isAdmin ? (
          <AdminDashboard />
        ) : (
          <div className="max-w-md mx-auto py-6 sm:py-10 space-y-4">
            <TactileCard variant="elevated" glow="orange" className="p-6 sm:p-8 space-y-5">
              <div className="text-center space-y-1.5">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center mx-auto text-amber-400 shadow-[0_0_25px_rgba(245,158,11,0.25)]">
                  <Shield className="w-7 h-7 stroke-[2.5]" />
                </div>
                <h1 className="text-xl sm:text-2xl font-black text-white">
                  Developer & Admin Access
                </h1>
                <p className="text-xs text-zinc-400 max-w-xs mx-auto">
                  Login with developer credentials to manage menus, headcounts, and residents.
                </p>
              </div>

              {/* DEVELOPER LOGIN FORM */}
              <form onSubmit={handleDevLogin} className="space-y-3.5 pt-1">
                {/* ID */}
                <div className="space-y-1">
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                    Admin ID
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-zinc-400">
                      <User className="w-4 h-4" />
                    </div>
                    <input
                      type="text"
                      value={adminId}
                      onChange={(e) => {
                        setAdminId(e.target.value);
                        if (devError) setDevError('');
                      }}
                      placeholder="admin"
                      required
                      autoFocus
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#141414] border border-zinc-700 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-1">
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
                    Password
                  </label>
                  <div className="relative flex items-center">
                    <div className="absolute left-3.5 text-zinc-400">
                      <KeyRound className="w-4 h-4" />
                    </div>
                    <input
                      type="password"
                      value={adminPass}
                      onChange={(e) => {
                        setAdminPass(e.target.value);
                        if (devError) setDevError('');
                      }}
                      placeholder="••••••••"
                      required
                      className="w-full pl-10 pr-4 py-3 rounded-2xl bg-[#141414] border border-zinc-700 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                {/* ERROR FEEDBACK */}
                {(devError || error) && (
                  <div className="p-3 rounded-2xl bg-red-950/60 border border-red-800 text-xs text-red-300 font-bold flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-400" />
                    <span>{devError || error}</span>
                  </div>
                )}

                {/* SUBMIT BUTTON */}
                <div className="pt-2">
                  <TactileButton
                    type="submit"
                    variant="orange"
                    size="lg"
                    fullWidth
                    isLoading={devLoading}
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    Unlock Admin Dashboard
                  </TactileButton>
                </div>
              </form>

              {/* QUICK PHONE LOGIN LINK */}
              <div className="pt-2 border-t border-zinc-800 text-center">
                <Link href="/" className="text-xs text-zinc-400 hover:text-green-400 font-medium transition-colors">
                  ← Back to Resident Phone Login
                </Link>
              </div>
            </TactileCard>
          </div>
        )}
      </main>

      <footer className="text-center py-6 border-t border-zinc-900 text-xs text-zinc-600 font-medium">
        FoodBook PG Canteen Management • Secure Admin System
      </footer>
    </div>
  );
}
