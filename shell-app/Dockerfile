# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build args untuk environment variables
ARG NEXT_PUBLIC_MFE_REACT_URL
ARG NEXT_PUBLIC_MFE_VUE_URL
ARG NEXT_PUBLIC_MFE_ANGULAR_URL
ARG NEXT_PUBLIC_API_URL
ARG NEXT_PUBLIC_SITE_URL

ENV NEXT_PUBLIC_MFE_REACT_URL=$NEXT_PUBLIC_MFE_REACT_URL
ENV NEXT_PUBLIC_MFE_VUE_URL=$NEXT_PUBLIC_MFE_VUE_URL
ENV NEXT_PUBLIC_MFE_ANGULAR_URL=$NEXT_PUBLIC_MFE_ANGULAR_URL
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_SITE_URL=$NEXT_PUBLIC_SITE_URL

RUN npm run build

# Stage 3: Runner (minimal image)
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV production

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
