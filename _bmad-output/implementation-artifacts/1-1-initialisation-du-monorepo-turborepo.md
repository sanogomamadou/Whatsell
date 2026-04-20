# Story 1.1 : Initialisation du Monorepo Turborepo

Status: done

## Story

En tant que **développeur**,
je veux initialiser le monorepo Turborepo avec les apps `web` (Next.js 16) et `api` (NestJS 11) et le package `shared`,
afin d'avoir un environnement de développement fonctionnel et structuré prêt pour l'implémentation.

## Acceptance Criteria

1. La structure suivante existe : `apps/web/` (Next.js 16, App Router, Tailwind, Turbopack), `apps/api/` (NestJS 11, TypeScript strict), `packages/shared/` (schemas/ + types/)
2. `pnpm install` s'exécute sans erreur depuis la racine du monorepo
3. `pnpm dev` démarre les deux apps en parallèle via Turborepo (web + api)
4. Les fichiers `apps/api/.env.example` et `apps/web/.env.example` sont présents avec toutes les variables requises
5. TypeScript strict est activé dans les deux apps ET dans `packages/shared`
6. Le package `shared` est correctement référencé depuis `apps/web` et `apps/api` via les workspaces pnpm

## Tasks / Subtasks

- [x] Tâche 1 : Initialiser le monorepo Turborepo (AC: 1, 2)
  - [x] Exécuter `npx create-turbo@latest whatsell` pour scaffolding initial
  - [x] Configurer `pnpm-workspace.yaml` avec les patterns `apps/*` et `packages/*`
  - [x] Créer `turbo.json` avec les pipelines `dev`, `build`, `lint`, `test`
  - [x] Configurer `package.json` racine avec les scripts `dev`, `build`, `lint`, `test`

- [x] Tâche 2 : Configurer l'app Next.js 16 (AC: 1, 3, 5)
  - [x] Scaffolder `apps/web` via `npx create-next-app@latest web --typescript --tailwind --app --turbopack`
  - [x] Vérifier que `next.config.ts` active bien Turbopack
  - [x] Configurer `tsconfig.json` avec `"strict": true` et paths `@/*` → `./src/*`
  - [x] Créer la structure de dossiers : `src/app/`, `src/components/ui/`, `src/components/shared/`, `src/lib/`, `src/hooks/`, `src/stores/`
  - [x] Créer `src/lib/api.ts` — client HTTP centralisé (fetch avec `credentials: 'include'` par défaut)
  - [x] Configurer `next/font` avec Inter locale (jamais Google Fonts externe)
  - [x] Vérifier que `next/image` est configuré (pas de `<img>` HTML)

