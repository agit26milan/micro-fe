#!/usr/bin/env node

/**
 * ═══════════════════════════════════════════════════════════════
 *  MFE Generator — Micro Frontend Scaffolding CLI
 * ═══════════════════════════════════════════════════════════════
 *
 * Usage:
 *   node scripts/generate-mfe.js --name=mfe-payment --stack=vue --port=3004
 *   node scripts/generate-mfe.js --name=mfe-profile --stack=angular --port=3005
 *   node scripts/generate-mfe.js --name=mfe-catalog --stack=react --port=3006
 *
 * Dependencies: Node.js built-in (fs, path) — zero npm deps required.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ─── Reserved ports ───
const RESERVED_PORTS = [3001, 3002, 3003];

// ─── Parse args ───
function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach((arg) => {
    const match = arg.match(/^--(\w+)=(.+)$/);
    if (match) {
      args[match[1]] = match[2];
    }
  });
  return args;
}

// ─── Validation ───
function validate(args) {
  const errors = [];

  if (!args.name) errors.push('--name is required (e.g. --name=mfe-payment)');
  if (!args.stack) errors.push('--stack is required (vue | angular | react)');
  if (!args.port) errors.push('--port is required (e.g. --port=3004)');

  if (args.stack && !['vue', 'angular', 'react'].includes(args.stack)) {
    errors.push(`--stack must be one of: vue, angular, react (got "${args.stack}")`);
  }

  if (args.port) {
    const portNum = parseInt(args.port, 10);
    if (isNaN(portNum) || portNum < 1024 || portNum > 65535) {
      errors.push('--port must be a number between 1024 and 65535');
    } else if (RESERVED_PORTS.includes(portNum)) {
      errors.push(`Port ${portNum} is reserved for existing services: shell(3000), react(3001), vue(3002), angular(3003)`);
    }
  }

  if (args.name) {
    if (!/^[a-z0-9-]+$/.test(args.name)) {
      errors.push('--name must contain only lowercase letters, numbers, and hyphens');
    } else if (fs.existsSync(path.join(process.cwd(), args.name))) {
      errors.push(`Folder "${args.name}" already exists`);
    }

  }

  return errors;
}

// ─── Template: Vue MFE ───
function generateVue(name, port) {
  const base = path.join(process.cwd(), name);

  // package.json
  const pkg = {
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
    dependencies: { vue: '^3.4.0' },
    devDependencies: {
      '@vitejs/plugin-vue': '^5.0.0',
      'vite': '^5.0.0',
      '@originjs/vite-plugin-federation': '^1.3.0',
      'typescript': '^5.3.0',
    },
  };

  // vite.config.ts
  const viteConfig = `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    vue({ customElement: true }),
    federation({
      name: '${name.replace(/-/g, '_')}',
      filename: 'remoteEntry.js',
      exposes: {
        './${toPascalCase(name)}App': './src/App.vue',
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
  server: { port: ${port}, cors: true },
  preview: { port: ${port} },
});`;

  // index.html
  const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${toTitle(name)} MFE — Vue</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.ts"></script>
</body>
</html>`;

  // src/main.ts
  const mainTs = `import { defineCustomElement } from 'vue';
import App from './App.vue';

// Register as Web Component for MFE shell
const element = defineCustomElement(App);
customElements.define('${name.replace(/-/g, '-')}', element);

// Standalone bootstrap
const root = document.getElementById('app');
if (root) {
  const { createApp } = await import('vue');
  const app = createApp(App);
  app.mount(root);
}
`;

  // src/App.vue
  const appVue = `<script setup lang="ts">
const props = defineProps<{
  title?: string;
}>();
</script>

<template>
  <div class="${name}-app">
    <h1>{{ title || '${toTitle(name)} MFE' }}</h1>
    <p>Vue 3 Micro Frontend — loaded as Web Component</p>
  </div>
</template>

<style scoped>
.${name}-app {
  font-family: var(--font-sans, system-ui);
  color: var(--color-text, #111);
  padding: 1rem;
}
</style>`;

  // tsconfig.json
  const tsconfig = JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      jsx: 'preserve',
      resolveJsonModule: true,
      isolatedModules: true,
      esModuleInterop: true,
      lib: ['ES2020', 'DOM'],
      skipLibCheck: true,
      noEmit: true,
    },
    include: ['src/**/*.ts', 'src/**/*.vue'],
  }, null, 2);

  // Dockerfile (Vue: Vite build + Nginx)
  const dockerfile = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE ${port}
`;

  // nginx.conf (Vue)
  const nginxConf = `server {
  listen ${port};
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;

  add_header Access-Control-Allow-Origin "*" always;
  add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
  add_header Access-Control-Allow-Headers "Content-Type" always;

  location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
  }

  location ~* remoteEntry\\.js$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Access-Control-Allow-Origin "*";
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
`;

  // .gitignore — Vue best practices
  const gitignore = `# dependencies
