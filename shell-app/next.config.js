process.env.NEXT_PRIVATE_LOCAL_WEBPACK = 'true';

const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output untuk Docker
  output: 'standalone',

  // Fix lockfile warning saat dijalankan dari root workspace
  outputFileTracingRoot: __dirname,

  webpack(config, options) {
    const { isServer } = options;

    // Shared deps HANYA untuk client-side build.
    // Server-side build menggunakan shared: {} agar React di-resolve
    // secara normal oleh Next.js (tanpa Module Federation share scope),
    // sehingga static generation (termasuk 404/500 pages) tidak gagal.
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
        name: 'shell',
        remotes: {
          cart: isServer
            ? `cart@http://cart:3005/_next/static/chunks/remoteEntry.js`
            : `cart@http://localhost:3005/_next/static/chunks/remoteEntry.js`,
          mfe_profile: isServer
            ? `mfe_profile@http://mfe-profile:3004/remoteEntry.js`
            : `mfe_profile@http://localhost:3004/remoteEntry.js`,
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
          './SharedHeader': './src/components/Shell/Header',
          './SharedNav': './src/components/Shell/Navigation',
        },
        shared: sharedDeps,
        extraOptions: {
          skipSharingNextInternals: true,
        },
      })
    );

    return config;
  },

  // Optimasi performa
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 hari
  },

  // Aktifkan compression
  compress: true,

  // Headers keamanan & caching
  async headers() {
    // Public URLs from environment (may be Docker service names like http://mfe-vue:3002)
    const MFE_REACT_URL = process.env.NEXT_PUBLIC_MFE_REACT_URL || 'http://localhost:3001';
    const MFE_VUE_URL = process.env.NEXT_PUBLIC_MFE_VUE_URL || 'http://localhost:3002';
    const MFE_ANGULAR_URL = process.env.NEXT_PUBLIC_MFE_ANGULAR_URL || 'http://localhost:3003';
    const MFE_PROFILE_URL = process.env.NEXT_PUBLIC_MFE_PROFILE_URL || 'http://localhost:3004';
    const MFE_CART_URL = process.env.NEXT_PUBLIC_MFE_CART_URL || 'http://localhost:3005';
    // Localhost fallbacks — browser always resolves via localhost (not Docker service names)
    const LOCALHOST_MFE_URLS = [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      'http://localhost:3005'
    ].join(' ');

    
    const ContentSecurityPolicy = `
      default-src 'self';
      script-src 'self' 'unsafe-eval' 'unsafe-inline'
        ${MFE_REACT_URL} ${MFE_VUE_URL} ${MFE_ANGULAR_URL} ${MFE_PROFILE_URL}
        ${LOCALHOST_MFE_URLS} ${MFE_CART_URL};
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https: http://placehold.co;
      connect-src 'self'
        ${MFE_REACT_URL} ${MFE_VUE_URL} ${MFE_ANGULAR_URL}
        ${LOCALHOST_MFE_URLS}
        ${process.env.NEXT_PUBLIC_API_URL || ''};
      frame-ancestors 'none';
    `.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();

    return [
      {
        source: '/(.*)',
        headers: [
          // Security headers
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-XSS-Protection', value: '1; mode=block' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: ContentSecurityPolicy },

          // HSTS (hanya di production)
          ...(process.env.NODE_ENV === 'production'
            ? [{ key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' }]
            : []),
        ],
      },
      {
        // remoteEntry.js TIDAK boleh di-cache!
        // Jika di-cache, MFE yang sudah di-deploy tidak akan pernah di-refresh oleh browser.
        // Architecture rule: remoteEntry.js harus selalu fresh.
        source: '/_next/static/chunks/remoteEntry.js',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
