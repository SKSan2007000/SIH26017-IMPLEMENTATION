'use client';

import { create } from 'zustand';
import { authApi, UserProfile, AuthTokenResponse } from '@/lib/api/auth';

export type RoleType =
  | 'SUPER_ADMIN'
  | 'PROJECT_HEAD'
  | 'DISTRICT_OFFICER'
  | 'LAND_ACQUISITION_OFFICER'
  | 'FIELD_OFFICER'
  | 'SUPERVISOR'
  | 'CITIZEN'
  | 'CONTRACTOR';

export function getRoleDashboardPath(role?: string | null): string {
  if (!role) return '/signin';
  const r = role.toUpperCase();
  switch (r) {
    case 'SUPER_ADMIN':
      return '/admin';
    case 'PROJECT_HEAD':
      return '/dashboard/project-head';
    case 'DISTRICT_OFFICER':
      return '/dashboard/district';
    case 'LAND_ACQUISITION_OFFICER':
      return '/dashboard/land-acquisition';
    case 'FIELD_OFFICER':
      return '/dashboard/field';
    case 'SUPERVISOR':
      return '/dashboard/supervisor';
    case 'CITIZEN':
      return '/portal/citizen';
    case 'CONTRACTOR':
      return '/portal/contractor';
    default:
      return '/dashboard/project-head';
  }
}

interface AuthState {
  user: UserProfile | null;
  token: string | null;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AuthTokenResponse>;
  loginDemo: (email: string, role?: string) => AuthTokenResponse;
  register: (data: {
    email: string;
    fullName: string;
    password: string;
    role?: string;
    phone?: string;
    district?: string;
    zone?: string;
    address?: string;
  }) => Promise<UserProfile>;
  logout: () => void;
  initAuth: () => Promise<UserProfile | null>;
  setUser: (user: UserProfile | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  isLoading: false,
  isInitialized: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const res = await authApi.login(email, password);
      const userProfile: UserProfile = {
        id: res.userId,
        email: res.email,
        fullName: res.fullName,
        role: res.role,
        isActive: true,
      };
      set({
        user: userProfile,
        token: res.accessToken,
        isLoading: false,
        error: null,
      });
      return res;
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || 'Authentication failed. Please verify credentials.';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  loginDemo: (email: string, role?: string) => {
    const res = authApi.loginDemo(email, role);
    const userProfile: UserProfile = {
      id: res.userId,
      email: res.email,
      fullName: res.fullName,
      role: res.role,
      isActive: true,
    };
    set({
      user: userProfile,
      token: res.accessToken,
      isLoading: false,
      error: null,
    });
    return res;
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const user = await authApi.register(data);
      set({ isLoading: false, error: null });
      return user;
    } catch (err: any) {
      const msg = err?.data?.detail || err?.message || 'Registration failed.';
      set({ isLoading: false, error: msg });
      throw new Error(msg);
    }
  },

  logout: () => {
    authApi.logout();
    set({ user: null, token: null, error: null });
    if (typeof window !== 'undefined') {
      window.location.href = '/signin';
    }
  },

  initAuth: async () => {
    if (typeof window === 'undefined') return null;
    const token = localStorage.getItem('landguard_token');
    if (!token) {
      set({ user: null, token: null, isInitialized: true });
      return null;
    }

    try {
      const user = await authApi.getCurrentUser();
      if (user) {
        set({ user, token, isInitialized: true });
        return user;
      }
    } catch {
      // Backend request may have failed if backend is offline
    }

    // If backend is offline but cached session exists in localStorage, restore it!
    const cached = localStorage.getItem('landguard_user');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        const userProfile: UserProfile = {
          id: parsed.userId || 'USR-DEMO',
          email: parsed.email || 'demo@landguard.ai',
          fullName: parsed.fullName || 'LandGuard User',
          role: parsed.role || 'SUPER_ADMIN',
          isActive: true,
        };
        set({ user: userProfile, token, isInitialized: true });
        return userProfile;
      } catch {}
    }

    // Token invalid or unauthenticated -> clear session
    authApi.logout();
    set({ user: null, token: null, isInitialized: true });
    return null;
  },

  setUser: (user: UserProfile | null) => set({ user }),
}));