node_modules/
.pnp
.pnp.js

# testing
coverage/

# production
dist/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# typescript
*.tsbuildinfo
`;

  // Write files
  fs.mkdirSync(path.join(base, 'src', 'components'), { recursive: true });
  fs.writeFileSync(path.join(base, '.gitignore'), gitignore);
  fs.writeFileSync(path.join(base, 'package.json'), JSON.stringify(pkg, null, 2));
  fs.writeFileSync(path.join(base, 'vite.config.ts'), viteConfig);
  fs.writeFileSync(path.join(base, 'index.html'), indexHtml);
  fs.writeFileSync(path.join(base, 'tsconfig.json'), tsconfig);
  fs.writeFileSync(path.join(base, 'Dockerfile'), dockerfile);
  fs.writeFileSync(path.join(base, 'nginx.conf'), nginxConf);
  fs.writeFileSync(path.join(base, 'src', 'main.ts'), mainTs);
  fs.writeFileSync(path.join(base, 'src', 'App.vue'), appVue);
}

// ─── Template: React (Next.js) MFE ───
function generateReact(name, port) {
  const base = path.join(process.cwd(), name);
  const remoteName = name.replace(/-/g, '_');
  const pascal = toPascalCase(name);

  // package.json — Next.js with Module Federation (aligned with mfe-react)
  const pkg = {
    name,
    version: '0.1.0',
    private: true,
    scripts: {
      dev: `next dev -p ${port}`,
      build: 'next build',
      start: `next start -p ${port}`,
    },
    dependencies: {
      '@module-federation/nextjs-mf': '^8.8.67',
      'enhanced-resolve': '5.17.1',
      'next': '^15.5.18',
      'react': '^19.0.0',
      'react-dom': '^19.0.0',
      'webpack': '^5.95.0',
    },
    devDependencies: {
      '@types/node': '^20',
      '@types/react': '^19',
      '@types/react-dom': '^19',
      'typescript': '^5',
    },
    overrides: {
      'enhanced-resolve': '5.17.1',
    },
  };

  // next.config.js — Module Federation with conditional shared deps
  const nextConfigJs = `process.env.NEXT_PRIVATE_LOCAL_WEBPACK = 'true';

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
    port: ${port},
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
        name: '${remoteName}',
        filename: 'static/chunks/remoteEntry.js',
        exposes: {
          './${pascal}App': './src/components/${pascal}App/index.tsx',
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
`;

  // tsconfig.json — with path aliases like mfe-react
  const tsconfig = JSON.stringify({
    compilerOptions: {
      target: 'ES2017',
      lib: ['dom', 'dom.iterable', 'esnext'],
      allowJs: true,
      skipLibCheck: true,
      strict: true,
      noEmit: true,
      esModuleInterop: true,
      module: 'esnext',
      moduleResolution: 'bundler',
      resolveJsonModule: true,
      isolatedModules: true,
      jsx: 'preserve',
      incremental: true,
      paths: {
        '@/*': ['./src/*'],
      },
    },
    include: ['next-env.d.ts', '**/*.ts', '**/*.tsx', '.next/types/**/*.ts'],
    exclude: ['node_modules'],
  }, null, 2);

  // Dockerfile — multi-stage with standalone runner (like mfe-react)
  const dockerfile = `FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY nginx.conf /etc/nginx/conf.d/default.conf

USER nextjs

EXPOSE ${port}
ENV PORT ${port}
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
`;

  // nginx.conf — reverse proxy to Node.js runner (like mfe-react)
  const nginxConf = `server {
  listen ${port};
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;

  # CORS — izinkan shell app mengakses remote entry
  add_header Access-Control-Allow-Origin "*" always;
  add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
  add_header Access-Control-Allow-Headers "Content-Type" always;

  # Cache static assets agresif
  location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
  }

  # remoteEntry.js — NO cache! Selalu fresh
  location ~* remoteEntry\\.js$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Access-Control-Allow-Origin "*";
  }

  # SPA fallback
  location / {
    try_files $uri $uri/ /index.html;
  }
}
`;

  // next-env.d.ts
  const nextEnvDts = `/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/pages/api-reference/config/typescript for more information.
`;

  // src/pages/_app.tsx
  const appTsx = `import type { AppProps } from 'next/app';

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
`;

  // src/pages/index.tsx — standalone demo page
  const indexPage = `import type { NextPage } from 'next';
import ${pascal}App from '../components/${pascal}App';

const Home: NextPage = () => {
  return <${pascal}App title="${toTitle(name)} MFE" />;
};

