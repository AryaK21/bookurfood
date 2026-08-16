'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { DataStore } from '@/lib/data/data-store';
import type { Profile } from '@/types/database.types';

interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  error: string | null;
  loginWithPhone: (phone: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDevAdmin: (id: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

const CURRENT_USER_KEY = 'foodbook_session_user_prod_v1';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Initialize session from localStorage
  useEffect(() => {
    function initAuth() {
      setIsLoading(true);
      try {
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

  // 1-Step Direct Phone Login (Checks if registered in database)
  const loginWithPhone = async (phone: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    const cleanPhone = phone.trim();

    if (!cleanPhone || cleanPhone.replace(/\D/g, '').length < 10) {
      const err = 'Please enter a valid 10-digit mobile number.';
      setError(err);
      return { success: false, error: err };
    }

    // Check if the number is registered in the PG database
    const whitelistResult = await DataStore.verifyWhitelist(cleanPhone);
    if (!whitelistResult.isWhitelisted || !whitelistResult.profile) {
      const rejectionMsg =
        'This phone number is not registered in the PG directory. Please ask your PG Manager to add you.';
      setError(rejectionMsg);
      return { success: false, error: rejectionMsg };
    }

    const profile = whitelistResult.profile;
    setUser(profile);
    localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(profile));
    return { success: true };
  };

  // Developer Admin Login for /admin (id: admin, pass: Arya@21)
  const loginAsDevAdmin = async (id: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setError(null);
    if (id.trim() === 'admin' && pass === 'Arya@21') {
      const adminProfile: Profile = {
        id: '00000000-0000-0000-0000-000000000001',
        user_id: 'admin-01',
        phone_number: '+918208315074',
        name: 'Pramod Shelke',
        room_number: 'Office',
        role: 'admin',
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setUser(adminProfile);
      localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(adminProfile));
      return { success: true };
    }
    const err = 'Invalid developer credentials. Please check ID and password.';
    setError(err);
    return { success: false, error: err };
  };

  // Sign out & clear saved credentials
  const logout = async () => {
    setUser(null);
    localStorage.removeItem(CURRENT_USER_KEY);
  };

  const clearError = () => setError(null);

  const value: AuthState = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    error,
    loginWithPhone,
    loginAsDevAdmin,
    logout,
    clearError,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
