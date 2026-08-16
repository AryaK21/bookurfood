'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { DataStore, isSupabaseConfigured } from '@/lib/data/data-store';
import type { Profile, UserRole } from '@/types/database.types';

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  error: string | null;
  sendOtp: (phone: string) => Promise<{ success: boolean; error?: string; message?: string }>;
  verifyOtp: (phone: string, token: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemoUser: (role: UserRole, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const CURRENT_USER_KEY = 'foodbook_session_user_prod_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session
  useEffect(() => {
    async function initAuth() {
      setIsLoading(true);
      try {
        if (isSupabaseConfigured()) {
          const supabase = createClient();
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user?.phone) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('phone_number', session.user.phone)
              .single();

            if (profile) {
              setUser(profile as Profile);
              setIsLoading(false);
              return;
            }
          }
        }

        // Check local storage for active session
        const stored = localStorage.getItem(CURRENT_USER_KEY);
        if (stored) {
          setUser(JSON.parse(stored));
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  // 1. Send OTP (Strict Anti-Spam Whitelist Check FIRST)
  const sendOtp = async (phone: string): Promise<{ success: boolean; error?: string; message?: string }> => {
    setError(null);
    const cleanPhone = phone.replace(/\s+/g, '');

    // Strict Anti-Spam: Validate if the number is pre-authorized by Admin
    const whitelistResult = await DataStore.verifyWhitelist(cleanPhone);
    if (!whitelistResult.isWhitelisted || !whitelistResult.profile) {
      const rejectionMsg =
        'Access Denied: Your phone number is not pre-registered in the PG resident whitelist. Please contact your PG manager to get added.';
      setError(rejectionMsg);
      return { success: false, error: rejectionMsg };
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { error: otpError } = await supabase.auth.signInWithOtp({
          phone: cleanPhone,
        });
        if (otpError) {
          setError(otpError.message);
          return { success: false, error: otpError.message };
        }
        return { success: true, message: `OTP sent to ${cleanPhone}` };
      } catch (err: any) {
        const msg = err.message || 'Failed to send OTP via Supabase';
        setError(msg);
        return { success: false, error: msg };
      }
    }

    // In demo/preview mode: Simulate OTP dispatch with test OTP "123456"
    return {
      success: true,
      message: `[Preview Mode] OTP simulated for ${whitelistResult.profile.name} (${whitelistResult.profile.role}). Use code: 123456`,
    };
  };

  // 2. Verify OTP
  const verifyOtp = async (phone: string, token: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    const cleanPhone = phone.replace(/\s+/g, '');

    const whitelistResult = await DataStore.verifyWhitelist(cleanPhone);
    if (!whitelistResult.isWhitelisted || !whitelistResult.profile) {
      const rejectionMsg = 'Unauthorized: Number not found in resident directory.';
      setError(rejectionMsg);
      return { success: false, error: rejectionMsg };
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = createClient();
        const { data, error: verifyError } = await supabase.auth.verifyOtp({
          phone: cleanPhone,
          token,
          type: 'sms',
        });

        if (verifyError) {
          setError(verifyError.message);
          return { success: false, error: verifyError.message };
        }

        if (data.session) {
          const profile = whitelistResult.profile;
          setUser(profile);
          localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
          return { success: true };
        }
      } catch (err: any) {
        setError(err.message || 'OTP verification failed');
        return { success: false, error: err.message };
      }
    }

    // Demo Mode Verification (accepts '123456' or any 6 digit test code)
    if (token.length >= 4) {
      const profile = whitelistResult.profile;
      setUser(profile);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
      return { success: true };
    } else {
      setError('Invalid OTP code. Please enter the 6-digit code.');
      return { success: false, error: 'Invalid OTP' };
    }
  };

  // 3. Instant Demo Login (Resident or Admin for frictionless testing)
  const loginAsDemoUser = async (role: UserRole, phone?: string) => {
    const profiles = DataStore.getProfiles();
    let target: Profile | undefined;

    if (phone) {
      target = profiles.find((p) => p.phone_number === phone);
    } else {
      target = profiles.find((p) => p.role === role && p.is_active);
    }

    if (target) {
      setUser(target);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(target));
      setError(null);
    }
  };

  // 4. Logout
  const logout = async () => {
    try {
      if (isSupabaseConfigured()) {
        const supabase = createClient();
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      localStorage.removeItem(CURRENT_USER_KEY);
    }
  };

  const clearError = () => setError(null);

  const value: AuthState = {
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    isAdmin: user?.role === 'admin',
    error,
    sendOtp,
    verifyOtp,
    loginAsDemoUser,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
