/**
 * URL State Management
 *
 * Menggunakan URL sebagai shared state untuk data yang perlu SEO.
 * Cocok untuk: filter, pagination, sorting — data yang perlu di-crawl.
 *
 * Strategi:
 * - Data publik & SEO → URL (searchParams)
 * - Data sementara → sessionStorage
 * - Data persistence → localStorage
 * - Cross-MFE → Event Bus
 */

'use client';

import { useCallback, useMemo } from 'react';
import { useRouter } from 'next/router';

// ── Types ──

export interface URLState<T extends Record<string, string>> {
  state: T;
  setState: (updates: Partial<T>) => void;
  resetState: () => void;
}

// ── Storage Helpers ──

const STORAGE_PREFIX = 'mfe:';

/**
 * Save state to sessionStorage (hilang saat tab ditutup)
 */
export function saveSessionState<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn('sessionStorage write failed:', e);
  }
}

/**
 * Load state from sessionStorage
 */
export function loadSessionState<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = sessionStorage.getItem(STORAGE_PREFIX + key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

/**
 * Save state to localStorage (persistent)
 */
export function saveLocalState<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage write failed:', e);
  }
}

/**
 * Load state from localStorage
 */
export function loadLocalState<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const stored = localStorage.getItem(STORAGE_PREFIX + key);
    return stored ? (JSON.parse(stored) as T) : fallback;
  } catch {
    return fallback;
  }
}

// ── URL State Hook ──

/**
 * Hook untuk mengelola state via URL search params.
 * Data yang disimpan di URL bisa di-crawl oleh search engine.
 *
 * @example
 * ```tsx
 * const { state, setState } = useURLState({ category: 'all', sort: 'price', page: '1' });
 *
 * // Update filter
 * setState({ category: 'electronics', page: '1' });
 *
 * // Baca state
 * console.log(state.category); // 'electronics'
 * ```
 */
export function useURLState<T extends Record<string, string>>(
  defaults: T
): URLState<T> {
  const router = useRouter();
  const { pathname, query, replace } = router;

  // Baca state dari URL, fallback ke default
  const state = useMemo(() => {
    const result = { ...defaults } as T;
    if (query) {
      Object.keys(defaults).forEach((key) => {
        const value = query[key];
        if (typeof value === 'string') {
          (result as any)[key] = value;
        }
      });
    }
    return result;
  }, [query, defaults]);

  // Update URL dengan state baru
  const setState = useCallback(
    (updates: Partial<T>) => {
      const params = new URLSearchParams(
        Object.entries({ ...state, ...updates }).map(([k, v]) => [k, String(v)])
      );

      // Hapus params yang sama dengan default
      Object.entries(defaults).forEach(([key, defaultVal]) => {
        const currentVal = updates[key as keyof T] ?? state[key as keyof T];
        if (String(currentVal) === String(defaultVal)) {
          params.delete(key);
        }
      });

      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;

      replace(url, undefined, { shallow: true, scroll: false });
    },
    [state, defaults, pathname, replace]
  );

  // Reset ke default
  const resetState = useCallback(() => {
    replace(pathname, undefined, { shallow: true, scroll: false });
  }, [pathname, replace]);

  return { state, setState, resetState };
}

/**
 * Generate canonical URL from search params
 */
export function buildCanonicalURL(
  baseUrl: string,
  params: Record<string, string>,
  significantKeys: string[]
): string {
  const url = new URL(baseUrl);
  significantKeys.forEach((key) => {
    if (params[key]) {
      url.searchParams.set(key, params[key]);
    }
  });
  return url.toString();
}
