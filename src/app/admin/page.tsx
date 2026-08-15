'use client';

import React from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { Navbar } from '@/components/ui/Navbar';
import { TactileCard } from '@/components/ui/TactileCard';
import { TactileButton } from '@/components/ui/TactileButton';
import { ShieldAlert, LogIn, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function AdminPage() {
  const { user, isAdmin, isLoading, loginAsDemoUser } = useAuth();

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
          <div className="max-w-md mx-auto py-12">
            <TactileCard variant="elevated" className="p-8 text-center space-y-5">
              <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center mx-auto text-amber-400">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="space-y-1.5">
                <h2 className="text-2xl font-black text-white">Admin Access Required</h2>
                <p className="text-xs text-zinc-400">
                  {user 
                    ? `You are currently logged in as "${user.name}" with role "${user.role}". Only Canteen Admins can manage menus and headcounts.`
                    : 'You must log in with an authorized Admin account to access this portal.'
                  }
                </p>
              </div>

              <div className="space-y-2 pt-2">
                <TactileButton
                  variant="orange"
                  size="md"
                  fullWidth
                  onClick={() => loginAsDemoUser('admin', '+919876543210')}
                >
                  Switch to Admin (Manager Rao)
                </TactileButton>

                <Link href="/" className="block">
                  <TactileButton variant="neutral" size="md" fullWidth>
                    Back to Resident Menu
                  </TactileButton>
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