export default Home;
`;

  // src/components/{Pascal}App/index.tsx — exposed MFE component
  const componentTsx = `import React from 'react';

interface ${pascal}AppProps {
  title?: string;
}

const ${pascal}App: React.FC<${pascal}AppProps> = ({ title }) => {
  return (
    <div className="${name}-app">
      <h1>{title || '${toTitle(name)} MFE'}</h1>
      <p>Next.js Micro Frontend — powered by Module Federation</p>
      <style jsx>{\`
        .${name}-app {
          font-family: var(--font-sans, system-ui);
          color: var(--color-text, #111);
          padding: 1rem;
        }
      \`}</style>
    </div>
  );
};

export default ${pascal}App;
`;

  // .gitignore — Next.js / React best practices
  const gitignore = `# dependencies
node_modules/
.pnp
.pnp.js

# testing
coverage/

# next.js
.next/
out/

# production
build/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`;

  // Write files
  const pagesDir = path.join(base, 'src', 'pages');
  const componentsDir = path.join(base, 'src', 'components', `${pascal}App`);
  const publicDir = path.join(base, 'public');
  fs.mkdirSync(pagesDir, { recursive: true });
  fs.mkdirSync(componentsDir, { recursive: true });
  fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(base, '.gitignore'), gitignore);
  fs.writeFileSync(path.join(base, 'package.json'), JSON.stringify(pkg, null, 2));
  fs.writeFileSync(path.join(base, 'next.config.js'), nextConfigJs);
  fs.writeFileSync(path.join(base, 'tsconfig.json'), tsconfig);
  fs.writeFileSync(path.join(base, 'next-env.d.ts'), nextEnvDts);
  fs.writeFileSync(path.join(base, 'Dockerfile'), dockerfile);
  fs.writeFileSync(path.join(base, 'nginx.conf'), nginxConf);
  fs.writeFileSync(path.join(base, 'src', 'pages', '_app.tsx'), appTsx);
  fs.writeFileSync(path.join(base, 'src', 'pages', 'index.tsx'), indexPage);
  fs.writeFileSync(path.join(base, 'src', 'components', `${pascal}App`, 'index.tsx'), componentTsx);

  // ── public/ assets (same as mfe-react/public/) ──
  const publicAssets = {
    'file.svg': `<svg fill="none" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg"><path d="M14.5 13.5V5.41a1 1 0 0 0-.3-.7L9.8.29A1 1 0 0 0 9.08 0H1.5v13.5A2.5 2.5 0 0 0 4 16h8a2.5 2.5 0 0 0 2.5-2.5m-1.5 0v-7H8v-5H3v12a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1M9.5 5V2.12L12.38 5zM5.13 5h-.62v1.25h2.12V5zm-.62 3h7.12v1.25H4.5zm.62 3h-.62v1.25h7.12V11z" clip-rule="evenodd" fill="#666" fill-rule="evenodd"/></svg>`,
    'globe.svg': `<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><g clip-path="url(#a)"><path fill-rule="evenodd" clip-rule="evenodd" d="M10.27 14.1a6.5 6.5 0 0 0 3.67-3.45q-1.24.21-2.7.34-.31 1.83-.97 3.1M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16m.48-1.52a7 7 0 0 1-.96 0H7.5a4 4 0 0 1-.84-1.32q-.38-.89-.63-2.08a40 40 0 0 0 3.92 0q-.25 1.2-.63 2.08a4 4 0 0 1-.84 1.31zm2.94-4.76q1.66-.15 2.95-.43a7 7 0 0 0 0-2.58q-1.3-.27-2.95-.43a18 18 0 0 1 0 3.44m-1.27-3.54a17 17 0 0 1 0 3.64 39 39 0 0 1-4.3 0 17 17 0 0 1 0-3.64 39 39 0 0 1 4.3 0m1.1-1.17q1.45.13 2.69.34a6.5 6.5 0 0 0-3.67-3.44q.65 1.26.98 3.1M8.48 1.5l.01.02q.41.37.84 1.31.38.89.63 2.08a40 40 0 0 0-3.92 0q.25-1.2.63-2.08a4 4 0 0 1 .85-1.32 7 7 0 0 1 .96 0m-2.75.4a6.5 6.5 0 0 0-3.67 3.44 29 29 0 0 1 2.7-.34q.31-1.83.97-3.1M4.58 6.28q-1.66.16-2.95.43a7 7 0 0 0 0 2.58q1.3.27 2.95.43a18 18 0 0 1 0-3.44m.17 4.71q-1.45-.12-2.69-.34a6.5 6.5 0 0 0 3.67 3.44q-.65-1.27-.98-3.1" fill="#666"/></g><defs><clipPath id="a"><path fill="#fff" d="M0 0h16v16H0z"/></clipPath></defs></svg>`,
    'next.svg': `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 394 80"><path fill="#000" d="M262 0h68.5v12.7h-27.2v66.6h-13.6V12.7H262V0ZM149 0v12.7H94v20.4h44.3v12.6H94v21h55v12.6H80.5V0h68.7zm34.3 0h-17.8l63.8 79.4h17.9l-32-39.7 32-39.6h-17.9l-23 28.6-23-28.6zm18.3 56.7-9-11-27.1 33.7h17.8l18.3-22.7z"/><path fill="#000" d="M81 79.3 17 0H0v79.3h13.6V17l50.2 62.3H81Zm252.6-.4c-1 0-1.8-.4-2.5-1s-1.1-1.6-1.1-2.6.3-1.8 1-2.5 1.6-1 2.6-1 1.8.3 2.5 1a3.4 3.4 0 0 1 .6 4.3 3.7 3.7 0 0 1-3 1.8zm23.2-33.5h6v23.3c0 2.1-.4 4-1.3 5.5a9.1 9.1 0 0 1-3.8 3.5c-1.6.8-3.5 1.3-5.7 1.3-2 0-3.7-.4-5.3-1s-2.8-1.8-3.7-3.2c-.9-1.3-1.4-3-1.4-5h6c.1.8.3 1.6.7 2.2s1 1.2 1.6 1.5c.7.4 1.5.5 2.4.5 1 0 1.8-.2 2.4-.6a4 4 0 0 0 1.6-1.8c.3-.8.5-1.8.5-3V45.5zm30.9 9.1a4.4 4.4 0 0 0-2-3.3 7.5 7.5 0 0 0-4.3-1.1c-1.3 0-2.4.2-3.3.5-.9.4-1.6 1-2 1.6a3.5 3.5 0 0 0-.3 4c.3.5.7.9 1.3 1.2l1.8 1 2 .5 3.2.8c1.3.3 2.5.7 3.7 1.2a13 13 0 0 1 3.2 1.8 8.1 8.1 0 0 1 3 6.5c0 2-.5 3.7-1.5 5.1a10 10 0 0 1-4.4 3.5c-1.8.8-4.1 1.2-6.8 1.2-2.6 0-4.9-.4-6.8-1.2-2-.8-3.4-2-4.5-3.5a10 10 0 0 1-1.7-5.6h6a5 5 0 0 0 3.5 4.6c1 .4 2.2.6 3.4.6 1.3 0 2.5-.2 3.5-.6 1-.4 1.8-1 2.4-1.7a4 4 0 0 0 .8-2.4c0-.9-.2-1.6-.7-2.2a11 11 0 0 0-2.1-1.4l-3.2-1-3.8-1c-2.8-.7-5-1.7-6.6-3.2a7.2 7.2 0 0 1-2.4-5.7 8 8 0 0 1 1.7-5 10 10 0 0 1 4.3-3.5c2-.8 4-1.2 6.4-1.2 2.3 0 4.4.4 6.2 1.2 1.8.8 3.2 2 4.3 3.4 1 1.4 1.5 3 1.5 5h-5.8z"/></svg>`,
    'vercel.svg': `<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1155 1000"><path d="m577.3 0 577.4 1000H0z" fill="#fff"/></svg>`,
    'window.svg': `<svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16"><path fill-rule="evenodd" clip-rule="evenodd" d="M1.5 2.5h13v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1zM0 1h16v11.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 0 12.5zm3.75 4.5a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5M7 4.75a.75.75 0 1 1-1.5 0 .75.75 0 0 1 1.5 0m1.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5" fill="#666"/></svg>`,
  };

  Object.entries(publicAssets).forEach(([fileName, content]) => {
    fs.writeFileSync(path.join(publicDir, fileName), content);
  });

  // Copy favicon.ico from mfe-react/public template if it exists
  const faviconSource = path.join(process.cwd(), 'mfe-react', 'public', 'favicon.ico');
  if (fs.existsSync(faviconSource)) {
    fs.copyFileSync(faviconSource, path.join(publicDir, 'favicon.ico'));
  }
}

// ─── Template: Angular MFE ───
function generateAngular(name, port) {
  const base = path.join(process.cwd(), name);
  const pascal = toPascalCase(name);
  const tagName = name.replace(/_/g, '-');

  // package.json
  const pkg = {
    name,
    version: '0.1.0',
    private: true,
    scripts: {
      start: `ng serve --port ${port}`,
      build: 'ng build',
      watch: 'ng build --watch --configuration development',
    },
    dependencies: {
      '@angular/animations': '^17.0.0',
      '@angular/common': '^17.0.0',
      '@angular/compiler': '^17.0.0',
      '@angular/core': '^17.0.0',
      '@angular/elements': '^17.0.0',
      '@angular/forms': '^17.0.0',
      '@angular/platform-browser': '^17.0.0',
      '@angular/platform-browser-dynamic': '^17.0.0',
      '@angular/router': '^17.0.0',
      'rxjs': '~7.8.0',
      'tslib': '^2.3.0',
      'zone.js': '~0.14.0',
    },
    devDependencies: {
      '@angular-devkit/build-angular': '^17.0.0',
      '@angular/cli': '^17.0.0',
      '@angular/compiler-cli': '^17.0.0',
      '@angular-architects/module-federation': '^17.0.0',
      'typescript': '~5.2.0',
    },
  };

  // webpack.config.js
  const webpackConfig = `const {
  shareAll,
  withModuleFederationPlugin,
} = require('@angular-architects/module-federation/webpack');

module.exports = withModuleFederationPlugin({
  name: '${name.replace(/-/g, '_')}',
  exposes: {
    './${pascal}App': './src/app/app.module.ts',
    './${pascal}WebComponent': './src/bootstrap-wc.ts',
  },
  shared: {
    ...shareAll({
      singleton: true,
      strictVersion: true,
      requiredVersion: 'auto',
    }),
  },
});
`;

  // module-federation.config.ts (not needed but keep for reference)
  // src/main.ts — dual bootstrap
  const mainTs = `import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

// Dual bootstrap:
// - If <app-root> exists → bootstrap as standalone Angular app
// - Otherwise → only Web Component registration (handled by bootstrap-wc.ts)
const rootEl = document.querySelector('app-root');
if (rootEl) {
  platformBrowserDynamic()
    .bootstrapModule(AppModule)
    .catch((err) => console.error(err));
}
`;

  // src/bootstrap-wc.ts — Web Component registration
  const bootstrapWc = `import { createApplication } from '@angular/platform-browser';
import { createCustomElement } from '@angular/elements';
import { ${pascal}Module } from './app/app.module';
import { Component, Input, NgModule } from '@angular/core';

(async () => {
  const app = await createApplication({
    providers: [],
  });

  // Register as Custom Element
  customElements.define('${tagName}', ${pascal}Element);
})();
`;

  // src/app/app.module.ts
  const appModule = `import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { ${pascal}Component } from './${name}.component';

@NgModule({
  declarations: [${pascal}Component],
  imports: [BrowserModule],
  providers: [],
})
export class ${pascal}Module {}

// Standalone bootstrap entry
export { ${pascal}Component };
`;

  // src/app/name.component.ts
  const component = `import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-root',
  template: \`
    <div class="${name}-app">
      <h1>{{ title }}</h1>
      <p>Angular Micro Frontend — via Angular Elements</p>
    </div>
  \`,
  styles: [\`
    .${name}-app { font-family: var(--font-sans, system-ui); padding: 1rem; }
  \`]
})
export class ${pascal}Component {
  @Input() title = '${toTitle(name)} MFE';
}
`;

  // angular.json
  const angularJson = {
    $schema: './node_modules/@angular/cli/lib/config/schema.json',
    version: 1,
    newProjectRoot: 'projects',
    projects: {
      [name]: {
        projectType: 'application',
        root: '',
        sourceRoot: 'src',
        prefix: 'app',
        architect: {
          build: {
            builder: '@angular-architects/module-federation:webpack-builder',
            options: { outputPath: 'dist', index: 'src/index.html', main: 'src/main.ts', polyfills: ['zone.js'], tsConfig: 'tsconfig.app.json', assets: ['src/favicon.ico'], styles: ['src/styles.css'], scripts: [] },
            configurations: { production: { budgets: [{ type: 'initial', maximumWarning: '500kb', maximumError: '1mb' }], outputHashing: 'all' }, development: { buildOptimizer: false, optimization: false, vendorChunks: true, extractLicenses: false, sourceMap: true } },
            defaultConfiguration: 'production',
          },
          serve: { builder: '@angular-devkit/build-angular:dev-server', configurations: { production: { buildTarget: `${name}:build:production` }, development: { buildTarget: `${name}:build:development` } }, defaultConfiguration: 'development', options: { port } },
        },
      },
    },
  };

  // tsconfig.app.json
  const tsconfigApp = JSON.stringify({
    extends: './tsconfig.json',
    compilerOptions: { outDir: './out-tsc/app', types: [] },
    files: ['src/main.ts', 'src/bootstrap-wc.ts'],
    include: ['src/**/*.d.ts'],
  }, null, 2);

  // tsconfig.json
  const tsconfig = JSON.stringify({
    compileOnSave: false,
    compilerOptions: {
      baseUrl: './', outDir: './dist/out-tsc', forceConsistentCasingInFileNames: true, strict: true,
      noImplicitOverride: true, noPropertyAccessFromIndexSignature: true, noImplicitReturns: true,
      noFallthroughCasesInSwitch: true, sourceMap: true, declaration: false, downlevelIteration: true,
      experimentalDecorators: true, moduleResolution: 'bundler', importHelpers: true, target: 'ES2022',
      module: 'ES2022', useDefineForClassFields: false, lib: ['ES2022', 'dom'],
      skipLibCheck: true,
    },
    angularCompilerOptions: { enableI18nLegacyMessageIdFormat: false, strictInjectionParameters: true, strictInputAccessModifiers: true, strictTemplates: true },
  }, null, 2);

  // src/index.html
  const indexHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${toTitle(name)} MFE — Angular</title>
  <base href="/" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
</head>
<body>
  <app-root></app-root>
  <${tagName} title="MFE Preview"></${tagName}>
</body>
</html>`;

  // src/styles.css
  const styles = `/* ${toTitle(name)} MFE — Angular Styles */`;

  // Dockerfile (Angular: multi-stage build + Nginx)
  const dockerfile = `FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine AS runner
COPY --from=builder /app/dist/${name}/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE ${port}
`;

  // nginx.conf (Angular)
  const nginxConf = `server {
  listen ${port};
  server_name localhost;
  root /usr/share/nginx/html;
  index index.html;

  add_header Access-Control-Allow-Origin "*" always;
  add_header Access-Control-Allow-Methods "GET, OPTIONS" always;
  add_header Access-Control-Allow-Headers "Content-Type" always;

  location ~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    add_header Access-Control-Allow-Origin "*";
  }

  location ~* remoteEntry\\.js$ {
    expires -1;
    add_header Cache-Control "no-cache, no-store, must-revalidate";
    add_header Access-Control-Allow-Origin "*";
  }

  location / {
    try_files $uri $uri/ /index.html;
  }
}
`;

  // .gitignore — Angular best practices
  const gitignore = `# dependencies
node_modules/

# testing
coverage/

# production
dist/
tmp/

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# angular
.cache/
*.js.map
`;

  // Write files
  fs.mkdirSync(path.join(base, 'src', 'app'), { recursive: true });
  fs.writeFileSync(path.join(base, '.gitignore'), gitignore);
  fs.writeFileSync(path.join(base, 'package.json'), JSON.stringify(pkg, null, 2));
  fs.writeFileSync(path.join(base, 'webpack.config.js'), webpackConfig);
  fs.writeFileSync(path.join(base, 'angular.json'), JSON.stringify(angularJson, null, 2));
  fs.writeFileSync(path.join(base, 'tsconfig.json'), tsconfig);
  fs.writeFileSync(path.join(base, 'tsconfig.app.json'), tsconfigApp);
  fs.writeFileSync(path.join(base, 'Dockerfile'), dockerfile);
  fs.writeFileSync(path.join(base, 'nginx.conf'), nginxConf);
  fs.writeFileSync(path.join(base, 'src', 'index.html'), indexHtml);
  fs.writeFileSync(path.join(base, 'src', 'main.ts'), mainTs);
  fs.writeFileSync(path.join(base, 'src', 'bootstrap-wc.ts'), bootstrapWc);
  fs.writeFileSync(path.join(base, 'src', 'styles.css'), styles);
  fs.writeFileSync(path.join(base, 'src', 'app', 'app.module.ts'), appModule);
  fs.writeFileSync(path.join(base, 'src', 'app', `${name}.component.ts`), component);
}

// ─── Helpers ───
function toPascalCase(str) {
  return str.replace(/-/g, ' ').replace(/\w\S*/g, (w) => w.charAt(0).toUpperCase() + w.slice(1)).replace(/\s/g, '');
}
function toTitle(str) {
  return str.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Auto-update root files ───
function updateRootFiles(name, port, stack) {
  const root = process.cwd();
  const remoteName = name.replace(/-/g, '_');

  // 1. Update root package.json — add scripts + update dev/build/install:all
  const pkgPath = path.join(root, 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    pkg.scripts = pkg.scripts || {};

    // Add individual dev/build scripts
    const devScriptName = `dev:${name}`;
    const buildScriptName = `build:${name}`;
    if (!pkg.scripts[devScriptName]) pkg.scripts[devScriptName] = `cd ${name} && npm run dev`;
    if (!pkg.scripts[buildScriptName]) pkg.scripts[buildScriptName] = `cd ${name} && npm run build`;
    if (!pkg.scripts['generate:mfe']) pkg.scripts['generate:mfe'] = 'node scripts/generate-mfe.js';

    // Update main "dev" concurrently command — add new MFE
    const colors = ['cyan', 'blue', 'green', 'red', 'magenta', 'yellow', 'white'];
    const dev = pkg.scripts['dev'] || '';
    if (dev.includes('concurrently') && !dev.includes(name)) {
      // Add label
      const labelMatch = dev.match(/-n\s+(\S+)/);
      if (labelMatch) {
        const labels = labelMatch[1].split(',');
        labels.push(name.replace(/-/g, ''));
        pkg.scripts['dev'] = dev.replace(/-n\s+\S+/, `-n ${labels.join(',')}`);
      }
      // Add color
      const colorMatch = dev.match(/-c\s+(\S+)/);
      if (colorMatch) {
        const colorList = colorMatch[1].split(',');
        colorList.push(colors[colorList.length % colors.length]);
        pkg.scripts['dev'] = pkg.scripts['dev'].replace(/-c\s+\S+/, `-c ${colorList.join(',')}`);
      }
      // Add command
      const cmd = `"cd ${name} && npm run dev"`;
      if (!dev.includes(cmd)) {
        pkg.scripts['dev'] = pkg.scripts['dev'].replace(/(")$/, ` ${cmd}$1`);
      }
    }

    // Update main "build" script — add build:{name}
    const build = pkg.scripts['build'] || '';
    if (build && !build.includes(buildScriptName)) {
      pkg.scripts['build'] = build + ` && npm run ${buildScriptName}`;
    }

    // Update "install:all" — add the new MFE
    const install = pkg.scripts['install:all'] || '';
    if (install && !install.includes(name)) {
      // Insert before the last closing quote
      const lastQuote = install.lastIndexOf('"');
      if (lastQuote > 0) {
        const before = install.substring(0, lastQuote);
        const after = install.substring(lastQuote);
        pkg.scripts['install:all'] = before + ` && cd ../${name} && npm install` + after;
      }
    }

    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`  ✅ Updated root package.json (dev, build, install:all + ${name})`);
  }

  // 2. Update shell-app/next.config.js with new remote entry + CSP header
  const nextConfigPath = path.join(root, 'shell-app', 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    let nc = fs.readFileSync(nextConfigPath, 'utf-8');

    // Add remote entry to NextFederationPlugin
    // React (Next.js): remoteEntry di _next/static/chunks/
    // Vue/Angular: remoteEntry di root /
    const entryPath = stack === 'react' ? '_next/static/chunks/remoteEntry.js' : 'remoteEntry.js';
    const remoteEntry = `
          ${remoteName}: isServer
            ? \`${remoteName}@http://${name}:${port}/${entryPath}\`
            : \`${remoteName}@http://localhost:${port}/${entryPath}\`,`;
    nc = nc.replace(/(remotes:\s*\{)/, `$1${remoteEntry}`);

    // Add CSP env var and update script-src
    const envVar = `\n    const MFE_${remoteName.toUpperCase()}_URL = process.env.NEXT_PUBLIC_MFE_${remoteName.toUpperCase()}_URL || 'http://localhost:${port}';`;
    nc = nc.replace(/(const ContentSecurityPolicy)/, `${envVar}\n    $1`);
    nc = nc.replace(/(script-src[^;]+)(;)/, `$1 \${MFE_${remoteName.toUpperCase()}_URL}$2`);

    fs.writeFileSync(nextConfigPath, nc);
    console.log(`  ✅ Updated shell-app/next.config.js (added ${remoteName} remote + CSP)`);
  }

  // 3. Update nginx/nginx.conf
  const nginxPath = path.join(root, 'nginx', 'nginx.conf');
  if (fs.existsSync(nginxPath)) {
    let nginx = fs.readFileSync(nginxPath, 'utf-8');
    const upstreamBlock = `
  upstream ${name} {
    server ${name}:${port};
    keepalive 16;
  }`;
    const locationBlock = `
  location /mfe/${name}/ {
    proxy_pass http://${name}/;
    add_header Cache-Control "public, max-age=3600";
  }`;
    nginx = nginx.replace(/(upstream mfe_angular)/, `${upstreamBlock}\n\n$1`);
    nginx = nginx.replace(/(location \/mfe\/angular\/)/, `${locationBlock}\n\n$1`);
    fs.writeFileSync(nginxPath, nginx);
    console.log(`  ✅ Updated nginx/nginx.conf (added upstream + location for ${name})`);
  }

  // 4. Update shell-app MFE registry with proper config per stack
  const registryPath = path.join(root, 'shell-app', 'src', 'lib', 'mfe-registry.ts');
  if (fs.existsSync(registryPath)) {
    let registry = fs.readFileSync(registryPath, 'utf-8');
    const pascal = toPascalCase(name);
    const tagName = name.replace(/_/g, '-');

    let entry;
    if (stack === 'vue') {
      // Vue MFE: Web Component via script injection (useModuleFederation: false)
      // Production: Vite build output = main.js (via rollupOptions.output.entryFileNames)
      // Development: Vite dev server serve /src/main.ts sebagai ESM
      entry = `\n  ${name}: {
    name: '${remoteName}',
    remoteUrl: 'http://localhost:${port}/remoteEntry.js',
    remoteUrlSSR: 'http://${name}:${port}/remoteEntry.js',
    bundleUrl: 'http://localhost:${port}/main.js',
    bundleUrlSSR: 'http://${name}:${port}/main.js',
    devBundleUrl: 'http://localhost:${port}/src/main.ts',
    devBundleUrlSSR: 'http://${name}:${port}/src/main.ts',
    exposedModule: './${pascal}App',
    webComponentTag: '${tagName}',
    useModuleFederation: false,
    ssr: false,
    prefetch: false,
  },`;
    } else if (stack === 'react') {
      // React MFE: Module Federation (loadRemote via enhanced runtime)
      // React (Next.js) serves remoteEntry at _next/static/chunks/remoteEntry.js
      entry = `\n  ${name}: {
    name: '${remoteName}',
    remoteUrl: 'http://localhost:${port}/_next/static/chunks/remoteEntry.js',
    remoteUrlSSR: 'http://${name}:${port}/_next/static/chunks/remoteEntry.js',
    exposedModule: './${pascal}App',
    ssr: true,
    prefetch: false,
  },`;
    } else if (stack === 'angular') {
      // Angular MFE: Web Component via script injection
      entry = `\n  ${name}: {
    name: '${remoteName}',
    remoteUrl: 'http://localhost:${port}/main.js',
    remoteUrlSSR: 'http://${name}:${port}/main.js',
    bundleUrl: 'http://localhost:${port}/main.js',
    bundleUrlSSR: 'http://${name}:${port}/main.js',
    webComponentTag: '${tagName}',
    useModuleFederation: false,
    ssr: false,
    prefetch: false,
  },`;
    }

    // Insert before the closing brace of MFE_REGISTRY
    registry = registry.replace(/(\};?\s*)$/, `${entry}$1`);
    fs.writeFileSync(registryPath, registry);
    console.log(`  ✅ Updated shell-app MFE registry (added ${name} as ${stack} MFE)`);
  }
}