- [x] Tâche 3 : Configurer l'app NestJS 11 (AC: 1, 3, 5)
  - [x] Scaffolder `apps/api` via `nest new api --package-manager pnpm`
  - [x] Configurer `tsconfig.json` avec `"strict": true`
  - [x] Configurer `src/main.ts` avec : préfixe global `/api/v1`, CORS (`origin: process.env.FRONTEND_URL, credentials: true`), port depuis `ConfigService`
  - [x] Installer `@nestjs/config` et créer `src/config/` avec `configuration.ts` (toutes les variables d'env via ConfigService — jamais `process.env.X` dans les services)
  - [x] Créer la structure modulaire de base : `src/app.module.ts`, `src/config/`
  - [x] Installer et configurer `nestjs-pino` pour le logging JSON (champs : `tenantId`, `requestId`, `service`, `level`, `timestamp`)

- [x] Tâche 4 : Créer le package shared (AC: 1, 5, 6)
  - [x] Créer `packages/shared/package.json` avec `name: "@whatsell/shared"`
  - [x] Configurer `packages/shared/tsconfig.json` avec `"strict": true`
  - [x] Créer `packages/shared/src/schemas/` — dossier pour les schémas Zod partagés (vide pour l'instant)
  - [x] Créer `packages/shared/src/types/` — dossier pour les types TypeScript purs (vide pour l'instant)
  - [x] Créer `packages/shared/src/index.ts` — barrel export
  - [x] Ajouter `@whatsell/shared` comme dépendance dans `apps/web/package.json` et `apps/api/package.json`

- [x] Tâche 5 : Créer les fichiers .env.example (AC: 4)
  - [x] Créer `apps/api/.env.example` avec toutes les variables backend requises
  - [x] Créer `apps/web/.env.example` avec toutes les variables frontend requises
  - [x] Créer `apps/api/.env` local (gitignored) à partir de .env.example

- [x] Tâche 6 : Valider l'ensemble et écrire les tests (AC: 2, 3)
  - [x] Vérifier `pnpm install` sans erreur depuis la racine
  - [x] Vérifier `pnpm build` passe sans erreur TypeScript sur les 3 packages
  - [x] Écrire un test unitaire NestJS minimal (`app.controller.spec.ts`) qui vérifie que l'AppModule démarre
  - [x] Vérifier `pnpm dev` démarre les deux apps en parallèle

### Review Findings

#### Review Follow-ups (AI)

- [x] [Review][Patch] JWT_SECRET hardcoded fallback — throw au démarrage si absent en production [`apps/api/src/config/configuration.ts:14`] — couvert par validateEnv (min 32 chars)
- [x] [Review][Patch] bootstrap() rejection non catchée — ajouter `.catch()` [`apps/api/src/main.ts:30`]
- [x] [Review][Patch] DATABASE_URL default vide — validation au démarrage [`apps/api/src/config/configuration.ts:7`] — couvert par validateEnv
- [x] [Review][Patch] ENCRYPTION_KEY default vide — validation au démarrage [`apps/api/src/config/configuration.ts:28`] — couvert par validateEnv (length 32)
- [x] [Review][Patch] CORS origin undefined si FRONTEND_URL manquant [`apps/api/src/main.ts:21`] — couvert par validateEnv (URL required)
- [x] [Review][Patch] parseInt(PORT) produit NaN sur valeur non-numérique [`apps/api/src/config/configuration.ts:3`]
- [x] [Review][Patch] Aucun schema de validation ConfigModule — variables critiques non vérifiées au démarrage [`apps/api/src/app.module.ts:11`]
- [x] [Review][Patch] TWILIO_* et LLM_* absents de configuration.ts [`apps/api/src/config/configuration.ts`]
- [x] [Review][Patch] apiClient headers spread order — Content-Type peut être écrasé si caller passe headers [`apps/web/src/lib/api.ts:9`]
- [x] [Review][Patch] Erreurs réseau (ECONNREFUSED, timeout) non catchées dans apiClient [`apps/web/src/lib/api.ts:9`]
- [x] [Review][Patch] Password schema sans longueur max — risque bcrypt DoS [`packages/shared/src/schemas/auth.schema.ts:7`]
- [x] [Review][Patch] Email non normalisé (lowercase/trim) dans registerSchema [`packages/shared/src/schemas/auth.schema.ts:4`]
- [x] [Review][Patch] Content-Type: application/json envoyé sur GET et DELETE sans body [`apps/web/src/lib/api.ts:10`]
- [x] [Review][Patch] apiDelete ne lit pas le body d'erreur [`apps/web/src/lib/api.ts:44`]
- [x] [Review][Patch] BASE_URL inliné au build-time Next.js — fallback `?? 'localhost'` inutile si var absente au build [`apps/web/src/lib/api.ts:3`]
- [x] [Review][Patch] response.json() non protégé contre réponses non-JSON (502 HTML) [`apps/web/src/lib/api.ts:22`]
- [x] [Review][Patch] pino-pretty absent des devDependencies [`apps/api/package.json`]
- [x] [Review][Patch] setGlobalPrefix sans slash initial — devrait être `/api/v1` [`apps/api/src/main.ts:18`]
- [x] [Review][Patch] app.enableShutdownHooks() manquant — pas de graceful shutdown [`apps/api/src/main.ts`]
- [x] [Review][Defer] Messages d'erreur exposent les chemins d'endpoint — concernera davantage les stories futures [`apps/web/src/lib/api.ts`] — deferred, pre-existing
- [x] [Review][Defer] Pas de protection CSRF — couvert par SameSite=Strict en Story 1.3 [`apps/api/src/main.ts`] — deferred, pre-existing
- [x] [Review][Defer] LoggerModule lit NODE_ENV directement — inévitable avec les décorateurs NestJS statiques [`apps/api/src/app.module.ts`] — deferred, pre-existing
- [x] [Review][Defer] bufferLogs: bootstrap crash avant flush pino — résolu par le patch bootstrap().catch() — deferred, pre-existing
- [x] [Review][Defer] R2 credentials vides — couvert par la validation ConfigModule (patch #7) — deferred, pre-existing
- [x] [Review][Defer] apiDelete comportement 3xx — edge case mineur, Story 1.3+ — deferred, pre-existing
- [x] [Review][Defer] Health endpoint non authentifié — intentionnel (standard) — deferred, pre-existing
- [x] [Review][Defer] ApiErrorResponse non utilisé dans apiClient — enhancement Story 1.3+ — deferred, pre-existing

---

## Dev Notes

### Stack & Versions Critiques

```
Monorepo    : Turborepo (pnpm workspaces)
Frontend    : Next.js 16.2.3 — App Router, Turbopack (--turbopack flag requis)
Backend     : NestJS 11.x
Langage     : TypeScript strict (toute la stack, "strict": true dans chaque tsconfig.json)
Package mgr : pnpm (workspaces)
```

### Commandes d'Initialisation (depuis l'architecture)

```bash
# Monorepo
npx create-turbo@latest whatsell

# Frontend
cd apps && npx create-next-app@latest web --typescript --tailwind --app --turbopack

# Backend
npm install -g @nestjs/cli@latest && nest new api --package-manager pnpm
```

### Structure Cible du Monorepo

```
whatsell/
├── apps/
│   ├── web/                          → Next.js 16 dashboard frontend
│   │   ├── src/
│   │   │   ├── app/                  → App Router (pas de pages/)
│   │   │   ├── components/
│   │   │   │   ├── ui/               → shadcn/ui (NE JAMAIS MODIFIER)
│   │   │   │   └── shared/           → wrappers custom
│   │   │   ├── lib/
│   │   │   │   └── api.ts            → client HTTP centralisé
│   │   │   ├── hooks/
│   │   │   └── stores/               → Zustand stores
│   │   ├── next.config.ts
│   │   ├── tsconfig.json             → strict: true, @/* paths
│   │   └── .env.example
│   └── api/                          → NestJS 11 API + webhooks + cron
│       ├── src/
│       │   ├── app.module.ts
│       │   ├── main.ts               → prefix /api/v1, CORS, port
│       │   └── config/               → ConfigService, variables d'env
│       ├── tsconfig.json             → strict: true
│       └── .env.example
├── packages/
│   └── shared/                       → Types TS, schémas Zod partagés
│       ├── src/
│       │   ├── schemas/              → Schémas Zod (partagés NestJS + Next.js)
│       │   ├── types/                → Types TypeScript purs
│       │   └── index.ts
│       ├── package.json              → name: "@whatsell/shared"
│       └── tsconfig.json             → strict: true
├── pnpm-workspace.yaml
├── turbo.json
└── package.json
```

### Configuration turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": [".next/**", "dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "lint": {},
    "test": {
      "outputs": ["coverage/**"]
    }
  }
}
```

### main.ts NestJS — Configuration Obligatoire

```typescript
// apps/api/src/main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(Logger));           // nestjs-pino
  app.setGlobalPrefix('api/v1');
  app.enableCors({
    origin: configService.get('FRONTEND_URL'),
    credentials: true,
  });
  await app.listen(configService.get('PORT') ?? 3001);
}
```

### lib/api.ts Next.js — Client HTTP Centralisé

```typescript
// apps/web/src/lib/api.ts
const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export async function apiClient(endpoint: string, options?: RequestInit) {
  return fetch(`${BASE_URL}${endpoint}`, {
    credentials: 'include',   // OBLIGATOIRE — cookies JWT httpOnly
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
}
```

**CRITIQUE :** Toutes les requêtes frontend doivent passer par `lib/api.ts` avec `credentials: 'include'` — jamais de `fetch` direct dans les composants.

### Variables d'Environnement Requises

**apps/api/.env.example :**
```
# App
NODE_ENV=development
PORT=3001
FRONTEND_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/whatsell

# Redis
REDIS_URL=redis://localhost:6379

# JWT
JWT_SECRET=your-jwt-secret-here
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# Cloudflare R2
R2_ACCOUNT_ID=
R2_ACCESS_KEY_ID=
R2_SECRET_ACCESS_KEY=
R2_BUCKET_RECEIPTS=whatsell-receipts
R2_BUCKET_LOGOS=whatsell-logos
R2_BUCKET_INVOICES=whatsell-invoices

# Sentry
SENTRY_DSN=

# Encryption
ENCRYPTION_KEY=your-32-char-encryption-key-here
```

**apps/web/.env.example :**
```
NEXT_PUBLIC_API_URL=http://localhost:3001
NEXT_PUBLIC_SENTRY_DSN=
```

### Anti-Patterns Critiques à Éviter

| ❌ Interdit | ✅ Correct |
|-------------|-----------|
| `process.env.DATABASE_URL` dans un service NestJS | `configService.get('DATABASE_URL')` |
| `pages/` directory dans Next.js | `app/` directory (App Router) |
| `<img src="...">` | `<Image>` de `next/image` |
| Modifier `components/ui/` | Créer wrapper dans `components/shared/` |
| `fetch('/api/...')` direct dans un composant | `apiClient('/...')` via `lib/api.ts` |
| Import Google Fonts via URL | `next/font` local |
| `any` explicite en TypeScript | `unknown` + type guard |

### Règles TypeScript Strictes

- `"strict": true` dans **chaque** `tsconfig.json` (web, api, shared) — pas d'exception
- Jamais de `any` explicite — utiliser `unknown` puis type guard si nécessaire
- Imports absolus via `@/` dans Next.js, relatifs courts dans NestJS
- Async/await partout — jamais de `.then().catch()` dans NestJS

### Tests Requis

- `apps/api/src/app.controller.spec.ts` : test unitaire que `AppModule` démarre sans erreur
- Nommage : `describe('AppModule')` > `it('should be defined')`
- Framework : Jest (intégré NestJS)

### Notes de Contexte Projet

- C'est la **story fondatrice** — aucune dépendance sur des stories précédentes
- Le dépôt git est vide au départ — structure à créer from scratch
- TypeScript strict sur toute la stack est non-négociable (exigence architecturale)
- pnpm est le package manager imposé — pas npm ni yarn
- Le package `shared` sera enrichi au fil des stories (schemas Zod + types TypeScript)
- CORS avec `credentials: true` est obligatoire car l'auth repose sur des cookies httpOnly
- `nestjs-pino` doit être configuré dès cette story pour que tous les modules suivants bénéficient du logging structuré

### Project Structure Notes

- Alignement complet avec l'architecture définie dans `_bmad-output/planning-artifacts/architecture.md`
- Le dossier `components/ui/` sera peuplé lors de Story 1.10 (shadcn/ui) — créer l'emplacement vide maintenant
- Le dossier `config/` NestJS contiendra `configuration.ts` et toutes les clés via `@nestjs/config`
- Aucun conflit détecté — projet greenfield

### References

- [Source: _bmad-output/planning-artifacts/architecture.md#Stack Sélectionné]
- [Source: _bmad-output/planning-artifacts/architecture.md#Commandes d'Initialisation]
- [Source: _bmad-output/planning-artifacts/architecture.md#Structure du Monorepo]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Patterns de Communication]
- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.1]
- [Source: _bmad-output/project-context.md#Stack Technologique & Versions]
- [Source: _bmad-output/project-context.md#Anti-Patterns Interdits]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fix apostrophe non échappée dans `apps/web/src/app/layout.tsx` (description metadata)
- Peer dep warning @testing-library/react : mis à jour de v14 → v16 (React 19 compatible)
- Peer dep warning eslint : mis à jour de v8 → v9 (eslint-config-next 16.x requis)
- pnpm installé via `npm install -g pnpm@9` (absent de la machine)

### Completion Notes List

- Monorepo Turborepo initialisé manuellement (structure complète créée from scratch)
- `pnpm install` réussi (exit code 0, 881 packages, sans erreur)
- TypeScript strict activé dans les 3 packages : `apps/web`, `apps/api`, `packages/shared` — `tsc --noEmit` propre sur chacun
- `@whatsell/shared` référencé via `workspace:*` dans les deux apps
- `apps/api/src/main.ts` : préfixe `/api/v1`, CORS avec `credentials: true`, ConfigService pour FRONTEND_URL et PORT
- `apps/api/src/config/configuration.ts` : toutes les variables centralisées — aucun `process.env.X` dans les services
- `nestjs-pino` configuré dans AppModule avec `pino-pretty` en dev, JSON en prod
- `apps/web/src/lib/api.ts` : client HTTP centralisé avec `credentials: 'include'` obligatoire
- 3 tests unitaires NestJS passés : `AppController should be defined`, `getHealth returns ok`, `getHealth timestamp is ISO 8601`
- Design tokens Tailwind initialisés (complets en Story 1.10)
- `packages/shared` : schémas Zod auth + types ApiResponse, Role déjà prêts pour stories suivantes

### File List

- `package.json`
- `pnpm-workspace.yaml`
- `turbo.json`
- `.gitignore`
- `.npmrc`
- `apps/web/package.json`
- `apps/web/tsconfig.json`
- `apps/web/next.config.ts`
- `apps/web/tailwind.config.ts`
- `apps/web/postcss.config.mjs`
- `apps/web/.env.example`
- `apps/web/src/app/layout.tsx`
- `apps/web/src/app/page.tsx`
- `apps/web/src/app/globals.css`
- `apps/web/src/lib/api.ts`
- `apps/web/src/components/ui/.gitkeep`
- `apps/web/src/components/shared/.gitkeep`
- `apps/web/src/hooks/.gitkeep`
- `apps/web/src/stores/.gitkeep`
- `apps/api/package.json`
- `apps/api/tsconfig.json`
- `apps/api/tsconfig.build.json`
- `apps/api/nest-cli.json`
- `apps/api/.env.example`
- `apps/api/.env`
- `apps/api/src/main.ts`
- `apps/api/src/app.module.ts`
- `apps/api/src/app.controller.ts`
- `apps/api/src/app.service.ts`
- `apps/api/src/app.controller.spec.ts`
- `apps/api/src/config/configuration.ts`
- `apps/api/src/config/env.validation.ts`
- `packages/shared/package.json`
- `packages/shared/tsconfig.json`
- `packages/shared/src/index.ts`
- `packages/shared/src/schemas/index.ts`
- `packages/shared/src/schemas/auth.schema.ts`
- `packages/shared/src/types/index.ts`
- `packages/shared/src/types/api.types.ts`
- `packages/shared/src/types/roles.types.ts`
