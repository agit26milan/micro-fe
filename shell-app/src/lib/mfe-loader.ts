'use client';

import React from 'react';
import ReactDOM from 'react-dom';
import { MFE_REGISTRY, type MFEConfig } from './mfe-registry';

// Cache
const loadedScripts = new Set<string>();
const loadedContainers = new Map<string, any>();

// Module Federation runtime instance (lazy init)
let federationInitPromise: Promise<void> | null = null;

/**
 * Inisialisasi @module-federation/enhanced/runtime.
 * Dipanggil sekali saat pertama kali MFE di-load.
 * Runtime ini independen dari NextFederationPlugin (webpack).
 */
async function ensureFederationRuntime(): Promise<void> {
  if (federationInitPromise) return federationInitPromise;

  federationInitPromise = (async () => {
    try {
      const { init, getInstance } = await import('@module-federation/enhanced/runtime');

      // Cek apakah sudah ada instance (dari NextFederationPlugin atau manual)
      const existing = getInstance();
      if (existing) return;

      // Inisialisasi dengan remotes dari registry
      init({
        name: 'shell',
        remotes: Object.values(MFE_REGISTRY).map((cfg) => ({
          name: cfg.name,
          entry: cfg.remoteUrl,
        })),
        // Shared React — WAJIB menyertakan `lib` factory agar
        // runtime bisa mendapat akses ke library. Tanpa `lib`,
        // error: "neither get nor lib is provided in the share config".
        shared: {
          react: {
            version: React.version,
            scope: 'default',
            lib: () => React,
            shareConfig: { singleton: true, eager: true, requiredVersion: '^19.0.0' },
          } as any,
          'react-dom': {
            version: ReactDOM.version,
            scope: 'default',
            lib: () => ReactDOM,
            shareConfig: { singleton: true, eager: true, requiredVersion: '^19.0.0' },
          } as any,
        },
      });
    } catch (e) {
      federationInitPromise = null; // reset so next call retries
      throw e;
    }
  })();

  return federationInitPromise;
}

/**
 * Tunggu hingga custom element terdaftar di browser.
 *
 * Menggunakan dua mekanisme untuk deteksi:
 * 1. MutationObserver — mendeteksi perubahan DOM (script tag ditambahkan ke <head>)
 * 2. Polling interval — fallback jika customElements.define() dipanggil tanpa
 *    memicu mutasi DOM yang diamati observer.
 *
 * Tanpa polling fallback, jika custom element sudah terdaftar sebelum observer
 * sempat memeriksa, atau jika define() tidak memicu mutasi DOM, promise akan
 * menggantung hingga timeout 15 detik, menyebabkan MFE area blank.
 */
function waitForCustomElement(tagName: string, timeout = 15000): Promise<void> {
  if (customElements.get(tagName)) {
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    let resolved = false;

    const cleanup = () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
      observer.disconnect();
    };

    const onResolve = () => {
      if (resolved) return;
      resolved = true;
      cleanup();
      resolve();
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(`Custom element "${tagName}" not registered within ${timeout}ms`));
    }, timeout);

    // Polling interval — fallback jika MutationObserver tidak mendeteksi
    const intervalId = setInterval(() => {
      if (customElements.get(tagName)) {
        onResolve();
      }
    }, 100);

    // MutationObserver — deteksi saat script tag ditambahkan ke DOM
    const observer = new MutationObserver(() => {
      if (customElements.get(tagName)) {
        onResolve();
      }
    });

    observer.observe(document.head, { childList: true, subtree: true });
  });
}

/**
 * Load MFE module menggunakan @module-federation/enhanced/runtime.
 * Runtime ini independen dari NextFederationPlugin webpack plugin.
 */
async function loadMFEModule<T = any>(
  remoteName: string,
  exposedModule: string
): Promise<T> {
  const cacheKey = `${remoteName}/${exposedModule}`;
  if (loadedContainers.has(cacheKey)) {
    return loadedContainers.get(cacheKey) as T;
  }

  // Inisialisasi federation runtime
  await ensureFederationRuntime();

  // Load remote module via enhanced runtime
  // Strip "./" prefix dari exposedModule untuk menghindari
  // double prefix ("././CatalogApp") yang menyebabkan
  // Error: Module "././CatalogApp" does not exist in container.
  const modulePath = exposedModule.startsWith('./') ? exposedModule.slice(2) : exposedModule;
  const { loadRemote } = await import('@module-federation/enhanced/runtime');
  const result = await loadRemote<T>(`${remoteName}/${modulePath}`);

  if (!result) {
    throw new Error(
      `MFE "${remoteName}" mengembalikan null. ` +
      `Pastikan server MFE berjalan.\n` +
      `  URL: ${MFE_REGISTRY[remoteName]?.remoteUrl || 'unknown'}`
    );
  }

  loadedContainers.set(cacheKey, result);
  return result as T;
}

