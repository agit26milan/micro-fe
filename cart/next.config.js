process.env.NEXT_PRIVATE_LOCAL_WEBPACK = 'true';

const { NextFederationPlugin } = require('@module-federation/nextjs-mf');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  outputFileTracingRoot: __dirname,

  // Allow cross-origin requests from shell app or other dev machines/hosts
  allowedDevOrigins: (process.env.ALLOWED_DEV_ORIGINS || '*')
    .split(',')
    .map(s => s.trim()),

  // Explicitly bind to all interfaces so both localhost and network IP work
  server: {
    host: '0.0.0.0',
    port: 3005,
  },

  webpack(config, { isServer }) {
    const sharedDeps = isServer
      ? {}
      : {
          react: { singleton: true, requiredVersion: '^19.0.0' },
          'react-dom': { singleton: true, requiredVersion: '^19.0.0' },
        };

    config.plugins.push(
      new NextFederationPlugin({
        name: 'cart',
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          './CartApp': './src/components/CartApp/index.tsx',
        },
        shared: sharedDeps,
        extraOptions: {
          skipSharingNextInternals: true,
        },
      })
    );
    return config;
  },

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
