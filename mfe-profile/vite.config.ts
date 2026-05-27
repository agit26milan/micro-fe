import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    vue({ customElement: true }),
    federation({
      name: 'mfe_profile',
      filename: 'remoteEntry.js',
      exposes: {
        './MfeProfileApp': './src/App.vue',
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
    rollupOptions: {
      output: {
        // Gunakan nama file yang predictable (tanpa hash) agar shell app
        // bisa memuat bundle via bundleUrl yang tetap.
        entryFileNames: 'main.js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
  server: { port: 3004, cors: true },
  preview: { port: 3004 },
});