FROM node:20.19-alpine

RUN npm install -g pnpm@9

WORKDIR /app

COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

RUN pnpm install --frozen-lockfile

COPY apps/api ./apps/api
COPY packages/shared ./packages/shared

WORKDIR /app/apps/api
RUN npx prisma generate

WORKDIR /app
RUN pnpm --filter @whatsell/api build

EXPOSE 3001

CMD ["node", "apps/api/dist/main.js"]
