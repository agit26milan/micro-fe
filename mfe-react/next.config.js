process.env.NEXT_PRIVATE_LOCAL_WEBPACK = 'true';

const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output untuk Docker
  output: 'standalone',

  // Fix lockfile warning saat dijalankan dari root workspace
  outputFileTracingRoot: __dirname,

  webpack(config, { isServer }) {
    // IMPORTANT: Shared deps HANYA untuk client-side build.
    // Pada server-side build, shared: {} diperlukan agar Next.js dapat
    // melakukan prerendering (termasuk 404/500 pages) tanpa bergantung
    // pada Module Federation share scope yang belum tersedia.
    //
    // Tanpa conditional ini, server-side build gagal dengan:
    //   "TypeError: Cannot read properties of null (reading 'useContext')"
    // karena React di-resolve dari share scope yang masih null.
    const sharedDeps = isServer
      ? {}
      : {
          react: {
            singleton: true,
            requiredVersion: '^19.0.0',
          },
          'react-dom': {
            singleton: true,
            requiredVersion: '^19.0.0',
          },
        };

    config.plugins.push(
      new NextFederationPlugin({
        name: 'mfe_react',
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          './CatalogApp': './src/components/CatalogApp/index.tsx',
          './ProductCard': './src/components/ProductCard/index.tsx',
        },
        shared: sharedDeps,
        extraOptions: {
          skipSharingNextInternals: true,
        },
      })
    );
    return config;
  },

  // Hanya jalankan di port 3001
  // server runtime config via env

  // CORS headers — WAJIB agar shell app (localhost:3000) bisa
  // memuat remoteEntry.js via <script> tag.
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;