/**
 * Deteksi apakah aplikasi berjalan dalam mode development.
 * process.env.NODE_ENV diganti oleh webpack/Next.js di build-time.
 */
function isDevMode(): boolean {
  try {
    return process.env.NODE_ENV === 'development';
  } catch {
    return false;
  }
}

/**
 * Pilih bundle URL yang tepat berdasarkan environment.
 * Development → devBundleUrl (Vite serve source ESM)
 * Production  → bundleUrl (output build yang sudah di-bundle)
 */
function resolveBundleUrl(config: MFEConfig): string {
  if (isDevMode() && config.devBundleUrl) {
    return config.devBundleUrl;
  }
  return config.bundleUrl || config.remoteUrl;
}

/**
 * Deteksi apakah bundle menggunakan ESM (type="module"):
 * - Vue (Vite dev server): file .ts atau dari /src/
 * - Angular 17+ (ESM output): file main.js
 */
function isESMModule(url: string): boolean {
  return url.endsWith('.ts') || url.includes('/src/') || url.endsWith('/main.js');
}

/**
 * Load MFE secara dinamis.
 */
export async function loadMFE(mfeKey: string) {
  const config = MFE_REGISTRY[mfeKey];
  if (!config) {
    throw new Error(`MFE "${mfeKey}" not found in registry`);
  }

  const isServer = typeof window === 'undefined';
  if (isServer) return;

  if (config.webComponentTag && config.useModuleFederation === false) {
    // Vue/Angular MFE — inject bundle script, tunggu custom element
    const bundleUrl = resolveBundleUrl(config);

    // Skip jika script sudah pernah di-load (guard terhadap double-invocation
    // akibat React Strict Mode atau re-render).
    if (loadedScripts.has(bundleUrl)) {
      // Tunggu custom element (mungkin script masih loading)
      await waitForCustomElement(config.webComponentTag);
      return;
    }

    loadedScripts.add(bundleUrl);

    const script = document.createElement('script');
    script.src = bundleUrl;
    if (isESMModule(bundleUrl)) script.type = 'module';
    script.async = true;
    script.crossOrigin = 'anonymous';

    await new Promise<void>((resolve, reject) => {
      script.onload = () => resolve();
      script.onerror = () => {
        // Hapus dari cache agar retry berikutnya mencoba lagi
        loadedScripts.delete(bundleUrl);
        reject(new Error(`Failed to load bundle: ${bundleUrl}`));
      };
      document.head.appendChild(script);
    });

    await waitForCustomElement(config.webComponentTag);
  } else if (config.webComponentTag && config.useModuleFederation === true) {
    // Angular MFE — via Module Federation runtime
    await loadMFEModule(config.name, config.exposedModule!);
    await waitForCustomElement(config.webComponentTag);
  }
}

/**
 * Load React MFE component.
 */
export async function loadReactMFE<T = { default: React.ComponentType<any> }>(
  mfeKey: string
): Promise<T> {
  const config = MFE_REGISTRY[mfeKey];
  if (!config) {
    throw new Error(`MFE "${mfeKey}" not found in registry`);
  }
  if (!config.exposedModule) {
    throw new Error(`MFE "${mfeKey}" has no exposedModule configured`);
  }

  return loadMFEModule<T>(config.name, config.exposedModule);
}

/**
 * Prefetch MFE assets di background
 */
export function prefetchMFE(mfeKey: string) {
  if (typeof window === 'undefined' || typeof requestIdleCallback === 'undefined') return;
  const config = MFE_REGISTRY[mfeKey];
  if (!config) return;
  requestIdleCallback(() => {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = config.remoteUrl;
    link.as = 'script';
    document.head.appendChild(link);
  }, { timeout: 3000 });
}

/**
 * Prefetch semua MFE yang ditandai prefetch:true di registry
 */
export function prefetchCriticalMFEs() {
  if (typeof window === 'undefined') return;
  Object.entries(MFE_REGISTRY).forEach(([key, config]) => {
    if (config.prefetch) prefetchMFE(key);
  });
}

export { MFE_REGISTRY } from './mfe-registry';
