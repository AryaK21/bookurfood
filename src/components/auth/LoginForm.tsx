'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { TactileButton } from '@/components/ui/TactileButton';
import { TactileCard } from '@/components/ui/TactileCard';
import { ArrowRight, Lock, UserX } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LoginForm() {
  const router = useRouter();
  const { loginWithPhone, error, clearError } = useAuth();

  const [phoneDigits, setPhoneDigits] = useState('');
  const [loading, setLoading] = useState(false);
  const [rejectionError, setRejectionError] = useState<string>('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setRejectionError('');

    const cleanDigits = phoneDigits.replace(/\D/g, '');
    if (cleanDigits.length !== 10) {
      setRejectionError('Please enter your 10-digit mobile number.');
      return;
    }

    setLoading(true);
    const fullNumber = `+91${cleanDigits}`;
    const result = await loginWithPhone(fullNumber);
    setLoading(false);

    if (result.success) {
      router.push('/');
    } else {
      setRejectionError(
        result.error ||
          'This mobile number is not registered. Please contact your PG manager to get added.'
      );
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-5">
      {/* Brand Header */}
      <div className="text-center space-y-1.5">
        <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-[#1e1e1e] border border-zinc-800 text-[11px] font-black text-green-400">
          <Lock className="w-3 h-3" />
          <span>PG RESIDENTS ONLY</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Food<span className="text-green-500">Book</span>
        </h1>
        <p className="text-xs text-zinc-400 max-w-xs mx-auto">
          Enter your registered mobile number to access daily meals & plate booking.
        </p>
      </div>

      <TactileCard variant="elevated" glow={rejectionError ? 'none' : 'green'} className="p-6 sm:p-7">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-black uppercase tracking-wider text-zinc-300">
              Registered Mobile Number
            </label>

            {/* LOCKED +91 PREFIX CONTAINER */}
            <div className="relative flex items-center rounded-2xl bg-[#161616] border-2 border-zinc-700/80 focus-within:border-green-500 focus-within:ring-2 focus-within:ring-green-500/20 transition-all overflow-hidden shadow-inner">
              <div className="flex items-center gap-1.5 pl-3.5 pr-3 py-3.5 bg-zinc-900 border-r border-zinc-700/80 text-zinc-300 font-black text-sm select-none flex-shrink-0">
                <span className="text-base">🇮🇳</span>
                <span>+91</span>
              </div>
              <input
                type="tel"
                maxLength={10}
                value={phoneDigits}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setPhoneDigits(val);
                  if (rejectionError) setRejectionError('');
                }}
                placeholder="98765 43210"
                required
                autoFocus
                className="w-full px-4 py-3.5 bg-transparent text-white font-black placeholder-zinc-600 focus:outline-none text-base sm:text-lg tracking-widest"
              />
            </div>
            <p className="text-[11px] text-zinc-500">
              No OTP required. Instant login if registered in the PG directory.
            </p>
          </div>

          {/* REJECTION MESSAGE */}
          <AnimatePresence>
            {(rejectionError || error) && (
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                className="p-3.5 rounded-2xl bg-red-950/50 border border-red-800/70 text-xs text-red-300 space-y-1.5"
              >
                <div className="flex items-center gap-2 font-bold text-red-200">
                  <UserX className="w-4 h-4 flex-shrink-0 text-red-400" />
                  <span>Not Found in Resident Whitelist</span>
                </div>
                <p className="text-[11px] text-red-300/90 leading-relaxed">
                  {rejectionError || error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LOGIN BUTTON */}
          <div className="pt-1">
            <TactileButton
              type="submit"
              variant="green"
              size="lg"
              fullWidth
              isLoading={loading}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Continue to FoodBook
            </TactileButton>
          </div>
        </form>
      </TactileCard>
    </div>
  );
}
