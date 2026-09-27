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
        isInitialized: true,
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
      isInitialized: true,
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
    set({ user: null, token: null, isInitialized: true, error: null });
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

    // Step 1: Immediately restore cached user session from localStorage
    let cachedProfile: UserProfile | null = null;
    const cached = localStorage.getItem('landguard_user');
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        cachedProfile = {
          id: parsed.userId || parsed.id || 'USR-LOGGED-IN',
          email: parsed.email || '',
          fullName: parsed.fullName || parsed.full_name || 'LandGuard User',
          role: parsed.role || 'SUPER_ADMIN',
          designation: parsed.designation,
          department: parsed.department,
          district: parsed.district,
          zone: parsed.zone,
          isActive: true,
        };
        set({ user: cachedProfile, token, isInitialized: true });
      } catch {}
    }

    // Step 2: Validate/refresh session with live backend
    try {
      const liveUser = await authApi.getCurrentUser();
      if (liveUser) {
        set({ user: liveUser, token, isInitialized: true });
        localStorage.setItem(
          'landguard_user',
          JSON.stringify({
            accessToken: token,
            tokenType: 'bearer',
            role: liveUser.role,
            userId: liveUser.id,
            email: liveUser.email,
            fullName: liveUser.fullName,
            designation: liveUser.designation,
            department: liveUser.department,
            district: liveUser.district,
            zone: liveUser.zone,
          })
        );
        return liveUser;
      }
    } catch (err: any) {
      if (err?.status === 401) {
        authApi.logout();
        set({ user: null, token: null, isInitialized: true });
        return null;
      }
    }

    // If live check returned null or non-401 error, keep the cached profile
    if (cachedProfile) {
      return cachedProfile;
    }

    const currentUser = get().user;
    if (currentUser) return currentUser;

    return null;
  },

  setUser: (user: UserProfile | null) => set({ user }),
}));
