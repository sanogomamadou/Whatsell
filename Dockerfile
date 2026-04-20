FROM node:20.19-alpine

RUN npm install -g pnpm@9

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

COPY apps/api/prisma ./apps/api/prisma

ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"
ENV CACHE_BUST=2

RUN pnpm install --frozen-lockfile

COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json apps/api/tsconfig.build.json apps/api/nest-cli.json ./apps/api/
COPY apps/api/prisma.config.ts ./apps/api/
COPY packages/shared/src ./packages/shared/src
COPY packages/shared/tsconfig.json ./packages/shared/

RUN pnpm --filter @whatsell/api build

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
