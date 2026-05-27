'use client';

import { useEffect, useState, useRef, RefObject } from 'react';

/**
 * Strategi hydration untuk setiap MFE
 * Menentukan KAPAN sebuah MFE akan di-hydrate (diaktifkan)
 */
export type HydrationStrategy =
  | 'eager'       // Hydrate segera (above fold, interactive)
  | 'lazy'        // Hydrate saat scroll ke viewport
  | 'idle'        // Hydrate saat browser idle (requestIdleCallback)
  | 'interaction' // Hydrate hanya saat user interact (hover/click)
  | 'never';      // Static, tidak perlu hydration

/**
 * Konfigurasi hydration per MFE
 */
export const MFE_HYDRATION: Record<string, HydrationStrategy> = {
  header: 'eager',           // Navigasi — harus segera
  hero: 'eager',             // Hero section — above fold
  catalog: 'lazy',           // Product grid — scroll-triggered
  checkout: 'interaction',   // Checkout — saat user akan checkout
  dashboard: 'lazy',         // Dashboard — lazy load
  recommendations: 'idle',   // Rekomendasi — low priority
  chatWidget: 'interaction', // Chat — saat user hover
  footer: 'never',           // Footer statis
};

/**
 * Hook untuk lazy hydration
 * Mengontrol kapan sebuah komponen/MFE di-hydrate berdasarkan strategi
 *
 * @example
 * ```tsx
 * const MyComponent = () => {
 *   const ref = useRef(null);
 *   const hydrated = useLazyHydration(ref, 'lazy');
 *   return <div ref={ref}>{hydrated ? <ActualComponent /> : <Skeleton />}</div>;
 * };
 * ```
 */
export function useLazyHydration(
  ref: RefObject<HTMLElement | null>,
  strategy: HydrationStrategy
): boolean {
  const [hydrated, setHydrated] = useState(strategy === 'eager');

  useEffect(() => {
    if (strategy === 'eager') return;

    let cleanup: (() => void) | undefined;

    if (strategy === 'idle') {
      const hasIdleCallback = typeof requestIdleCallback !== 'undefined';
      const id = hasIdleCallback
        ? requestIdleCallback(() => setHydrated(true), { timeout: 2000 })
        : (setTimeout(() => setHydrated(true), 2000) as unknown as number);

      cleanup = () => {
        if (hasIdleCallback) {
          cancelIdleCallback(id as number);
        } else {
          clearTimeout(id as unknown as number);
        }
      };
    }

    if (strategy === 'lazy' && ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setHydrated(true);
            observer.disconnect();
          }
        },
        { rootMargin: '200px' } // Mulai load 200px sebelum masuk viewport
      );
      observer.observe(ref.current);
      cleanup = () => observer.disconnect();
    }

    if (strategy === 'interaction' && ref.current) {
      const el = ref.current;

      const handler = () => {
        setHydrated(true);
        el.removeEventListener('mouseover', handler);
        el.removeEventListener('touchstart', handler);
        el.removeEventListener('focus', handler);
      };

      el.addEventListener('mouseover', handler, { once: true });
      el.addEventListener('touchstart', handler, { once: true });
      el.addEventListener('focus', handler, { once: true });

      cleanup = () => {
        el.removeEventListener('mouseover', handler);
        el.removeEventListener('touchstart', handler);
        el.removeEventListener('focus', handler);
      };
    }

    return cleanup;
  }, [strategy, ref]);

  return hydrated;
}
