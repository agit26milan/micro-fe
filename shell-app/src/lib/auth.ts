/**
 * Authentication & Security — Centralized Auth di Shell
 *
 * Auth disimpan di shell, disebarkan ke MFE via:
 * 1. Event Bus untuk React MFEs
 * 2. DOM Properties untuk Web Components (Vue/Angular)
 * 3. Shared cookie untuk SSR
 */

'use client';

import { useState, useEffect } from 'react';
import { eventBus, MFE_EVENTS } from './event-bus';

// ── Types ──

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'guest' | 'user' | 'admin';
  avatar?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ── Auth Storage ──

const AUTH_STORAGE_KEY = 'mfe:auth';

function getStoredAuth(): AuthState {
  if (typeof window === 'undefined') {
    return { user: null, token: null, isLoading: true, isAuthenticated: false };
  }
  try {
    const stored = localStorage.getItem(AUTH_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        user: parsed.user,
        token: parsed.token,
        isLoading: false,
        isAuthenticated: !!parsed.user,
      };
    }
  } catch {
    // ignore
  }
  return { user: null, token: null, isLoading: false, isAuthenticated: false };
}

function persistAuth(auth: AuthState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({ user: auth.user, token: auth.token })
    );
  } catch {
    // ignore
  }
}

// ── Auth Manager ──

class AuthManager {
  private state: AuthState = getStoredAuth();
  private listeners: Set<(state: AuthState) => void> = new Set();

  private notify() {
    this.listeners.forEach((fn) => fn({ ...this.state }));
  }

  /** Login — set user + token, propagate ke semua MFE */
  login(user: User, token: string) {
    this.state = {
      user,
      token,
      isLoading: false,
      isAuthenticated: true,
    };
    persistAuth(this.state);
    this.notify();

    // Propagate ke semua MFE via Event Bus
    eventBus.emit(MFE_EVENTS.USER_LOGGED_IN, 'shell', { user });

    // Propagate ke Web Components (Vue/Angular)
    this.updateWebComponents(user);
  }

  /** Logout — hapus user + token */
  logout() {
    const oldUser = this.state.user;
    this.state = {
      user: null,
      token: null,
      isLoading: false,
      isAuthenticated: false,
    };
    localStorage.removeItem(AUTH_STORAGE_KEY);
    this.notify();

    // Propagate ke semua MFE via Event Bus
    if (oldUser) {
      eventBus.emit(MFE_EVENTS.USER_LOGGED_OUT, 'shell', { userId: oldUser.id });
    }

    // Bersihkan Web Component properties
    this.updateWebComponents(null);
  }

  /** Set loading state */
  setLoading(loading: boolean) {
    this.state = { ...this.state, isLoading: loading };
    this.notify();
  }

  /** Get current auth state */
  getState(): AuthState {
    return { ...this.state };
  }

  /** Subscribe to auth changes */
  subscribe(fn: (state: AuthState) => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  /** Propagate ke Web Components via DOM properties */
  private updateWebComponents(user: User | null) {
    if (typeof window === 'undefined') return;

    const components = [
      document.querySelector('mfe-checkout'),
      document.querySelector('mfe-dashboard'),
    ];

    components.forEach((el) => {
      if (el) {
        (el as any).userId = user?.id || null;
      }
    });
  }
}

/** Singleton auth manager */
export const authManager = new AuthManager();

/**
 * React hook untuk auth state
 *
 * @example
 * ```tsx
 * const { user, isAuthenticated, isLoading } = useAuth();
 * if (isLoading) return <Loading />;
 * if (!isAuthenticated) return <LoginPage />;
 * return <Dashboard />;
 * ```
 */
export function useAuth() {
  const [state, setState] = useState<AuthState>(authManager.getState());

  useEffect(() => {
    const unsubscribe = authManager.subscribe(setState);
    return unsubscribe;
  }, []);

  return {
    ...state,
    login: authManager.login.bind(authManager),
    logout: authManager.logout.bind(authManager),
  };
}
