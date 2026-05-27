---
name: micro-frontend-architecture
description: >
  Expert skill for architecting, building, and deploying production-grade Micro Frontend (MFE)
  systems using React, Vue, and Angular with SSR support, SEO optimization, and Docker deployment.
  Use this skill whenever the user mentions micro frontend, module federation, multi-framework frontend,
  MFE orchestration, shell/host app, remote app, cross-framework integration, SSR for micro frontend,
  or wants to deploy multiple frontend apps as a unified system. Also trigger for questions about
  sharing state between React and Vue, loading Angular inside Next.js, Web Components as MFE,
  or setting up Nginx for multiple frontend services. This skill covers architecture decisions,
  code patterns, Docker setup, CI/CD, and SEO strategy end-to-end.
---

# Micro Frontend Architecture Skill

Skill ini memandu pembuatan arsitektur Micro Frontend (MFE) production-grade yang mendukung
React, Vue, Angular secara bersamaan dengan SSR, SEO optimal, dan Docker deployment.

## Quick Decision Tree

```
User asks about...
├── Architecture overview / setup awal    → Baca references/01-architecture.md
├── Shell app / Next.js host config       → Baca references/02-shell-app.md
├── React MFE setup                       → Baca references/03-mfe-react.md
├── Vue MFE / Web Components              → Baca references/04-mfe-vue.md
├── Angular MFE / Angular Elements        → Baca references/05-mfe-angular.md
├── Module Federation config              → Baca references/06-module-federation.md
├── SSR strategy / hydration              → Baca references/07-ssr-strategy.md
├── SEO / metadata / sitemap              → Baca references/08-seo.md
├── Shared state / event bus              → Baca references/09-state-management.md
├── Docker / Nginx / deployment           → Baca references/10-docker-deploy.md
└── CI/CD pipeline                        → Baca references/11-cicd.md
```

## Stack Utama

| Layer | Teknologi | Versi |
|-------|-----------|-------|
| Shell / Host | Next.js (App Router) | 14+ |
| Module Federation | `@module-federation/nextjs-mf` | latest |
| React MFE | React + Next.js | 18+ / 14+ |
| Vue MFE | Vue 3 + Vite + `vite-plugin-federation` | 3.x |
| Angular MFE | Angular + `@angular-architects/module-federation` | 17+ |
| Container | Docker + Nginx | alpine |
| Reverse Proxy | Nginx | alpine |
| CI/CD | GitHub Actions | — |

## Prinsip Non-Negotiable

1. **Shell owns routing** — MFE tidak boleh mengontrol top-level URL
2. **remoteEntry.js TIDAK boleh di-cache** — selalu `Cache-Control: no-cache`
3. **Singleton shared deps** — `react`, `vue`, `@angular/core` harus `singleton: true`
4. **Error Boundary per MFE** — kegagalan satu MFE tidak boleh crash keseluruhan app
5. **SSR hanya untuk halaman publik** — dashboard/auth area gunakan CSR
6. **Design tokens via CSS variables** — satu-satunya cara sharing style antar framework
7. **Event Bus untuk cross-MFE comms** — tidak ada direct import antar MFE

## Alur Kerja Standar

Ketika user meminta setup MFE dari awal, ikuti urutan ini:

```
Step 1  →  Tentukan arsitektur & rendering strategy per route
Step 2  →  Setup shell app (Next.js) + Module Federation config
Step 3  →  Setup setiap MFE sesuai framework (React/Vue/Angular)
Step 4  →  Konfigurasi shared dependencies & design tokens
Step 5  →  Implementasi SSR & hydration strategy
Step 6  →  SEO: metadata, structured data, sitemap
Step 7  →  Cross-MFE state management via Event Bus
Step 8  →  Auth flow — terpusat di shell, propagate ke MFE
Step 9  →  Dockerfile per service + Docker Compose
Step 10 →  Nginx reverse proxy config
Step 11 →  CI/CD dengan path-based change detection
```

Untuk pertanyaan spesifik tentang satu step, langsung baca reference file yang relevan
dari daftar di Decision Tree di atas.

## File Referensi

Setiap reference file mencakup satu topik secara mendalam dengan kode siap pakai:

- `references/01-architecture.md` — Diagram arsitektur, rendering strategy matrix, prinsip desain
- `references/02-shell-app.md` — Next.js setup, MFELoader component, MFE Registry, prefetching
- `references/03-mfe-react.md` — React MFE dengan Next.js, SSR support, exposed modules
- `references/04-mfe-vue.md` — Vue 3 sebagai Web Component (`.ce.vue`), Shadow DOM, props via attrs
- `references/05-mfe-angular.md` — Angular Elements, `createCustomElement`, bootstrap-wc pattern
- `references/06-module-federation.md` — Webpack 5 config, dynamic loading, version conflict handling
- `references/07-ssr-strategy.md` — Streaming SSR, hydration strategies, route-level rendering matrix
- `references/08-seo.md` — Metadata API, JSON-LD, dynamic sitemap, Core Web Vitals
- `references/09-state-management.md` — Event Bus, URL state, auth propagation, shared store
- `references/10-docker-deploy.md` — Multi-stage Dockerfiles, Docker Compose dev+prod, Nginx config, Makefile
- `references/11-cicd.md` — GitHub Actions, path-based change detection, registry push, rollback
