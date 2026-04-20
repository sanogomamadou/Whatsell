# Story 1.9 : CI/CD GitHub Actions

Status: done

## Story

En tant que **développeur**,
je veux un pipeline CI/CD automatisé via GitHub Actions,
afin que chaque PR soit validée (lint + typecheck + tests + build) et que chaque merge sur `main` déclenche un déploiement automatique sur Vercel (frontend) et Railway (backend) sans intervention manuelle.

## Acceptance Criteria

1. **Étant donné** qu'une Pull Request est ouverte ou mise à jour, **Quand** le workflow `ci.yml` s'exécute, **Alors** les étapes suivantes passent toutes sans erreur : lint ESLint (toute la stack), typecheck TypeScript (toute la stack), tests unitaires NestJS, build Next.js + NestJS

2. **Étant donné** qu'un merge est effectué sur `main`, **Quand** le workflow `deploy.yml` s'exécute, **Alors** le backend NestJS est déployé sur Railway via webhook et le frontend Next.js est déployé sur Vercel (via l'intégration GitHub automatique Vercel)

3. **Et** les variables d'environnement sont injectées depuis Railway Secrets (backend) et Vercel Env Vars (frontend) — jamais hardcodées dans les workflows

4. **Et** le cache pnpm et le cache Turborepo sont configurés dans le CI pour accélérer les runs consécutifs

5. **Et** le script `typecheck` est ajouté dans `turbo.json` et dans les `package.json` de `apps/api`, `apps/web` et `packages/shared`

## Tasks / Subtasks

- [x] Tâche 1 : Ajouter le script `typecheck` partout (AC: 1, 5)
  - [x] Modifier `turbo.json` — ajouter la task `typecheck` avec `"dependsOn": ["^build"]`
  - [x] Modifier `apps/api/package.json` — ajouter `"typecheck": "tsc --noEmit"`
  - [x] Modifier `apps/web/package.json` — ajouter `"typecheck": "tsc --noEmit"`
  - [x] Modifier `packages/shared/package.json` — ajouter `"typecheck": "tsc --noEmit"`
  - [x] Vérifier que `pnpm typecheck` (à la racine via turbo) passe sans erreur en local

- [x] Tâche 2 : Créer le workflow CI `.github/workflows/ci.yml` (AC: 1, 4)
  - [x] Créer le répertoire `.github/workflows/`
  - [x] Créer `.github/workflows/ci.yml` avec :
    - Trigger : `pull_request` (toutes branches) + `push` (branches non-`main`)
    - Job `ci` : checkout → setup pnpm@9 → setup Node 20 avec cache pnpm → `pnpm install --frozen-lockfile` → `pnpm lint` → `pnpm typecheck` → `pnpm test` → `pnpm build`
    - Cache Turborepo via `.turbo/cache` avec clé basée sur `os + lockfile hash`
  - [x] Vérifier que tous les scripts (`lint`, `typecheck`, `test`, `build`) passent localement avec `pnpm run <script>` à la racine

- [x] Tâche 3 : Créer le workflow Deploy `.github/workflows/deploy.yml` (AC: 2, 3)
  - [x] Créer `.github/workflows/deploy.yml` avec :
    - Trigger : `push` sur `main` uniquement
    - Dépendance : `needs: [ci]` (réutiliser le job CI ou le caller via workflow_call)
    - Job `deploy-backend` : curl du webhook Railway (secret `RAILWAY_WEBHOOK_URL`)
    - Vercel déploie automatiquement via l'intégration GitHub (aucun step supplémentaire requis)
  - [x] Documenter dans les Dev Notes les secrets GitHub Actions à configurer dans le repo

- [x] Tâche 4 : Validation locale end-to-end (AC: 1)
  - [x] Exécuter `pnpm run lint` à la racine — ✅ 3/3 packages
  - [x] Exécuter `pnpm run typecheck` à la racine — ✅ 4/4 packages
  - [x] Exécuter `pnpm run test` à la racine — ✅ 123/123 tests NestJS passants, web `--passWithNoTests` OK
  - [x] Exécuter `pnpm run build` à la racine — ✅ 3/3 packages
  - [x] Confirmer que la suite complète simule ce que le CI fera

## Dev Notes

### ⚠️ Ce qui EXISTE DÉJÀ — NE PAS RECRÉER

| Fichier | Contenu existant | Action |
|---------|-----------------|--------|
| `turbo.json` | Tasks `build`, `dev`, `lint`, `test` configurées | MODIFIER — ajouter `typecheck` |
| `package.json` (racine) | Scripts `dev`, `build`, `lint`, `test` via `turbo run` | MODIFIER — ajouter `"typecheck": "turbo run typecheck"` |
| `apps/api/package.json` | Scripts `lint`, `test`, `build` | MODIFIER — ajouter `typecheck` |
| `apps/web/package.json` | Scripts `lint`, `test`, `build` | MODIFIER — ajouter `typecheck` |
| `packages/shared/package.json` | Scripts existants | MODIFIER — ajouter `typecheck` |

### ⚠️ `.github/workflows/` N'EXISTE PAS — À créer

Vérification : aucun dossier `.github/workflows/` dans le repo. Les deux fichiers YAML sont à créer de zéro.

### Contenu exact `.github/workflows/ci.yml`

```yaml
name: CI

on:
  pull_request:
  push:
    branches-ignore:
      - main

jobs:
  ci:
    name: Lint · Typecheck · Test · Build
    runs-on: ubuntu-latest

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup pnpm
        uses: pnpm/action-setup@v3
        with:
          version: 9

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm

      - name: Cache Turborepo
        uses: actions/cache@v4
        with:
          path: .turbo
          key: ${{ runner.os }}-turbo-${{ hashFiles('pnpm-lock.yaml') }}
          restore-keys: |
            ${{ runner.os }}-turbo-

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm run lint

      - name: Typecheck
        run: pnpm run typecheck

      - name: Test
        run: pnpm run test

      - name: Build
        run: pnpm run build
```

### Contenu exact `.github/workflows/deploy.yml`

```yaml
name: Deploy

on:
  push:
    branches:
      - main

jobs:
  deploy-backend:
    name: Deploy backend → Railway
    runs-on: ubuntu-latest

    steps:
      - name: Trigger Railway deploy
        run: |
          curl -s -X POST "${{ secrets.RAILWAY_WEBHOOK_URL }}"
```

**Note Vercel :** Le frontend se déploie automatiquement via l'intégration GitHub Vercel (aucun step CLI requis). Le `deploy.yml` se charge uniquement du backend Railway.

### Secrets GitHub Actions à configurer

Aller dans **GitHub repo → Settings → Secrets and variables → Actions** et ajouter :

| Secret | Description | Où obtenir |
|--------|-------------|------------|
| `RAILWAY_WEBHOOK_URL` | URL de déploiement Railway pour le service `api` | Railway Dashboard → Service → Settings → Deploy → Deploy Webhook |

**Note Vercel :** L'intégration Vercel/GitHub se configure dans le dashboard Vercel (Import Git Repository). Une fois connectée, chaque push sur `main` déclenche un deploy prod, chaque PR crée un deploy preview — aucun secret requis dans GitHub Actions.

### Script `typecheck` — Modifications exactes

**`turbo.json`** — ajouter dans `tasks` :
```json
"typecheck": {
  "dependsOn": ["^build"]
}
```

**`package.json` racine** — ajouter dans `scripts` :
```json
"typecheck": "turbo run typecheck"
```

**`apps/api/package.json`** — ajouter dans `scripts` :
```json
"typecheck": "tsc --noEmit"
```

**`apps/web/package.json`** — ajouter dans `scripts` :
```json
"typecheck": "tsc --noEmit"
```

**`packages/shared/package.json`** — ajouter dans `scripts` :
```json
"typecheck": "tsc --noEmit"
```

### Comportement CI — Turborepo cache

- `.turbo/cache` mis en cache avec la clé `os + hash(pnpm-lock.yaml)`
- Turborepo ne re-exécute que les tâches dont les inputs ont changé
- Si seul `apps/api` est modifié → lint/test/build de `apps/web` skippés (cache hit)

### Versions des GitHub Actions

Utiliser exclusivement les versions `v4` (stables en avril 2026) :
- `actions/checkout@v4`
- `pnpm/action-setup@v3`
- `actions/setup-node@v4`
- `actions/cache@v4`

### Particularités du stack

- **pnpm `--frozen-lockfile`** : obligatoire en CI — empêche toute mise à jour accidentelle de `pnpm-lock.yaml`
- **`apps/web` test** : le script est `jest --passWithNoTests` — pas de tests web en Story 1.9, le flag évite l'échec CI
- **`apps/api` test** : 123 tests passants (suite complète story 1.1 à 1.8)
- **Build NestJS** : `nest build` compile TypeScript → `dist/`. L'étape `typecheck` (`tsc --noEmit`) précède le build pour un feedback rapide sur les erreurs de type avant compilation complète
- **Node version** : `engines.node >= 20` dans `package.json` racine — utiliser `node-version: 20` dans le CI (LTS stable)

### Anti-Patterns Interdits

- ❌ Hardcoder des tokens ou URLs dans les fichiers YAML → `${{ secrets.XXX }}` obligatoire
- ❌ `pnpm install` sans `--frozen-lockfile` en CI → risque de mise à jour silencieuse du lockfile
- ❌ `actions/checkout@v3` ou versions antérieures → toujours `@v4`
- ❌ Lancer `prisma migrate` dans le CI sans base de données → les tests unitaires NestJS mockent Prisma, aucune DB requise pour le CI
- ❌ Ajouter des secrets en clair dans les workflows → toujours via `secrets.*` du repo GitHub

### Structure de Fichiers Finale

```
whatsell/
├── .github/
│   └── workflows/
│       ├── ci.yml          ← CRÉER (lint + typecheck + test + build)
│       └── deploy.yml      ← CRÉER (Railway webhook sur push main)
├── turbo.json              ← MODIFIER (ajouter task typecheck)
├── package.json            ← MODIFIER (ajouter script typecheck)
├── apps/
│   ├── api/
│   │   └── package.json    ← MODIFIER (ajouter script typecheck)
│   └── web/
│       └── package.json    ← MODIFIER (ajouter script typecheck)
└── packages/
    └── shared/
        └── package.json    ← MODIFIER (ajouter script typecheck)
```

### Références

- Architecture : `_bmad-output/planning-artifacts/architecture.md` — section "CI/CD — GitHub Actions"
- Architecture : `_bmad-output/planning-artifacts/architecture.md` — section "Infrastructure & Déploiement"
- Epics : `_bmad-output/planning-artifacts/epics.md` — Story 1.9
- Story précédente : `_bmad-output/implementation-artifacts/1-8-stockage-cloudflare-r2.md` — File List (état du repo à la clôture de 1.8)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Erreur TS2322 `app.module.ts:40` — `customProps` pino-http typé `Record<string, unknown>` incompatible avec `IncomingMessage`. Fix : inférence du paramètre + cast `as unknown as Record<string, unknown>` pour accéder à `tenantId` et `id`.
- ESLint non installé dans `apps/api` (absent des devDependencies). Installé `eslint@^9`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser` + créé `eslint.config.mjs` flat config (ESLint 9 n'utilise plus `.eslintrc.js`).
- `next lint` dans Next.js 16 n'accepte plus le subcommand `lint` sans répertoire explicite. Remplacé par `eslint "src/**/*.{ts,tsx}"` direct + `eslint.config.mjs` pour `apps/web`.
- 2 unused vars corrigées : `ExecutionContext` dans `events.controller.spec.ts`, `configuration` dans `tenant-isolation.spec.ts`.

### Completion Notes List

- `turbo.json` — task `typecheck` ajoutée avec `dependsOn: ["^build"]`
- Scripts `typecheck: "tsc --noEmit"` ajoutés dans `apps/api`, `apps/web`, `packages/shared`
- Script `typecheck: "turbo run typecheck"` ajouté dans `package.json` racine
- ESLint 9 installé dans `apps/api` et `apps/web` — flat config `eslint.config.mjs` créé pour chacun
- `apps/api` lint script mis à jour : `eslint "src/**/*.ts" "test/**/*.ts"` (suppression des dossiers `apps/`, `libs/` inexistants)
- `apps/web` lint script mis à jour : `eslint "src/**/*.{ts,tsx}"` (remplacement de `next lint` incompatible Next.js 16)
- `.github/workflows/ci.yml` créé : trigger PR + push non-main, job lint → typecheck → test → build avec cache pnpm + turbo
- `.github/workflows/deploy.yml` créé : trigger push main, curl Railway webhook via secret `RAILWAY_WEBHOOK_URL`
- Validation end-to-end locale : lint ✅ test 123/123 ✅ typecheck ✅ build ✅
- Secret GitHub Actions requis : `RAILWAY_WEBHOOK_URL` — configurer dans repo Settings → Secrets → Actions

### File List

- `.github/workflows/ci.yml` (créé)
- `.github/workflows/deploy.yml` (créé)
- `turbo.json` (modifié — ajout task typecheck)
- `package.json` (modifié — ajout script typecheck)
- `apps/api/package.json` (modifié — ajout scripts typecheck + lint corrigé + ESLint installé)
- `apps/api/eslint.config.mjs` (créé)
- `apps/api/src/app.module.ts` (modifié — fix type TS2322 customProps pino-http)
- `apps/api/src/modules/events/events.controller.spec.ts` (modifié — suppression import inutilisé ExecutionContext)
- `apps/api/test/integration/tenant-isolation.spec.ts` (modifié — suppression import inutilisé configuration)
- `apps/web/package.json` (modifié — ajout scripts typecheck + lint remplacé + ESLint installé)
- `apps/web/eslint.config.mjs` (créé)
- `packages/shared/package.json` (modifié — ajout script typecheck)
- `pnpm-lock.yaml` (modifié — dépendances ESLint ajoutées)

### Review Findings

- [x] [Review][Decision] D-01 — `deploy.yml` déclenche le deploy en parallèle du CI — **Décision : B) Branch protection** — configurer dans GitHub Settings → Branches → Require status checks before merging. Aucun changement de code requis.
- [x] [Review][Decision] D-02 — `@typescript-eslint/no-explicit-any` à `warn` — **Décision : A) passer à `error`** — appliqué via patch P-07
- [x] [Review][Patch] P-01 — `deploy.yml` curl sans `--fail` et secret interpolé dans `run:` directement — fixé : `env: RAILWAY_WEBHOOK_URL` + `curl --fail` [`.github/workflows/deploy.yml`]
- [x] [Review][Patch] P-02 — Règle `@typescript-eslint/no-explicit-any` dupliquée deux fois dans `apps/web/eslint.config.mjs` — fixé : dédoublonnée [`apps/web/eslint.config.mjs`]
- [x] [Review][Patch] P-03 — `requestId: r['id']` — fixé : `r['id'] != null ? String(r['id']) : undefined` pour gérer tous les types ReqId [`apps/api/src/app.module.ts`]
- [x] [Review][Patch] P-04 — `apps/web/tsconfig.json` n'exclut pas `.next/**` — fixé : `.next/**` ajouté dans `exclude` [`apps/web/tsconfig.json`]
- [x] [Review][Patch] P-05 — Version pnpm incohérente CI `version: 9` vs `packageManager: "pnpm@9.0.0"` — fixé : `version: 9.0.0` [`.github/workflows/ci.yml`]
- [x] [Review][Patch] P-06 — `apps/web/eslint.config.mjs` ne charge pas les règles Next.js — fixé : `@next/eslint-plugin-next` installé + règles `recommended` + `core-web-vitals` ajoutées [`apps/web/eslint.config.mjs`]
- [x] [Review][Defer] DEF-01 — Double cast `as unknown as Record<string, unknown>` dans `app.module.ts` — workaround pour typage pino-http, nécessite augmentation d'interface ou typage pino-http explicite — deferred, refactor post-MVP
- [x] [Review][Defer] DEF-02 — Turbo `lint` task sans `inputs` field — cache trop large, potentiel de faux-positifs — deferred, optimisation turbo.json post-MVP
- [x] [Review][Defer] DEF-03 — Cache CI turbo keyed sur `pnpm-lock.yaml` uniquement, pas les sources — stale cache possible si `packages/shared/src` change sans toucher le lockfile — deferred, passer à Turbo remote cache
- [x] [Review][Defer] DEF-04 — Pas de `timeout-minutes` sur les jobs CI/Deploy — timeout GitHub par défaut 6h — deferred, ajouter lors d'une revue CI future
- [x] [Review][Defer] DEF-05 — `packages/shared` n'a pas de config ESLint — `turbo run lint` exécute `tsc --noEmit` pour shared, pas ESLint — deferred, story design system ou refactor monorepo
- [x] [Review][Defer] DEF-06 — `deploy.yml` sans step `actions/checkout@v4` — sans conséquence pour un `curl` pur mais fragile pour toute extension future — deferred, à ajouter si le job s'enrichit
- `pnpm-lock.yaml` (modifié — dépendances ESLint ajoutées)
