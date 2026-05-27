# 🏗️ Micro Frontend Architecture
### SSR-Ready · Multi-Framework · SEO-Optimized · Docker-Deployable

> **Target Audience**: Senior Frontend Developer  
> **Stack**: React · Vue · Angular · Module Federation · SSR · Docker  
> **Goal**: Production-grade Micro Frontend dengan SEO optimal dan deployment siap pakai

---

## 📋 Daftar Isi

1. [Overview Arsitektur](#1-overview-arsitektur)
2. [Tech Stack & Decision Matrix](#2-tech-stack--decision-matrix)
3. [Step 1 — Setup Shell Application (Host)](#step-1--setup-shell-application-host)
4. [Step 2 — Setup Remote Apps (MFE)](#step-2--setup-remote-apps-mfe)
5. [Step 3 — Konfigurasi Module Federation](#step-3--konfigurasi-module-federation)
6. [Step 4 — SSR Strategy](#step-4--ssr-strategy)
7. [Step 5 — SEO Optimization](#step-5--seo-optimization)
8. [Step 6 — Shared Dependencies & Design System](#step-6--shared-dependencies--design-system)
9. [Step 7 — State Management Cross-App](#step-7--state-management-cross-app)
10. [Step 8 — Authentication & Security](#step-8--authentication--security)
11. [Step 9 — CI/CD Pipeline](#step-9--cicd-pipeline)
12. [Step 10 — Docker & Deployment](#step-10--docker--deployment)
13. [Best Practices Checklist](#best-practices-checklist)
14. [Troubleshooting Guide](#troubleshooting-guide)

---

## 1. Overview Arsitektur

```
┌─────────────────────────────────────────────────────────────┐
│                    NGINX Reverse Proxy                       │
│                   (SSL Termination + Routing)                │
└──────────────┬──────────────┬──────────────┬────────────────┘
               │              │              │
    ┌──────────▼──────┐ ┌─────▼──────┐ ┌────▼───────────┐
    │  Shell App      │ │  CDN/Edge  │ │  API Gateway   │
    │  (Next.js SSR)  │ │  (Assets)  │ │  (BFF Pattern) │
    └──────────┬──────┘ └────────────┘ └────────────────┘
               │
    ┌──────────┴────────────────────────────────┐
    │           Module Federation Host           │
    │   ┌─────────────────────────────────────┐  │
    │   │         Runtime Orchestrator        │  │
    │   └──────┬──────────┬──────────┬────────┘  │
    │          │          │          │            │
    │  ┌───────▼──┐ ┌─────▼───┐ ┌───▼────────┐  │
    │  │ MFE React│ │MFE Vue  │ │MFE Angular │  │
    │  │ (Catalog)│ │(Checkout)│ │(Dashboard) │  │
    │  │ :3001    │ │ :3002   │ │  :3003     │  │
    │  └──────────┘ └─────────┘ └────────────┘  │
    └────────────────────────────────────────────┘
```

### Prinsip Arsitektur

| Prinsip | Implementasi |
|---------|-------------|
| **Independence** | Setiap MFE deploy & scale secara mandiri |
| **Technology Agnostic** | React, Vue, Angular bisa coexist |
| **SSR First** | Next.js sebagai shell, remote apps support hydration |
| **SEO Optimized** | Meta tags terpusat, structured data, sitemap dinamis |
| **Fault Isolation** | Error boundary per MFE, graceful degradation |

---

## 2. Tech Stack & Decision Matrix

### Core Technologies

```
Shell Application:     Next.js 14+ (App Router) — SSR & SSG
Module Federation:     Webpack 5 Module Federation + @module-federation/enhanced
React MFE:             React 18 + Vite + vite-plugin-federation
Vue MFE:               Vue 3 + Vite + vite-plugin-federation
Angular MFE:           Angular 17+ + @angular-architects/module-federation
State Sharing:         Custom Event Bus + Zustand/Pinia (per app)
Routing:               Shell owns top-level routes, MFE owns sub-routes
Styling:               CSS Variables (shared design tokens) + CSS Modules per app
Container:             Docker + Docker Compose + Nginx
Orchestration:         Kubernetes (optional, lihat Step 10)
```

### Kapan Pakai Apa

```
SSR penuh        → Halaman landing, blog, product detail (SEO kritis)
SSG              → Marketing pages, dokumentasi (performa maksimal)
CSR (hydration)  → Dashboard, fitur interaktif berat, authenticated areas
Edge Rendering   → A/B testing, geolocation-based content
```

---

## Step 1 — Setup Shell Application (Host)

### 1.1 Inisialisasi Next.js Shell

```bash
# Buat shell app dengan Next.js 14 App Router
npx create-next-app@latest shell-app \
  --typescript \
  --tailwind \
  --eslint \
  --app \
  --src-dir

cd shell-app
npm install @module-federation/nextjs-mf
npm install @module-federation/enhanced
```

### 1.2 Struktur Folder Shell

```
shell-app/
├── src/
│   ├── app/
│   │   ├── layout.tsx          ← Root layout (metadata global)
│   │   ├── page.tsx            ← Home page (SSR)
│   │   ├── catalog/
│   │   │   └── [[...slug]]/
│   │   │       └── page.tsx    ← Load React MFE
│   │   ├── checkout/
│   │   │   └── page.tsx        ← Load Vue MFE
│   │   └── dashboard/
│   │       └── page.tsx        ← Load Angular MFE
│   ├── components/
│   │   ├── MFELoader/
│   │   │   ├── index.tsx       ← Universal MFE loader
│   │   │   ├── ErrorBoundary.tsx
│   │   │   └── Skeleton.tsx
│   │   └── Shell/
│   │       ├── Header.tsx
│   │       ├── Footer.tsx
│   │       └── Navigation.tsx
│   ├── lib/
│   │   ├── mfe-registry.ts     ← Daftar semua remote MFEs
│   │   ├── event-bus.ts        ← Cross-MFE communication
│   │   └── shared-store.ts     ← Shared state (auth, cart, user)
│   └── styles/
│       ├── globals.css
│       └── design-tokens.css   ← CSS custom properties bersama
├── next.config.js
├── Dockerfile
└── package.json
```

### 1.3 next.config.js dengan Module Federation

```javascript
// next.config.js
const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Aktifkan SSR dengan streaming
  experimental: {
    serverActions: true,
  },

  webpack(config, options) {
    const { isServer } = options;

    config.plugins.push(
      new NextFederationPlugin({
        name: 'shell',
        remotes: {
          // React MFE (Catalog)
          mfe_react: isServer
            ? `mfe_react@http://mfe-react:3001/_next/static/chunks/remoteEntry.js`
            : `mfe_react@http://localhost:3001/_next/static/chunks/remoteEntry.js`,

          // Vue MFE (Checkout)
          mfe_vue: isServer
            ? `mfe_vue@http://mfe-vue:3002/remoteEntry.js`
            : `mfe_vue@http://localhost:3002/remoteEntry.js`,

          // Angular MFE (Dashboard)
          mfe_angular: isServer
            ? `mfe_angular@http://mfe-angular:3003/remoteEntry.js`
            : `mfe_angular@http://localhost:3003/remoteEntry.js`,
        },
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          // Shell bisa expose komponen ke MFE lain
          './SharedHeader': './src/components/Shell/Header',
          './SharedNav': './src/components/Shell/Navigation',
        },
        shared: {
          // Shared libs — sinkron versi dengan semua MFE!
          react: { singleton: true, requiredVersion: '^18.0.0' },
          'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        },
        extraOptions: {
          skipSharingNextInternals: false,
        },
      })
    );

    return config;
  },
};

module.exports = nextConfig;
```

### 1.4 Universal MFE Loader Component

```tsx
// src/components/MFELoader/index.tsx
'use client';

import React, { Suspense, lazy, ComponentType, useEffect, useRef } from 'react';
import ErrorBoundary from './ErrorBoundary';
import Skeleton from './Skeleton';

interface MFELoaderProps {
  // Untuk React MFE (Module Federation)
  modulePath?: string;
  // Untuk Vue/Angular MFE (Web Components atau iframe)
  webComponentTag?: string;
  // Props yang diteruskan ke MFE
  props?: Record<string, unknown>;
  // Fallback saat loading
  skeleton?: React.ReactNode;
  // Error fallback
  errorFallback?: React.ReactNode;
  // SSR: apakah perlu di-render server-side
  ssr?: boolean;
}

// Loader untuk React-based MFE
const ReactMFELoader = ({ modulePath, props = {} }: { modulePath: string; props: Record<string, unknown> }) => {
  const Component = lazy(() => import(/* webpackIgnore: true */ modulePath));
  return <Component {...props} />;
};

// Loader untuk Web Component (Vue/Angular)
const WebComponentLoader = ({ tag, props = {} }: { tag: string; props: Record<string, unknown> }) => {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    // Teruskan props sebagai attributes/properties
    Object.entries(props).forEach(([key, value]) => {
      if (typeof value === 'object') {
        (ref.current as any)[key] = value;
      } else {
        ref.current!.setAttribute(key, String(value));
      }
    });
  }, [props]);

  return React.createElement(tag, { ref });
};

export const MFELoader: React.FC<MFELoaderProps> = ({
  modulePath,
  webComponentTag,
  props = {},
  skeleton = <Skeleton />,
  errorFallback,
  ssr = false,
}) => {
  const content = modulePath ? (
    <ReactMFELoader modulePath={modulePath} props={props} />
  ) : webComponentTag ? (
    <WebComponentLoader tag={webComponentTag} props={props} />
  ) : null;

  // Skip SSR untuk non-critical MFEs
  if (!ssr && typeof window === 'undefined') {
    return <>{skeleton}</>;
  }

  return (
    <ErrorBoundary fallback={errorFallback}>
      <Suspense fallback={skeleton}>{content}</Suspense>
    </ErrorBoundary>
  );
};
```

### 1.5 MFE Registry

```typescript
// src/lib/mfe-registry.ts
export interface MFEConfig {
  name: string;
  remoteUrl: string;
  remoteUrlSSR: string;
  exposedModule: string;
  webComponentTag?: string; // Untuk Vue/Angular
  ssr: boolean;
  prefetch: boolean;
}

export const MFE_REGISTRY: Record<string, MFEConfig> = {
  catalog: {
    name: 'mfe_react',
    remoteUrl: 'http://localhost:3001/_next/static/chunks/remoteEntry.js',
    remoteUrlSSR: 'http://mfe-react:3001/_next/static/chunks/remoteEntry.js',
    exposedModule: 'mfe_react/CatalogApp',
    ssr: true,
    prefetch: true,
  },
  checkout: {
    name: 'mfe_vue',
    remoteUrl: 'http://localhost:3002/remoteEntry.js',
    remoteUrlSSR: 'http://mfe-vue:3002/remoteEntry.js',
    exposedModule: 'mfe_vue/CheckoutApp',
    webComponentTag: 'mfe-checkout', // Vue dikompilasi jadi Web Component
    ssr: false, // Vue MFE: CSR dengan hydration
    prefetch: false,
  },
  dashboard: {
    name: 'mfe_angular',
    remoteUrl: 'http://localhost:3003/remoteEntry.js',
    remoteUrlSSR: 'http://mfe-angular:3003/remoteEntry.js',
    exposedModule: 'mfe_angular/DashboardApp',
    webComponentTag: 'mfe-dashboard', // Angular Elements
    ssr: false,
    prefetch: false,
  },
};
```

---

## Step 2 — Setup Remote Apps (MFE)

### 2.1 React MFE (Catalog — dengan SSR)

```bash
# Setup React MFE dengan Next.js untuk SSR support
npx create-next-app@latest mfe-react \
  --typescript \
  --tailwind \
  --app

cd mfe-react
npm install @module-federation/nextjs-mf
```

**`mfe-react/next.config.js`**:
```javascript
const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

module.exports = {
  webpack(config, { isServer }) {
    config.plugins.push(
      new NextFederationPlugin({
        name: 'mfe_react',
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          './CatalogApp': './src/app/catalog/index.tsx',
          './ProductCard': './src/components/ProductCard/index.tsx',
        },
        shared: {
          react: { singleton: true, requiredVersion: '^18.0.0' },
          'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
        },
      })
    );
    return config;
  },
};
```

### 2.2 Vue MFE (Checkout — sebagai Web Component)

```bash
npm create vue@latest mfe-vue -- --typescript
cd mfe-vue
npm install vite-plugin-federation @vitejs/plugin-vue
```

**`mfe-vue/vite.config.ts`**:
```typescript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    vue({
      // Kompilasi Vue components menjadi Web Components
      customElement: true,
    }),
    federation({
      name: 'mfe_vue',
      filename: 'remoteEntry.js',
      exposes: {
        './CheckoutApp': './src/components/CheckoutApp.ce.vue', // .ce.vue = custom element
      },
      shared: {
        vue: { singleton: true },
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
  },
});
```

**`mfe-vue/src/components/CheckoutApp.ce.vue`**:
```vue
<script setup lang="ts">
// Props dari shell app
const props = defineProps<{
  cartItems?: string; // JSON string (Web Component hanya terima string/primitif via attrs)
  userId?: string;
}>();

// Parse JSON props
const cart = computed(() => {
  try {
    return props.cartItems ? JSON.parse(props.cartItems) : [];
  } catch {
    return [];
  }
});

// Emit events ke shell via Custom Events
const emit = (event: string, detail: unknown) => {
  window.dispatchEvent(new CustomEvent(`mfe:checkout:${event}`, { detail }));
};
</script>

<template>
  <div class="checkout-app">
    <!-- Checkout UI -->
  </div>
</template>

<style scoped>
/* Style encapsulated dalam Shadow DOM */
.checkout-app {
  /* gunakan CSS variables dari shell untuk konsistensi */
  font-family: var(--font-sans, system-ui);
  color: var(--color-text, #111);
}
</style>
```

**`mfe-vue/src/main.ts`** — Register sebagai Web Component:
```typescript
import { defineCustomElement } from 'vue';
import CheckoutApp from './components/CheckoutApp.ce.vue';

// Register sebagai Web Component
const CheckoutElement = defineCustomElement(CheckoutApp);
customElements.define('mfe-checkout', CheckoutElement);
```

### 2.3 Angular MFE (Dashboard — Angular Elements)

```bash
ng new mfe-angular --routing --style=scss
cd mfe-angular

# Install Angular Elements & Module Federation
npm install @angular/elements @webcomponents/custom-elements
npm install @angular-architects/module-federation
ng add @angular-architects/module-federation
```

**`mfe-angular/webpack.config.js`**:
```javascript
const { shareAll, withModuleFederationPlugin } = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: 'mfe_angular',
  exposes: {
    './DashboardApp': './src/app/dashboard/dashboard.module.ts',
    './DashboardWebComponent': './src/bootstrap-wc.ts',
  },
  shared: {
    ...shareAll({ singleton: true, strictVersion: true, requiredVersion: 'auto' }),
  },
});
```

**`mfe-angular/src/bootstrap-wc.ts`** — Register Angular sebagai Web Component:
```typescript
import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { DashboardComponent } from './app/dashboard/dashboard.component';

(async () => {
  const app = await createApplication({
    providers: [
      // providers di sini
    ],
  });

  const DashboardElement = createCustomElement(DashboardComponent, {
    injector: app.injector,
  });

  customElements.define('mfe-dashboard', DashboardElement);
})();
```

---

## Step 3 — Konfigurasi Module Federation

### 3.1 Strategi Loading MFE

```typescript
// src/lib/mfe-loader.ts — Dynamic remote loading
export async function loadRemoteModule(
  remoteName: string,
  exposedModule: string
): Promise<unknown> {
  // @ts-ignore — Module Federation runtime API
  const container = window[remoteName];

  if (!container) {
    throw new Error(`Remote "${remoteName}" not found. Pastikan remoteEntry.js sudah dimuat.`);
  }

  // Inisialisasi shared scope
  await container.init(__webpack_share_scopes__.default);

  // Dapatkan factory dari exposed module
  const factory = await container.get(exposedModule);
  const Module = factory();

  return Module;
}
```

### 3.2 Prefetching untuk Performa

```typescript
// src/app/layout.tsx — Prefetch critical MFE assets
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <head>
        {/* Prefetch React MFE — critical path */}
        <link
          rel="modulepreload"
          href={process.env.NEXT_PUBLIC_MFE_REACT_URL + '/remoteEntry.js'}
        />
        {/* Prefetch Vue MFE — second priority */}
        <link
          rel="prefetch"
          href={process.env.NEXT_PUBLIC_MFE_VUE_URL + '/remoteEntry.js'}
          as="script"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

### 3.3 Runtime Fallback (Graceful Degradation)

```typescript
// src/components/MFELoader/ErrorBoundary.tsx
'use client';

import React from 'react';

interface Props {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  mfeName?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class MFEErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log ke monitoring service (Sentry, DataDog, etc.)
    console.error(`MFE "${this.props.mfeName}" gagal load:`, error, errorInfo);

    // Kirim ke error tracking
    if (typeof window !== 'undefined' && window.__errorTracker) {
      window.__errorTracker.captureException(error, {
        tags: { mfe: this.props.mfeName },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div role="alert" className="mfe-error">
            <p>Fitur ini sedang tidak tersedia. Silakan refresh halaman.</p>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
```

---

## Step 4 — SSR Strategy

### 4.1 Rendering Strategy per Route

```
Route                    Strategy        Alasan
──────────────────────────────────────────────────────────
/                        SSG + ISR       Landing page, konten stabil
/catalog/[slug]          SSR             Dynamic content, SEO kritis
/catalog                 SSR + Streaming Product list dengan filter
/checkout                CSR             Butuh auth, tidak perlu SEO
/dashboard               CSR             Authenticated, realtime data
/blog/[slug]             SSG             Static content, performa max
```

### 4.2 Streaming SSR dengan React Suspense

```tsx
// src/app/catalog/page.tsx
import { Suspense } from 'react';
import { MFELoader } from '@/components/MFELoader';

// Metadata untuk SEO (Server Component)
export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await fetchProduct(params.slug);
  return {
    title: `${product.name} | Toko Kami`,
    description: product.description,
    openGraph: {
      title: product.name,
      description: product.description,
      images: [{ url: product.image }],
    },
  };
}

export default function CatalogPage() {
  return (
    <main>
      {/* Above the fold — render langsung */}
      <Suspense fallback={<HeroSkeleton />}>
        <HeroSection />
      </Suspense>

      {/* Below the fold — stream setelah above fold siap */}
      <Suspense fallback={<ProductGridSkeleton />}>
        <MFELoader
          modulePath="mfe_react/CatalogApp"
          ssr={true}
          skeleton={<ProductGridSkeleton />}
        />
      </Suspense>
    </main>
  );
}
```

### 4.3 Hydration Strategy

```typescript
// src/lib/hydration.ts
// Strategi hydration yang tepat untuk setiap MFE

export type HydrationStrategy =
  | 'eager'      // Hydrate segera (above fold, interactive)
  | 'lazy'       // Hydrate saat scroll ke viewport
  | 'idle'       // Hydrate saat browser idle (requestIdleCallback)
  | 'interaction' // Hydrate hanya saat user interact (hover/click)
  | 'never';     // Static, tidak perlu hydration

export const MFE_HYDRATION: Record<string, HydrationStrategy> = {
  header: 'eager',       // Navigasi — harus segera
  hero: 'eager',         // Hero section — above fold
  productGrid: 'lazy',   // Product grid — scroll-triggered
  recommendations: 'idle', // Rekomendasi — low priority
  chatWidget: 'interaction', // Chat — saat user hover
  footer: 'never',       // Footer statis
};

// Hook untuk lazy hydration
export function useLazyHydration(ref: React.RefObject<HTMLElement>, strategy: HydrationStrategy) {
  const [hydrated, setHydrated] = React.useState(strategy === 'eager');

  React.useEffect(() => {
    if (strategy === 'eager') return;

    if (strategy === 'idle') {
      const id = requestIdleCallback(() => setHydrated(true));
      return () => cancelIdleCallback(id);
    }

    if (strategy === 'lazy' && ref.current) {
      const observer = new IntersectionObserver(
        ([entry]) => { if (entry.isIntersecting) setHydrated(true); },
        { rootMargin: '200px' }
      );
      observer.observe(ref.current);
      return () => observer.disconnect();
    }

    if (strategy === 'interaction' && ref.current) {
      const handler = () => setHydrated(true);
      ref.current.addEventListener('mouseover', handler, { once: true });
      ref.current.addEventListener('touchstart', handler, { once: true });
    }
  }, [strategy, ref]);

  return hydrated;
}
```

---

## Step 5 — SEO Optimization

### 5.1 Metadata Architecture

```typescript
// src/lib/seo.ts — Centralized SEO management
export interface SEOConfig {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  structuredData?: Record<string, unknown>;
  noIndex?: boolean;
}

// Base metadata — override di setiap page
export const baseSEO = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL!),
  title: {
    default: 'Nama Aplikasi',
    template: '%s | Nama Aplikasi',
  },
  description: 'Deskripsi default aplikasi',
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true },
  },
  openGraph: {
    type: 'website',
    locale: 'id_ID',
    siteName: 'Nama Aplikasi',
  },
  twitter: {
    card: 'summary_large_image',
    site: '@handle',
  },
};
```

### 5.2 Structured Data (JSON-LD)

```tsx
// src/components/SEO/StructuredData.tsx
interface ProductStructuredDataProps {
  product: {
    name: string;
    description: string;
    image: string;
    price: number;
    currency: string;
    sku: string;
    availability: 'InStock' | 'OutOfStock';
  };
}

export function ProductStructuredData({ product }: ProductStructuredDataProps) {
  const jsonLd = {
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
      availability: `https://schema.org/${product.availability}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}
```

### 5.3 Dynamic Sitemap

```typescript
// src/app/sitemap.ts
import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!;

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/catalog`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
  ];

  // Dynamic routes — ambil dari API
  const products = await fetch(`${process.env.API_URL}/products?fields=slug,updatedAt`)
    .then(r => r.json())
    .catch(() => []);

  const productRoutes: MetadataRoute.Sitemap = products.map((p: { slug: string; updatedAt: string }) => ({
    url: `${baseUrl}/catalog/${p.slug}`,
    lastModified: new Date(p.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...productRoutes];
}
```

### 5.4 Core Web Vitals Optimization

```typescript
// next.config.js — Tambahkan optimasi performa
module.exports = {
  // ...
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 hari
  },

  // Aktifkan compression
  compress: true,

  // Headers keamanan & caching
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
        ],
      },
      {
        // Cache MFE remote entries
        source: '/_next/static/chunks/remoteEntry.js',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};
```

---

## Step 6 — Shared Dependencies & Design System

### 6.1 Design Tokens (CSS Custom Properties)

```css
/* public/design-tokens.css — Dimuat di semua MFE */
:root {
  /* Colors */
  --color-primary: #0066FF;
  --color-primary-dark: #0052CC;
  --color-secondary: #FF6B35;
  --color-text: #1A1A2E;
  --color-text-muted: #6B7280;
  --color-bg: #FFFFFF;
  --color-bg-subtle: #F9FAFB;
  --color-border: #E5E7EB;

  /* Typography */
  --font-sans: 'Inter Variable', system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;
  --font-size-base: 1rem;
  --font-size-lg: 1.125rem;
  --font-size-xl: 1.25rem;
  --font-size-2xl: 1.5rem;
  --font-size-3xl: 1.875rem;

  /* Spacing */
  --space-1: 0.25rem;
  --space-2: 0.5rem;
  --space-3: 0.75rem;
  --space-4: 1rem;
  --space-6: 1.5rem;
  --space-8: 2rem;
  --space-12: 3rem;
  --space-16: 4rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
  --shadow-md: 0 4px 6px rgba(0,0,0,0.07);
  --shadow-lg: 0 10px 15px rgba(0,0,0,0.1);

  /* Border radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-full: 9999px;

  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-base: 250ms ease;
  --transition-slow: 400ms ease;

  /* Z-index scale */
  --z-base: 0;
  --z-dropdown: 100;
  --z-sticky: 200;
  --z-modal: 300;
  --z-toast: 400;
}
```

### 6.2 Shared Component Library

```
packages/
└── shared-ui/
    ├── package.json        ← name: "@company/shared-ui"
    ├── src/
    │   ├── components/
    │   │   ├── Button/     ← Framework-agnostic via Web Components
    │   │   ├── Input/
    │   │   ├── Modal/
    │   │   └── Toast/
    │   └── index.ts
    └── web-components/     ← Versi Web Component untuk Vue/Angular
```

---

## Step 7 — State Management Cross-App

### 7.1 Event Bus untuk Cross-MFE Communication

```typescript
// src/lib/event-bus.ts
type EventPayload = Record<string, unknown>;

interface MFEEvent<T extends EventPayload = EventPayload> {
  source: string;  // Nama MFE yang emit
  payload: T;
  timestamp: number;
}

class MFEEventBus {
  private listeners = new Map<string, Set<(event: MFEEvent) => void>>();

  emit<T extends EventPayload>(eventName: string, source: string, payload: T) {
    const event: MFEEvent<T> = {
      source,
      payload,
      timestamp: Date.now(),
    };

    // Dispatch sebagai Custom Event di window (cross-framework compatible)
    window.dispatchEvent(
      new CustomEvent(`mfe:${eventName}`, { detail: event, bubbles: true })
    );

    // Juga notify internal listeners
    this.listeners.get(eventName)?.forEach(fn => fn(event));
  }

  on<T extends EventPayload>(
    eventName: string,
    handler: (event: MFEEvent<T>) => void
  ): () => void {
    const wrappedHandler = (e: Event) => {
      handler((e as CustomEvent<MFEEvent<T>>).detail);
    };

    window.addEventListener(`mfe:${eventName}`, wrappedHandler);

    // Return unsubscribe function
    return () => window.removeEventListener(`mfe:${eventName}`, wrappedHandler);
  }
}

// Singleton — tersedia global
export const eventBus = new MFEEventBus();

// Contoh events yang terdefinisi
export const MFE_EVENTS = {
  CART_UPDATED: 'cart:updated',
  USER_LOGGED_IN: 'user:logged_in',
  USER_LOGGED_OUT: 'user:logged_out',
  PRODUCT_VIEWED: 'product:viewed',
  CHECKOUT_STARTED: 'checkout:started',
  CHECKOUT_COMPLETED: 'checkout:completed',
} as const;
```

### 7.2 Shared State via URL

```typescript
// Gunakan URL sebagai shared state untuk data yang perlu SEO
// Contoh: filter, pagination, sorting

// src/lib/url-state.ts
export function useURLState<T extends Record<string, string>>(defaults: T) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const state = Object.fromEntries(
    Object.entries(defaults).map(([key, defaultVal]) => [
      key,
      searchParams.get(key) ?? defaultVal,
    ])
  ) as T;

  const setState = (updates: Partial<T>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === defaults[key]) {
        params.delete(key); // Hapus jika sama dengan default
      } else {
        params.set(key, String(value));
      }
    });
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return [state, setState] as const;
}
```

---

## Step 8 — Authentication & Security

### 8.1 Auth Flow di Micro Frontend

```typescript
// src/lib/auth.ts — Centralized auth di shell
export interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

// Auth disimpan di shell, disebarkan ke MFE via:
// 1. Props/attributes untuk Web Components
// 2. Event bus untuk React MFEs
// 3. Shared cookie untuk SSR

export function propagateAuthToMFEs(user: User | null) {
  // Kirim ke semua MFE via event bus
  eventBus.emit(MFE_EVENTS.USER_LOGGED_IN, 'shell', { user });

  // Untuk Web Components (Vue/Angular)
  const vueMFE = document.querySelector('mfe-checkout');
  const angularMFE = document.querySelector('mfe-dashboard');

  if (vueMFE) {
    (vueMFE as any).userId = user?.id;
  }
  if (angularMFE) {
    (angularMFE as any).userId = user?.id;
  }
}
```

### 8.2 Content Security Policy

```javascript
// next.config.js — CSP headers
const ContentSecurityPolicy = `
  default-src 'self';
  script-src 'self' 'unsafe-eval' 'unsafe-inline'
    http://localhost:3001
    http://localhost:3002
    http://localhost:3003
    ${process.env.NEXT_PUBLIC_MFE_REACT_URL}
    ${process.env.NEXT_PUBLIC_MFE_VUE_URL}
    ${process.env.NEXT_PUBLIC_MFE_ANGULAR_URL};
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob: https:;
  connect-src 'self' ${process.env.NEXT_PUBLIC_API_URL};
  frame-ancestors 'none';
`.replace(/\n/g, '');
```

---

## Step 9 — CI/CD Pipeline

### 9.1 GitHub Actions Workflow

```yaml
# .github/workflows/deploy.yml
name: Micro Frontend CI/CD

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      shell: ${{ steps.changes.outputs.shell }}
      mfe-react: ${{ steps.changes.outputs.mfe-react }}
      mfe-vue: ${{ steps.changes.outputs.mfe-vue }}
      mfe-angular: ${{ steps.changes.outputs.mfe-angular }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: changes
        with:
          filters: |
            shell:
              - 'shell-app/**'
            mfe-react:
              - 'mfe-react/**'
            mfe-vue:
              - 'mfe-vue/**'
            mfe-angular:
              - 'mfe-angular/**'

  build-and-test:
    needs: detect-changes
    runs-on: ubuntu-latest
    strategy:
      matrix:
        app:
          - name: shell-app
            condition: ${{ needs.detect-changes.outputs.shell == 'true' }}
            port: 3000
          - name: mfe-react
            condition: ${{ needs.detect-changes.outputs.mfe-react == 'true' }}
            port: 3001
          - name: mfe-vue
            condition: ${{ needs.detect-changes.outputs.mfe-vue == 'true' }}
            port: 3002
          - name: mfe-angular
            condition: ${{ needs.detect-changes.outputs.mfe-angular == 'true' }}
            port: 3003

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
          cache-dependency-path: '${{ matrix.app.name }}/package-lock.json'

      - name: Install & Build
        if: matrix.app.condition
        working-directory: ${{ matrix.app.name }}
        run: |
          npm ci
          npm run build
          npm run test -- --coverage --watchAll=false

      - name: Build Docker Image
        if: matrix.app.condition && github.ref == 'refs/heads/main'
        run: |
          docker build \
            -t ${{ secrets.REGISTRY_URL }}/${{ matrix.app.name }}:${{ github.sha }} \
            -t ${{ secrets.REGISTRY_URL }}/${{ matrix.app.name }}:latest \
            ./${{ matrix.app.name }}

      - name: Push to Registry
        if: matrix.app.condition && github.ref == 'refs/heads/main'
        run: |
          docker push ${{ secrets.REGISTRY_URL }}/${{ matrix.app.name }}:${{ github.sha }}
          docker push ${{ secrets.REGISTRY_URL }}/${{ matrix.app.name }}:latest
```

---

## Step 10 — Docker & Deployment

### 10.1 Dockerfile — Shell App (Next.js)

```dockerfile
# shell-app/Dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --only=production

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args untuk environment variables
ARG NEXT_PUBLIC_MFE_REACT_URL
ARG NEXT_PUBLIC_MFE_VUE_URL
ARG NEXT_PUBLIC_MFE_ANGULAR_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL

ENV NEXT_PUBLIC_MFE_REACT_URL=$NEXT_PUBLIC_MFE_REACT_URL
ENV NEXT_PUBLIC_MFE_VUE_URL=$NEXT_PUBLIC_MFE_VUE_URL
ENV NEXT_PUBLIC_MFE_ANGULAR_URL=$NEXT_PUBLIC_MFE_ANGULAR_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN npm run build

# Stage 3: Runner (minimal image)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
```

### 10.2 Dockerfile — React MFE

```dockerfile
# mfe-react/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/.next/static /usr/share/nginx/html/_next/static
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3001
```

### 10.3 Dockerfile — Vue MFE

```dockerfile
# mfe-vue/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3002
```

### 10.4 Dockerfile — Angular MFE

```dockerfile
# mfe-angular/Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npx ng build --configuration production

FROM nginx:alpine AS runner
COPY --from=builder /app/dist/mfe-angular/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 3003
```

### 10.5 Nginx Config per MFE

```nginx
# nginx.conf (digunakan oleh mfe-vue, mfe-angular, mfe-react)
server {
  listen 80;
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;

  # CORS — izinkan shell app mengakses remote entry
  add_header Access-Control-Allow-Origin "*" always;
  add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
  add_header Access-Control-Allow-Headers "Content-Type" always;

  # Cache static assets agresif
  location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
  }

  # remoteEntry.js — NO cache! Selalu fresh
  location ~* remoteEntry\.js$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Access-Control-Allow-Origin "*";
  }

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }
}
```

### 10.6 Docker Compose — Development

```yaml
# docker-compose.yml
version: '3.9'

services:
  # Shell Application
  shell-app:
    build:
      context: ./shell-app
      dockerfile: Dockerfile
      args:
        NEXT_PUBLIC_MFE_REACT_URL: http://localhost:3001
        NEXT_PUBLIC_MFE_VUE_URL: http://localhost:3002
        NEXT_PUBLIC_MFE_ANGULAR_URL: http://localhost:3003
        NEXT_PUBLIC_API_URL: http://api:4000
        NEXT_PUBLIC_SITE_URL: http://localhost:3000
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - API_URL=http://api:4000
    depends_on:
      - mfe-react
      - mfe-vue
      - mfe-angular
    networks:
      - mfe-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  # React MFE
  mfe-react:
    build:
      context: ./mfe-react
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    networks:
      - mfe-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3001/remoteEntry.js"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Vue MFE
  mfe-vue:
    build:
      context: ./mfe-vue
      dockerfile: Dockerfile
    ports:
      - "3002:3002"
    networks:
      - mfe-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3002/remoteEntry.js"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Angular MFE
  mfe-angular:
    build:
      context: ./mfe-angular
      dockerfile: Dockerfile
    ports:
      - "3003:3003"
    networks:
      - mfe-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3003/remoteEntry.js"]
      interval: 30s
      timeout: 10s
      retries: 3

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
    depends_on:
      - shell-app
    networks:
      - mfe-network
    restart: unless-stopped

networks:
  mfe-network:
    driver: bridge
```

### 10.7 Docker Compose — Production dengan Scaling

```yaml
# docker-compose.prod.yml
version: '3.9'

services:
  shell-app:
    image: ${REGISTRY_URL}/shell-app:${VERSION:-latest}
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        order: start-first  # Zero-downtime deploy
      rollback_config:
        parallelism: 1
        delay: 5s
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
    environment:
      - NODE_ENV=production
      - NEXT_PUBLIC_MFE_REACT_URL=${MFE_REACT_PUBLIC_URL}
      - NEXT_PUBLIC_MFE_VUE_URL=${MFE_VUE_PUBLIC_URL}
      - NEXT_PUBLIC_MFE_ANGULAR_URL=${MFE_ANGULAR_PUBLIC_URL}
    networks:
      - mfe-network

  mfe-react:
    image: ${REGISTRY_URL}/mfe-react:${VERSION:-latest}
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.25'
          memory: 256M
    networks:
      - mfe-network

  mfe-vue:
    image: ${REGISTRY_URL}/mfe-vue:${VERSION:-latest}
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.25'
          memory: 256M
    networks:
      - mfe-network

  mfe-angular:
    image: ${REGISTRY_URL}/mfe-angular:${VERSION:-latest}
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '0.25'
          memory: 256M
    networks:
      - mfe-network

networks:
  mfe-network:
    driver: overlay
    attachable: true
```

### 10.8 Nginx Reverse Proxy (Production)

```nginx
# nginx/nginx.conf
events {
  worker_connections 1024;
}

http {
  # Rate limiting
  limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

  upstream shell_app {
    least_conn;
    server shell-app:3000;
    keepalive 32;
  }

  upstream mfe_react {
    server mfe-react:3001;
    keepalive 16;
  }

  upstream mfe_vue {
    server mfe-vue:3002;
    keepalive 16;
  }

  upstream mfe_angular {
    server mfe-angular:3003;
    keepalive 16;
  }

  server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$server_name$request_uri;
  }

  server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate /etc/nginx/ssl/cert.pem;
    ssl_certificate_key /etc/nginx/ssl/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
    gzip_min_length 1000;

    # Main app
    location / {
      proxy_pass http://shell_app;
      proxy_set_header Host $host;
      proxy_set_header X-Real-IP $remote_addr;
      proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
      proxy_set_header X-Forwarded-Proto $scheme;

      # SSR streaming support
      proxy_buffering off;
      proxy_cache off;
    }

    # React MFE assets
    location /mfe/react/ {
      proxy_pass http://mfe_react/;
      add_header Cache-Control "public, max-age=3600";
    }

    # Vue MFE assets
    location /mfe/vue/ {
      proxy_pass http://mfe_vue/;
      add_header Cache-Control "public, max-age=3600";
    }

    # Angular MFE assets
    location /mfe/angular/ {
      proxy_pass http://mfe_angular/;
      add_header Cache-Control "public, max-age=3600";
    }

    # Health check endpoint
    location /health {
      access_log off;
      return 200 "healthy\n";
      add_header Content-Type text/plain;
    }
  }
}
```

### 10.9 Makefile untuk Developer Experience

```makefile
# Makefile
.PHONY: dev build push deploy clean

# Development
dev:
	docker compose up --build

dev-shell:
	cd shell-app && npm run dev

dev-react:
	cd mfe-react && npm run dev

dev-vue:
	cd mfe-vue && npm run dev

dev-angular:
	cd mfe-angular && npm run dev

# Build semua images
build:
	docker compose build --parallel

# Push ke registry
push:
	docker compose push

# Deploy production
deploy:
	VERSION=$(git rev-parse --short HEAD) docker compose -f docker-compose.prod.yml up -d

# Rollback
rollback:
	docker compose -f docker-compose.prod.yml rollback

# Cleanup
clean:
	docker compose down --volumes --remove-orphans
	docker system prune -f

# Logs
logs:
	docker compose logs -f

logs-shell:
	docker compose logs -f shell-app

# Health check
health:
	@echo "Shell App:"
	@curl -s http://localhost:3000/api/health || echo "UNHEALTHY"
	@echo "\nReact MFE:"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/remoteEntry.js
	@echo "\nVue MFE:"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3002/remoteEntry.js
	@echo "\nAngular MFE:"
	@curl -s -o /dev/null -w "%{http_code}" http://localhost:3003/remoteEntry.js
```

---

## Best Practices Checklist

### Architecture
- [ ] Setiap MFE punya repository terpisah dan pipeline CI/CD mandiri
- [ ] Tidak ada direct imports antar MFE (selalu via Module Federation)
- [ ] Shared state diminimalisir — data sebisa mungkin lokal per MFE
- [ ] API calls dilakukan di level MFE, bukan di shell (BFF pattern)
- [ ] Shell hanya menangani routing, layout, dan auth

### Performance
- [ ] `remoteEntry.js` tidak di-cache (selalu fresh untuk enable live updates)
- [ ] Static assets (chunks) di-cache agresif dengan content hash
- [ ] Lazy loading untuk semua MFE yang tidak ada di above-the-fold
- [ ] Shared dependencies (`react`, `vue`, dll) dikonfigurasi sebagai `singleton`
- [ ] Web Worker untuk komputasi berat di MFE

### SEO
- [ ] Semua halaman publik menggunakan SSR atau SSG
- [ ] Setiap halaman memiliki unique `<title>` dan `<meta description>`
- [ ] Structured data (JSON-LD) ditambahkan untuk konten produk
- [ ] Sitemap dinamis dengan timestamp update yang akurat
- [ ] Core Web Vitals: LCP < 2.5s, FID < 100ms, CLS < 0.1

### Security
- [ ] CSP headers dikonfigurasi untuk mengizinkan MFE domains
- [ ] JWT/token tidak diekspos ke MFE yang tidak berwenang
- [ ] Setiap MFE dijalankan sebagai non-root user di Docker
- [ ] Secrets dikelola via Docker secrets atau environment variables
- [ ] HTTPS enforced di semua environments

### Developer Experience
- [ ] `docker compose up` sudah cukup untuk menjalankan semua services
- [ ] Hot reload berfungsi di development untuk semua MFE
- [ ] Shared TypeScript types dipublish sebagai npm package internal
- [ ] Makefile atau script tersedia untuk task umum

---

## Troubleshooting Guide

### ❌ `TypeError: Cannot read property 'init' of undefined`
**Cause**: Remote MFE belum load atau `remoteEntry.js` tidak dapat diakses.  
**Fix**: Pastikan MFE service sudah running dan URL di `next.config.js` sudah benar. Cek CORS headers.

### ❌ Shared dependency conflict (dua versi React)
**Cause**: Versi `react` di shell dan MFE berbeda.  
**Fix**: Pastikan `requiredVersion` di semua `shared` config menggunakan range yang sama: `"^18.0.0"`.

### ❌ Vue/Angular Web Component tidak muncul di SSR
**Cause**: Custom Elements API tidak ada di Node.js.  
**Fix**: Gunakan dynamic import dengan `ssr: false` atau load Web Component hanya di client:
```tsx
const MFECheckout = dynamic(() => import('./VueMFEWrapper'), { ssr: false });
```

### ❌ `remoteEntry.js` ter-cache dan tidak update
**Cause**: Browser atau CDN meng-cache file tersebut.  
**Fix**: Pastikan Nginx mengirimkan `Cache-Control: no-cache` untuk `remoteEntry.js`. Tambahkan `?v=${Date.now()}` di development.

### ❌ CLS tinggi karena MFE belum load
**Cause**: Placeholder skeleton tidak memiliki ukuran yang sama dengan konten akhir.  
**Fix**: Berikan `min-height` yang tepat pada skeleton loader. Gunakan `aspect-ratio` CSS untuk image placeholders.

---

*Dokumen ini bersifat living document. Update setiap kali ada perubahan major pada arsitektur.*  
*Versi: 1.0 | Dibuat: 2025*
