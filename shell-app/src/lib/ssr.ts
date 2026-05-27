import type {
  GetServerSidePropsContext,
  GetStaticPropsContext,
  InferGetServerSidePropsType,
  InferGetStaticPropsType,
} from 'next';

/**
 * SSR Utility untuk Pages Router
 *
 * Menyediakan helper patterns untuk:
 * - getServerSideProps (SSR) — data real-time, SEO kritis
 * - getStaticProps (SSG) — data statis, performa maksimal
 * - getStaticProps + revalidate (ISR) — data semi-statis
 *
 * Setiap MFE yang di-load di halaman SSR perlu:
 * 1. Data fetching via BFF (Backend For Frontend)
 * 2. SEO metadata (title, description, openGraph)
 * 3. Structured data (JSON-LD) untuk product listing
 */

// ── Types ──

export interface SEOData {
  title: string;
  description: string;
  canonical?: string | null;
  ogImage?: string | null;
  noIndex?: boolean;
  structuredData?: Record<string, unknown> | null;
}

export interface SSRPageProps<T = unknown> {
  data: T | null;
  seo: SEOData;
  error?: string;
  timestamp: number;
  isFallback?: boolean;
}

// ── Helpers ──

/**
 * Base SEO config — override di setiap page
 */
export const BASE_SEO: SEOData = {
  title: 'MFE Store',
  description: 'Micro Frontend demo — Next.js Shell dengan React, Vue & Angular remotes',
};

/**
 * Buat default props untuk SSR page dengan error handling
 *
 * @example
 * ```tsx
 * export const getServerSideProps = createSSRProps(async (ctx) => {
 *   const product = await fetchProduct(ctx.params?.slug);
 *   return {
 *     data: product,
 *     seo: { title: product.name, description: product.description },
 *   };
 * });
 * ```
 */
export function createSSRProps<T>(
  fetcher: (ctx: GetServerSidePropsContext) => Promise<{
    data: T;
    seo: Partial<SEOData>;
  }>
) {
  return async (
    ctx: GetServerSidePropsContext
  ): Promise<{ props: SSRPageProps<T> }> => {
    try {
      const result = await fetcher(ctx);
      return {
        props: {
          data: result.data,
          seo: { ...BASE_SEO, ...result.seo },
          timestamp: Date.now(),
        },
      };
    } catch (error) {
      console.error(`SSR Error for ${ctx.resolvedUrl}:`, error);
      return {
        props: {
          data: null,
          seo: { ...BASE_SEO, title: 'Error', noIndex: true },
          error: error instanceof Error ? error.message : 'Failed to load data',
          timestamp: Date.now(),
        },
      };
    }
  };
}

/**
 * Buat default props untuk SSG/ISR page
 *
 * @example
 * ```tsx
 * export const getStaticProps = createStaticProps(async () => {
 *   const products = await fetchProducts();
 *   return {
 *     data: products,
 *     seo: { title: 'Catalog', description: 'Our product catalog' },
 *     revalidate: 3600, // ISR: revalidate tiap jam
 *   };
 * });
 * ```
 */
export function createStaticProps<T>(
  fetcher: (ctx: GetStaticPropsContext) => Promise<{
    data: T;
    seo: Partial<SEOData>;
    revalidate?: number;
  }>
) {
  return async (
    ctx: GetStaticPropsContext
  ): Promise<{
    props: SSRPageProps<T>;
    revalidate?: number;
  }> => {
    try {
      const result = await fetcher(ctx);
      return {
        props: {
          data: result.data,
          seo: { ...BASE_SEO, ...result.seo },
          timestamp: Date.now(),
        },
        revalidate: result.revalidate,
      };
    } catch (error) {
      console.error('SSG Error:', error);
      return {
        props: {
          data: null,
          seo: { ...BASE_SEO, title: 'Error', noIndex: true },
          error: error instanceof Error ? error.message : 'Failed to load data',
          timestamp: Date.now(),
        },
      };
    }
  };
}

/**
 * Generate structured data (JSON-LD) untuk produk
 */
export function productStructuredData(product: {
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  sku: string;
  availability?: 'InStock' | 'OutOfStock';
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    image: product.image,
    sku: product.sku,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: product.currency,
      availability: `https://schema.org/${product.availability || 'InStock'}`,
    },
  };
}

/**
 * Generate structured data untuk BreadcrumbList
 */
export function breadcrumbStructuredData(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Type helpers untuk component props
 */
export type SSRProps<T extends (...args: any) => any> = InferGetServerSidePropsType<T>;
export type SSGProps<T extends (...args: any) => any> = InferGetStaticPropsType<T>;
