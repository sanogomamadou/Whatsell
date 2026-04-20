FROM node:20.19-alpine

RUN npm install -g pnpm@9

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

COPY apps/api/prisma ./apps/api/prisma

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

RUN pnpm install --frozen-lockfile

COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json ./apps/api/
COPY apps/api/prisma.config.ts ./apps/api/
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/

RUN set -e && \
    echo ">>> Building @whatsell/api..." && \
    pnpm --filter @whatsell/api build && \
    echo ">>> Build complete. Verifying dist output..." && \
    ls -la apps/api/dist/ && \
    echo ">>> Compiled entry point:" && \
    ls -la apps/api/dist/main.js

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001', (r) => process.exit(r.statusCode >= 500 ? 1 : 0)).on('error', () => process.exit(1))"

CMD ["node", "apps/api/dist/main.js"]
