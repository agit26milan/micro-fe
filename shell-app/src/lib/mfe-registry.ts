export interface MFEConfig {
  name: string;
  remoteUrl: string;
  remoteUrlSSR: string;
  exposedModule?: string; // Module Federation exposed module (e.g., './CatalogApp').
  webComponentTag?: string; // Untuk Vue/Angular Web Component MFEs
  /** URL ke main bundle untuk script injection (Web Component MFEs).
   *  Berbeda dengan remoteUrl yang mengarah ke remoteEntry.js Module Federation,
   *  bundleUrl mengarah ke entry point yang menjalankan customElements.define().
   *  Gunakan URL produksi di sini (misal: output build yang sudah di-bundle). */
  bundleUrl?: string;
  bundleUrlSSR?: string;
  /** URL ke main bundle untuk mode DEVELOPMENT.
   *  Vite dev server melayani file source langsung sebagai ESM (/src/main.ts),
   *  berbeda dengan produksi yang menggunakan output build (main.js).
   *  Jika tidak diisi, fallback ke bundleUrl. */
  devBundleUrl?: string;
  devBundleUrlSSR?: string;
  /** true berarti Web Component ini di-load via Module Federation
   *  (exposedModule berisi kode bootstrap). false berarti via script injection */
  useModuleFederation?: boolean;
  ssr: boolean;
  prefetch: boolean;
}

export const MFE_REGISTRY: Record<string, MFEConfig> = {
  catalog: {
    name: 'mfe_react',
    remoteUrl: 'http://localhost:3001/_next/static/chunks/remoteEntry.js',
    remoteUrlSSR: 'http://mfe-react:3001/_next/static/chunks/remoteEntry.js',
    exposedModule: './CatalogApp',
    ssr: true,
    prefetch: true,
  },
  checkout: {
    name: 'mfe_vue',
    // Module Federation entry
    remoteUrl: 'http://localhost:3002/remoteEntry.js',
    remoteUrlSSR: 'http://mfe-vue:3002/remoteEntry.js',
    // Main bundle yang register custom element.
    // Development: Vite dev server serve /src/main.ts sebagai ESM.
    //   Gunakan devBundleUrl untuk mode development.
    // Production: vite.config.ts dikonfigurasi dengan entryFileNames: 'main.js'
    //   sehingga output build adalah /main.js (predictable, tanpa hash).
    //   Tanpa ini, nginx SPA fallback mengembalikan index.html (MIME text/html)
    //   karena /src/main.ts tidak ditemukan di dist/.
    bundleUrl: 'http://localhost:3002/main.js',
    bundleUrlSSR: 'http://mfe-vue:3002/main.js',
    devBundleUrl: 'http://localhost:3002/src/main.ts',
    devBundleUrlSSR: 'http://mfe-vue:3002/src/main.ts',
    exposedModule: './CheckoutApp',
    webComponentTag: 'mfe-checkout',
    useModuleFederation: false,
    ssr: false,
    prefetch: false,
  },
  dashboard: {
    name: 'mfe_angular',
    // Module Federation entry (tidak digunakan — Angular MFE tidak pakai MF)
    remoteUrl: 'http://localhost:3003/main.js',
    remoteUrlSSR: 'http://mfe-angular:3003/main.js',
    // Main bundle yang register custom element (Angular Elements)
    bundleUrl: 'http://localhost:3003/main.js',
    bundleUrlSSR: 'http://mfe-angular:3003/main.js',
    // Angular MFE tidak menggunakan Module Federation (@angular-architects/module-federation
    // tidak terinstall). Angular Elements register custom element via bundle script.
    webComponentTag: 'mfe-dashboard',
    useModuleFederation: false,
    ssr: false,
    prefetch: false,
  },
  profile: {
    name: 'mfe_profile',
    remoteUrl: 'http://localhost:3004/remoteEntry.js',
    remoteUrlSSR: 'http://mfe-profile:3004/remoteEntry.js',
    // Production: Vite build output = main.js (via rollupOptions.output.entryFileNames)
    bundleUrl: 'http://localhost:3004/main.js',
    bundleUrlSSR: 'http://mfe-profile:3004/main.js',
    // Development: Vite dev server serves source files as ESM
    devBundleUrl: 'http://localhost:3004/src/main.ts',
    devBundleUrlSSR: 'http://mfe-profile:3004/src/main.ts',
    exposedModule: './MfeProfileApp',
    webComponentTag: 'mfe-profile',
    useModuleFederation: false,
    ssr: false,
    prefetch: false,
  },
};
