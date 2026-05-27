/**
 * Rendering Strategy per Route
 *
 * Mendefinisikan bagaimana setiap halaman harus di-render:
 * - SSR: Server-side rendering (getServerSideProps) — SEO kritis, konten dinamis
 * - SSG: Static site generation (getStaticProps) — konten statis, performa maksimal
 * - ISR: Incremental static regeneration — SSG + revalidate period
 * - CSR: Client-side rendering — tidak perlu SEO, perlu auth
 *
 * Pages Router hanya mendukung SSR/SSG/ISR via data fetching methods.
 * Streaming SSR tidak tersedia di Pages Router (hanya App Router).
 */

export type RenderingStrategy = 'ssr' | 'ssg' | 'isr' | 'csr';

export interface RouteConfig {
  strategy: RenderingStrategy;
  revalidate?: number; // Untuk ISR: revalidate dalam detik
  seo: boolean; // Apakah halaman perlu SEO
  auth?: boolean; // Apakah perlu authentication
  prefetchMFE?: string[]; // MFE mana yang di-prefetch
}

/**
 * Route rendering strategy matrix
 *
 * Route                    Strategy        Alasan
 * ──────────────────────────────────────────────────────────
 * /                        SSG + ISR       Landing page, konten stabil
 * /catalog                 SSR + Streaming Product list dengan filter (CSR untuk MFE)
 * /catalog/[slug]          SSR             Detail produk, SEO kritis (belum diimplementasi)
 * /checkout                CSR             Butuh auth, tidak perlu SEO
 * /dashboard               CSR             Authenticated, realtime data
 */
export const ROUTE_STRATEGY: Record<string, RouteConfig> = {
  '/': {
    strategy: 'isr',
    revalidate: 3600, // Revalidate tiap 1 jam
    seo: true,
    prefetchMFE: ['catalog'],
  },
  '/catalog': {
    strategy: 'csr',
    seo: true, // SEO via metadata dari shell
    prefetchMFE: ['catalog'],
  },
  '/catalog/[slug]': {
    strategy: 'ssr',
    seo: true,
    prefetchMFE: ['catalog'],
  },
  '/checkout': {
    strategy: 'csr',
    seo: false,
    auth: true,
  },
  '/dashboard': {
    strategy: 'csr',
    seo: false,
    auth: true,
  },
};

/**
 * Helper untuk menentukan strategi rendering berdasarkan pathname
 */
export function getRouteStrategy(pathname: string): RouteConfig {
  // Exact match dulu
  if (ROUTE_STRATEGY[pathname]) {
    return ROUTE_STRATEGY[pathname];
  }

  // Dynamic route match: /catalog/[slug] → cocokkan pattern
  const patterns = Object.keys(ROUTE_STRATEGY).filter((route) => route.includes('['));
  for (const pattern of patterns) {
    const regex = new RegExp(
      '^' + pattern.replace(/\[.*?\]/g, '[^/]+') + '$'
    );
    if (regex.test(pathname)) {
      return ROUTE_STRATEGY[pattern];
    }
  }

  // Default: SSR
  return {
    strategy: 'ssr',
    seo: true,
  };
}