// ─── Main ───
function main() {
  const args = parseArgs();
  const errors = validate(args);

  if (errors.length > 0) {
    console.error('\n❌ Validation errors:');
    errors.forEach((e) => console.error(`   • ${e}`));
    console.error('\nUsage: node scripts/generate-mfe.js --name=mfe-xxx --stack=vue|angular|react --port=3xxx\n');
    process.exit(1);
  }

  const { name, stack, port } = args;
  const portNum = parseInt(port, 10);

  console.log(`\n🔨 Generating MFE: ${name} (${stack}, port ${port})...\n`);

  // Generate boilerplate
  switch (stack) {
    case 'vue':
      generateVue(name, portNum);
      break;
    case 'react':
      generateReact(name, portNum);
      break;
    case 'angular':
      generateAngular(name, portNum);
      break;
  }

  console.log(`  ✅ Created folder: ${name}/`);

  // Auto-update root files
  updateRootFiles(name, portNum, stack);

  // Install dependencies
  console.log(`\n📦 Installing dependencies for ${name}...`);
  try {
    execSync('npm install', { cwd: path.join(process.cwd(), name), stdio: 'pipe' });
    console.log('  ✅ Dependencies installed');
  } catch (e) {
    console.warn('  ⚠️  npm install failed — run manually: cd', name, '&& npm install');
  }

  // Summary
  console.log('\n' + '═'.repeat(50));
  console.log('  ✅ MFE Generated Successfully!');
  console.log('═'.repeat(50));
  console.log(`  Name:    ${name}`);
  console.log(`  Stack:   ${stack}`);
  console.log(`  Port:    ${port}`);
  console.log(`  Folder:  ${name}/`);
  console.log('');
  console.log('  Updated files:');
  console.log('  • root package.json');
  console.log('  • shell-app/next.config.js');
  if (fs.existsSync(path.join(process.cwd(), 'nginx', 'nginx.conf'))) {
    console.log('  • nginx/nginx.conf');
  }
  console.log('  • shell-app/src/lib/mfe-registry.ts');
  console.log('');
  console.log('  To start developing:');
  console.log(`    cd ${name} && npm run dev`);
  console.log('');
  console.log('  To run all services:');
  console.log('    make dev');
  console.log('═'.repeat(50) + '\n');
}

main();
