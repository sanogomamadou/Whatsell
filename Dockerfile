# ── Builder stage ────────────────────────────────────────────────────────────
FROM node:20.19-alpine AS builder

RUN npm install -g pnpm@9

WORKDIR /app

# Copy manifests first so dependency installation is cached independently
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Prisma schema must be present before install so postinstall can run prisma generate
COPY apps/api/prisma ./apps/api/prisma

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV CACHE_BUST=5

RUN pnpm install --frozen-lockfile

# Copy source files needed for compilation
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json ./apps/api/
COPY apps/api/prisma.config.ts ./apps/api/
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/

WORKDIR /app/apps/api
RUN pnpm exec prisma generate
RUN npx nest build
RUN ls -la dist/
RUN if [ ! -f dist/src/main.js ]; then \
      echo "ERROR: dist/src/main.js was not produced. Full dist/ tree:"; \
      find dist/ -type f | sort; \
      exit 1; \
    fi

WORKDIR /app

# ── Runtime stage ─────────────────────────────────────────────────────────────
FROM node:20.19-alpine

RUN npm install -g pnpm@9

WORKDIR /app

# Copy manifests for production dependency installation
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Prisma schema required by postinstall (prisma generate)
COPY apps/api/prisma ./apps/api/prisma

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN pnpm install --prod --frozen-lockfile

# Copy compiled output from builder stage
COPY --from=builder /app/apps/api/dist ./apps/api/dist

EXPOSE 3001

CMD ["node", "apps/api/dist/src/main.js"]
