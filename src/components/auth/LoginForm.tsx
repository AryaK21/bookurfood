'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/auth-context';
import { TactileButton } from '@/components/ui/TactileButton';
import { TactileCard } from '@/components/ui/TactileCard';
import { Badge } from '@/components/ui/Badge';
import { Shield, Phone, KeyRound, AlertCircle, CheckCircle2, ArrowRight, Sparkles, UserX, Lock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function LoginForm() {
  const router = useRouter();
  const { sendOtp, verifyOtp, loginAsDemoUser, error, clearError } = useAuth();

  const [phone, setPhone] = useState('+919876543211');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp' | 'rejected'>('phone');
  const [loading, setLoading] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<string>('');
  const [infoMessage, setInfoMessage] = useState<string>('');

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setRejectionMessage('');
    setInfoMessage('');

    if (!phone || phone.length < 10) {
      return;
    }

    setLoading(true);
    const result = await sendOtp(phone);
    setLoading(false);

    if (result.success) {
      setInfoMessage(result.message || 'Verification code sent!');
      setStep('otp');
    } else {
      setRejectionMessage(result.error || 'Access Denied: Your phone number is not on the resident whitelist.');
      setStep('rejected');
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    if (!otp || otp.length < 4) {
      return;
    }

    setLoading(true);
    const result = await verifyOtp(phone, otp);
    setLoading(false);

    if (result.success) {
      router.push('/');
    }
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
      {/* Brand Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1e1e1e] border border-zinc-800 text-xs font-black text-green-400">
          <Lock className="w-3.5 h-3.5" />
          <span>STRICTLY INVITE-ONLY</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
          Food<span className="text-green-500">Book</span>
        </h1>
        <p className="text-sm text-zinc-400 max-w-xs mx-auto">
          PG Meal Booking & Headcount System. Only pre-authorized residents can access.
        </p>
      </div>

      <TactileCard variant="elevated" glow={step === 'rejected' ? 'none' : 'green'} className="p-6 sm:p-8">
        <AnimatePresence mode="wait">
          {/* STEP 1: PHONE NUMBER INPUT */}
          {step === 'phone' && (
            <motion.form
              key="phone-step"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              onSubmit={handleSendOtp}
              className="space-y-5"
            >
              <div className="space-y-1.5">
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-400">
                  Registered Mobile Number
                </label>
                <div className="relative flex items-center">
                  <div className="absolute left-4 text-zinc-400">
                    <Phone className="w-5 h-5" />
                  </div>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#161616] border-2 border-zinc-700/80 text-white font-bold placeholder-zinc-500 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all text-lg tracking-wide"
                  />
                </div>
                <p className="text-[11px] text-zinc-400">
                  Must match the number registered in your PG lease agreement.
                </p>
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <TactileButton
                type="submit"
                variant="green"
                size="lg"
                fullWidth
                isLoading={loading}
                rightIcon={<ArrowRight className="w-5 h-5" />}
              >
                Send Login OTP
              </TactileButton>
            </motion.form>
          )}

          {/* STEP 2: OTP VERIFICATION */}
          {step === 'otp' && (
            <motion.form
              key="otp-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              onSubmit={handleVerifyOtp}
              className="space-y-5"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-zinc-400">
                  Enter 6-Digit OTP
                </span>
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-xs text-green-400 hover:underline font-bold"
                >
                  Change Number
                </button>
              </div>

              {infoMessage && (
                <div className="p-3.5 rounded-2xl bg-green-950/40 border border-green-800/60 text-xs text-green-300 flex items-start gap-2.5">
                  <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                  <span>{infoMessage}</span>
                </div>
              )}

              <div className="relative flex items-center">
                <div className="absolute left-4 text-zinc-400">
                  <KeyRound className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.trim())}
                  placeholder="123456"
                  autoFocus
                  required
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-[#161616] border-2 border-zinc-700/80 text-white font-black text-2xl tracking-[0.3em] text-center placeholder-zinc-600 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all"
                />
              </div>

              {error && (
                <div className="p-3.5 rounded-2xl bg-red-950/40 border border-red-800/60 text-xs text-red-300 flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              <TactileButton
                type="submit"
                variant="green"
                size="lg"
                fullWidth
                isLoading={loading}
                rightIcon={<CheckCircle2 className="w-5 h-5" />}
              >
                Verify & Enter App
              </TactileButton>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={loading}
                  className="text-xs text-zinc-400 hover:text-white font-medium underline"
                >
                  Didn&apos;t get code? Resend OTP
                </button>
              </div>
            </motion.form>
          )}

          {/* STEP 3: STRICT ANTI-SPAM REJECTION STATE */}
          {step === 'rejected' && (
            <motion.div
              key="rejected-step"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-4 py-2"
            >
              <div className="w-16 h-16 rounded-full bg-red-500/20 border-2 border-red-500/40 flex items-center justify-center mx-auto text-red-400 shadow-[0_0_30px_rgba(239,68,68,0.3)]">
                <UserX className="w-8 h-8" />
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-white">Not on Resident Whitelist</h3>
                <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                  {rejectionMessage || 'This mobile number is not registered in the PG resident database.'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#141414] border border-zinc-800 text-left text-xs text-zinc-300 space-y-1.5">
                <p className="font-bold text-zinc-200">How to get access?</p>
                <p className="text-zinc-400 text-[11px]">
                  1. Contact the PG Canteen Manager.<br />
                  2. Request them to add your phone number to the whitelist in the Admin Portal.<br />
                  3. Return here and log in instantly.
                </p>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <TactileButton
                  variant="neutral"
                  size="md"
                  fullWidth
                  onClick={() => {
                    setStep('phone');
                    clearError();
                  }}
                >
                  Try Another Number
                </TactileButton>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </TactileCard>

      {/* QUICK DEMO PERSONA SELECTOR FOR INSTANT PAIR-PROGRAMMING TEST */}
      <TactileCard variant="default" className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="w-4 h-4 text-amber-400" />
          <h4 className="text-xs font-black uppercase tracking-wider text-zinc-300">
            1-Click Demo Accounts (Instant Test)
          </h4>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            type="button"
            onClick={async () => {
              await loginAsDemoUser('resident', '+919876543211');
              router.push('/');
            }}
            className="p-2.5 rounded-xl bg-[#141414] border border-zinc-700/60 hover:border-green-500/50 hover:bg-zinc-800/80 text-left transition-all group"
          >
            <span className="block text-xs font-bold text-white group-hover:text-green-400">
              Aarav Sharma
            </span>
            <span className="text-[10px] text-zinc-400 block">Resident • Room 204</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              await loginAsDemoUser('resident', '+919876543212');
              router.push('/');
            }}
            className="p-2.5 rounded-xl bg-[#141414] border border-zinc-700/60 hover:border-green-500/50 hover:bg-zinc-800/80 text-left transition-all group"
          >
            <span className="block text-xs font-bold text-white group-hover:text-green-400">
              Rohan Verma
            </span>
            <span className="text-[10px] text-zinc-400 block">Resident • Room 108</span>
          </button>

          <button
            type="button"
            onClick={async () => {
              await loginAsDemoUser('admin', '+919876543210');
              router.push('/admin');
            }}
            className="p-2.5 rounded-xl bg-[#141414] border border-amber-600/40 hover:border-amber-500 hover:bg-amber-950/20 text-left transition-all group"
          >
            <span className="block text-xs font-bold text-amber-300 group-hover:text-amber-200">
              Manager Rao
            </span>
            <span className="text-[10px] text-amber-400/80 block">Admin • Full Access</span>
          </button>
        </div>

        {/* Test unwhitelisted rejection button */}
        <div className="mt-3 pt-2.5 border-t border-zinc-800 flex items-center justify-between">
          <span className="text-[11px] text-zinc-400">Test Anti-Spam Rejection:</span>
          <button
            type="button"
            onClick={() => {
              setPhone('+919999999999');
              setStep('phone');
            }}
            className="text-[11px] font-bold text-red-400 hover:underline"
          >
            Load Unregistered +919999999999
          </button>
        </div>
      </TactileCard>
    </div>
  );
}
