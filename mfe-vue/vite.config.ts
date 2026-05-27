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
        './CheckoutApp': './src/components/CheckoutApp.ce.vue',
      },
      shared: {
        vue: { singleton: true } as any,
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        // Gunakan nama file yang predictable (tanpa hash) agar shell app
        // bisa memuat bundle via bundleUrl yang tetap.
        // Tanpa ini, Vite menghasilkan assets/index-XXXXX.js (hash berubah
        // setiap build), sehingga bundleUrl http://localhost:3002/src/main.ts
        // tidak ditemukan di production (nginx SPA fallback → index.html).
        entryFileNames: 'main.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
  server: {
    port: 3002,
    cors: true,
  },
  preview: {
    port: 3002,
  },
});
