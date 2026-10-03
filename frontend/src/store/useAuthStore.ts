'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  fetchMeRequest,
  getApiErrorMessage,
  loginRequest,
  registerPropertyRequest,
} from '@/lib/api';
import type {
  AuthProperty,
  AuthUser,
  LoginPayload,
  RegisterPropertyPayload,
} from '@/lib/types';

type AuthState = {
  token: string | null;
  user: AuthUser | null;
  property: AuthProperty | null;
  isHydrated: boolean;
  setHydrated: (value: boolean) => void;
  setSession: (payload: {
    token: string;
    user: AuthUser;
    property: AuthProperty | null;
  }) => void;
  clearSession: () => void;
  login: (payload: LoginPayload) => Promise<void>;
  registerProperty: (payload: RegisterPropertyPayload) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      property: null,
      isHydrated: false,

      setHydrated: (value) => set({ isHydrated: value }),

      setSession: ({ token, user, property }) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('vesperstay_token', token);
        }
        set({ token, user, property });
      },

      clearSession: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('vesperstay_token');
        }
        set({ token: null, user: null, property: null });
      },

      login: async (payload) => {
        try {
          const result = await loginRequest(payload);
          get().setSession({
            token: result.token,
            user: result.user,
            property: result.property,
          });
        } catch (error) {
          throw new Error(getApiErrorMessage(error, 'Unable to sign in'));
        }
      },

      registerProperty: async (payload) => {
        try {
          const result = await registerPropertyRequest(payload);
          get().setSession({
            token: result.token,
            user: result.user,
            property: result.property,
          });
        } catch (error) {
          throw new Error(
            getApiErrorMessage(error, 'Unable to launch property'),
          );
        }
      },

      refreshMe: async () => {
        const token = get().token;
        if (!token) {
          return;
        }
        try {
          const result = await fetchMeRequest();
          set({ user: result.user, property: result.property });
        } catch {
          get().clearSession();
        }
      },

      logout: () => {
        get().clearSession();
      },
    }),
    {
      name: 'vesperstay-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        property: state.property,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
        if (state?.token && typeof window !== 'undefined') {
          localStorage.setItem('vesperstay_token', state.token);
        }
      },
    },
  ),
);
