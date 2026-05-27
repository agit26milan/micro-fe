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

    // Check if port is already used in docker-compose.yml
    const dcPath = path.join(process.cwd(), 'docker-compose.yml');
    if (fs.existsSync(dcPath) && args.port) {
      const dc = fs.readFileSync(dcPath, 'utf-8');
      if (dc.includes(`"${args.port}:${args.port}"`)) {
        errors.push(`Port ${args.port} is already defined in docker-compose.yml`);
      }
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

  // Write files
  fs.mkdirSync(path.join(base, 'src', 'components'), { recursive: true });
  fs.writeFileSync(path.join(base, 'package.json'), JSON.stringify(pkg, null, 2));
  fs.writeFileSync(path.join(base, 'vite.config.ts'), viteConfig);
  fs.writeFileSync(path.join(base, 'index.html'), indexHtml);
  fs.writeFileSync(path.join(base, 'tsconfig.json'), tsconfig);
  fs.writeFileSync(path.join(base, 'Dockerfile'), dockerfile);
  fs.writeFileSync(path.join(base, 'nginx.conf'), nginxConf);
  fs.writeFileSync(path.join(base, 'src', 'main.ts'), mainTs);
  fs.writeFileSync(path.join(base, 'src', 'App.vue'), appVue);
}

// ─── Template: React MFE ───
function generateReact(name, port) {
  const base = path.join(process.cwd(), name);

  // package.json
  const pkg = {
    name,
    version: '0.1.0',
    private: true,
    type: 'module',
    scripts: { dev: 'vite', build: 'vite build', preview: 'vite preview' },
    dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
    devDependencies: {
      '@vitejs/plugin-react': '^4.2.0',
      'vite': '^5.0.0',
      '@originjs/vite-plugin-federation': '^1.3.0',
      'typescript': '^5.3.0',
      '@types/react': '^18.2.0',
      '@types/react-dom': '^18.2.0',
    },
  };

  // vite.config.ts
  const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import federation from '@originjs/vite-plugin-federation';

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: '${name.replace(/-/g, '_')}',
      filename: 'remoteEntry.js',
      exposes: {
        './${toPascalCase(name)}App': './src/App.tsx',
      },
      shared: {
        react: { singleton: true, requiredVersion: '^18.0.0' },
        'react-dom': { singleton: true, requiredVersion: '^18.0.0' },
      },
    }),
  ],
  build: {
    target: 'esnext',
    minify: false,
    cssCodeSplit: false,
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
  <title>${toTitle(name)} MFE — React</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;

  // src/main.tsx
  const mainTsx = `import React from 'react';
import ReactDOM from 'react-dom/client';

// Standalone bootstrap
const rootEl = document.getElementById('root');
if (rootEl) {
  const { default: App } = await import('./App');
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
`;

  // src/App.tsx
  const appTsx = `import React from 'react';

interface ${toPascalCase(name)}AppProps {
  title?: string;
}

const ${toPascalCase(name)}App: React.FC<${toPascalCase(name)}AppProps> = ({ title }) => {
  return (
    <div className="${name}-app">
      <h1>{title || '${toTitle(name)} MFE'}</h1>
      <p>React Micro Frontend — powered by Vite + Module Federation</p>
    </div>
  );
};

export default ${toPascalCase(name)}App;
`;

  // tsconfig.json
  const tsconfig = JSON.stringify({
    compilerOptions: {
      target: 'ES2020',
      module: 'ESNext',
      moduleResolution: 'bundler',
      strict: true,
      jsx: 'react-jsx',
      resolveJsonModule: true,
      isolatedModules: true,
      esModuleInterop: true,
      lib: ['ES2020', 'DOM'],
      skipLibCheck: true,
      noEmit: true,
    },
    include: ['src'],
  }, null, 2);

  // Dockerfile (React: multi-stage Node build + standalone)
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

  // nginx.conf (React)
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

  // Write files
  fs.mkdirSync(path.join(base, 'src', 'components'), { recursive: true });
  fs.writeFileSync(path.join(base, 'package.json'), JSON.stringify(pkg, null, 2));
  fs.writeFileSync(path.join(base, 'vite.config.ts'), viteConfig);
  fs.writeFileSync(path.join(base, 'index.html'), indexHtml);
  fs.writeFileSync(path.join(base, 'tsconfig.json'), tsconfig);
  fs.writeFileSync(path.join(base, 'Dockerfile'), dockerfile);
  fs.writeFileSync(path.join(base, 'nginx.conf'), nginxConf);
  fs.writeFileSync(path.join(base, 'src', 'main.tsx'), mainTsx);
  fs.writeFileSync(path.join(base, 'src', 'App.tsx'), appTsx);
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

  // Write files
  fs.mkdirSync(path.join(base, 'src', 'app'), { recursive: true });
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

  // 2. Update docker-compose.yml
  const dcPath = path.join(root, 'docker-compose.yml');
  if (fs.existsSync(dcPath)) {
    let dc = fs.readFileSync(dcPath, 'utf-8');
    // Add service before the last line (or before 'networks:')
    const serviceBlock = `
  ${name}:
    build:
      context: ./${name}
      dockerfile: Dockerfile
    ports:
      - "${port}:${port}"
    networks:
      - mfe-network
    restart: unless-stopped`;
    dc = dc.replace(/(networks:)/, `${serviceBlock}\n\n$1`);
    fs.writeFileSync(dcPath, dc);
    console.log(`  ✅ Updated docker-compose.yml (added ${name} service on port ${port})`);
  }

  // 3. Update shell-app/next.config.js with new remote entry + CSP header
  const nextConfigPath = path.join(root, 'shell-app', 'next.config.js');
  if (fs.existsSync(nextConfigPath)) {
    let nc = fs.readFileSync(nextConfigPath, 'utf-8');

    // Add remote entry to NextFederationPlugin
    const remoteEntry = `
          ${remoteName}: isServer
            ? \`${remoteName}@http://${name}:${port}/remoteEntry.js\`
            : \`${remoteName}@http://localhost:${port}/remoteEntry.js\`,`;
    nc = nc.replace(/(remotes:\s*\{)/, `$1${remoteEntry}`);

    // Add CSP env var and update script-src
    const envVar = `\n    const MFE_${remoteName.toUpperCase()}_URL = process.env.NEXT_PUBLIC_MFE_${remoteName.toUpperCase()}_URL || 'http://localhost:${port}';`;
    nc = nc.replace(/(const ContentSecurityPolicy)/, `${envVar}\n    $1`);
    nc = nc.replace(/(script-src[^;]+)(;)/, `$1 \${MFE_${remoteName.toUpperCase()}_URL}$2`);

    fs.writeFileSync(nextConfigPath, nc);
    console.log(`  ✅ Updated shell-app/next.config.js (added ${remoteName} remote + CSP)`);
  }

  // 4. Update nginx/nginx.conf
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

  // 5. Update shell-app MFE registry with proper config per stack
  const registryPath = path.join(root, 'shell-app', 'src', 'lib', 'mfe-registry.ts');
  if (fs.existsSync(registryPath)) {
    let registry = fs.readFileSync(registryPath, 'utf-8');
    const pascal = toPascalCase(name);
    const tagName = name.replace(/_/g, '-');

    let entry;
    if (stack === 'vue') {
      // Vue MFE: Web Component via script injection (useModuleFederation: false)
      entry = `\n  ${name}: {
    name: '${remoteName}',
    remoteUrl: 'http://localhost:${port}/remoteEntry.js',
    remoteUrlSSR: 'http://${name}:${port}/remoteEntry.js',
    bundleUrl: 'http://localhost:${port}/src/main.ts',
    bundleUrlSSR: 'http://${name}:${port}/src/main.ts',
    exposedModule: './${pascal}App',
    webComponentTag: '${tagName}',
    useModuleFederation: false,
    ssr: false,
    prefetch: false,
  },`;
    } else if (stack === 'react') {
      // React MFE: Module Federation (loadRemote via enhanced runtime)
      entry = `\n  ${name}: {
    name: '${remoteName}',
    remoteUrl: 'http://localhost:${port}/remoteEntry.js',
    remoteUrlSSR: 'http://${name}:${port}/remoteEntry.js',
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
  console.log('  • docker-compose.yml');
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
