# Iberic Distributions — production image for Coolify / Docker
FROM node:22-alpine AS base
RUN apk add --no-cache libc6-compat openssl
WORKDIR /app

FROM base AS deps
COPY package.json package-lock.json ./
# Include devDependencies even if Coolify injects NODE_ENV=production at build time.
RUN npm ci --ignore-scripts --include=dev

FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
RUN npx prisma generate
RUN npx esbuild prisma/seed.ts \
  --bundle \
  --platform=node \
  --format=cjs \
  --outfile=prisma/seed.bundle.cjs \
  --external:@prisma/client
RUN npm run build

FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Full node_modules from builder (includes generated Prisma engines for Alpine).
COPY --from=builder /app/node_modules /opt/ops/node_modules
COPY scripts/ops-db-push.sh /opt/ops/ops-db-push.sh
COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh /opt/ops/ops-db-push.sh \
  && chown -R nextjs:nodejs /opt/ops

RUN mkdir -p public/uploads/docs && chown -R nextjs:nodejs public/uploads

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

ENTRYPOINT ["/docker-entrypoint.sh"]
CMD ["node", "server.js"]
