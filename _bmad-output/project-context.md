---
project_name: 'Whatsell'
user_name: 'Mamadou'
date: '2026-04-12'
sections_completed: ['technology_stack', 'language_rules', 'framework_rules', 'testing_rules', 'code_quality', 'workflow_rules', 'anti_patterns']
status: 'complete'
rule_count: 42
optimized_for_llm: true
---

# Project Context for AI Agents — Whatsell

_Ce fichier contient les règles critiques que les agents IA doivent suivre lors de l'implémentation du code. Focalisé sur les détails non-évidents que les agents pourraient manquer._

---

## Stack Technologique & Versions

```
Monorepo    : Turborepo (pnpm workspaces)
Frontend    : Next.js 16.2.3 — App Router, Turbopack
Backend     : NestJS 11.x
Langage     : TypeScript strict (toute la stack)
ORM         : Prisma (latest) — PostgreSQL
Queue       : BullMQ + Redis (Railway)
Stockage    : Cloudflare R2 (SDK @aws-sdk/client-s3)
UI          : shadcn/ui + Tailwind CSS + Radix UI
State       : TanStack Query v5 (serveur) + Zustand (UI)
Formulaires : React Hook Form + Zod (schémas partagés)
PDF         : @react-pdf/renderer (côté serveur NestJS)
Auth        : Passport.js + JWT (httpOnly cookies)
Deploy FE   : Vercel
Deploy BE   : Railway (PostgreSQL + Redis inclus)
```

---

## Règles Critiques d'Implémentation

### TypeScript & Langage

- TypeScript strict activé partout — jamais de `any` explicite, utiliser `unknown` puis type guard
- Imports absolus via `@/` côté Next.js, chemins relatifs courts côté NestJS
- Async/await partout — jamais de `.then().catch()` sauf dans les BullMQ processors
- Toutes les dates stockées et transmises en **UTC ISO 8601** — conversion timezone uniquement dans les composants d'affichage
- Les montants FCFA sont des **entiers** (pas de décimales) — jamais de float pour les prix

### NestJS — Règles Critiques

- Chaque module suit la structure `{domain}.module / .controller / .service / .repository / dto/` — ne jamais dévier
- **Tout accès Prisma se fait dans `{domain}.repository.ts` uniquement** — jamais dans Service ni Controller
- `tenantId` lu depuis `AsyncLocalStorage` via `@CurrentTenant()` — **jamais passé en paramètre de méthode**
- Erreurs métier : `throw new HttpException(msg, HttpStatus.X)` ou sous-classes (`NotFoundException`, etc.) — jamais `throw new Error()`
- Variables d'environnement : toutes dans `src/config/` via `@nestjs/config` — jamais `process.env.X` directement dans un service
- Toutes les réponses enveloppées via `ResponseWrapperInterceptor` global : `{ data: ... }` ou `{ data: [...], meta: { total, page, limit } }`
- CORS **obligatoire** : `app.enableCors({ origin: process.env.FRONTEND_URL, credentials: true })` dans `main.ts`

### Next.js — Règles Critiques

- App Router uniquement — jamais de `pages/` directory
- Composants serveur par défaut — ajouter `'use client'` uniquement quand hooks React requis
- `components/ui/` (shadcn) **ne jamais modifier** — créer wrappers dans `components/shared/`
- Client HTTP centralisé : toutes les requêtes via `lib/api.ts` avec `credentials: 'include'` — jamais de `fetch` direct dans les composants
- `next/image` obligatoire pour toutes les images — jamais de `<img>` HTML natif
- Fonts locales via `next/font` — jamais d'import Google Fonts externe

### Multi-Tenancy — Règle Fondamentale

- **Toute donnée vendeur a un `tenant_id`** — orders, products, customers, stock, conversations, invoices
- Le `TenantMiddleware` injecte le `tenantId` dans `AsyncLocalStorage` au début de chaque requête
- Les routes `/api/v1/admin/*` bypassent le filtre tenant (rôle `ADMIN` requis)
- Jamais de requête Prisma sans clause `where: { tenantId }` sur les données vendeur — le Repository l'ajoute automatiquement depuis `AsyncLocalStorage`

### Gestion d'État Frontend

- **Données serveur → TanStack Query uniquement** — jamais `useState` + fetch manuel
- **État UI local → Zustand** (`ui.store.ts`) : modales, sidebar, conversation active
- **Formulaires → React Hook Form** avec résolveur Zod
- Pattern de chargement obligatoire : `isLoading` → `<XxxSkeleton />` (skeleton spécifique au composant), `error` → `<ErrorMessage />`, sinon données
- Mutations nommées `useCreate{Entity}`, `useUpdate{Entity}{Field}`, `useDelete{Entity}`

### Schémas Zod Partagés

- **Tous les schémas Zod définis dans `packages/shared/schemas/`** — réutilisés dans NestJS DTOs ET React Hook Form resolvers
- Les DTOs NestJS utilisent `ZodValidationPipe` global — pas de `class-validator` decorators
- Types TypeScript purs (sans Zod) dans `packages/shared/types/`

### Queues BullMQ

- Queues nommées : `whatsapp-messages`, `stock-alerts`, `advisor-alerts`, `trial-expiry`, `whatsapp-health-check`
- Chaque queue a son processor dédié : `{domain}.processor.ts`
- Toujours gérer les erreurs dans les processors avec retry limité (max 3 tentatives) et dead-letter logging
- Le webhook Twilio (`POST /webhooks/whatsapp`) **ne fait que valider + enqueuer** — zéro traitement synchrone

### Sécurité

- JWT : access token httpOnly cookie 15min, refresh token httpOnly cookie 7j avec rotation
- `@Roles(Role.OWNER)` sur tous les endpoints de modification sensible
- Photos de reçus Mobile Money : upload vers R2 avec clé `{tenantId}/receipts/{uuid}`, accès via presigned URL temporaire uniquement
- Actions sensibles (règles paiement, export, gestion collaborateurs) : décorateur `@AuditLog()` obligatoire
- Tokens WhatsApp Business et clés API tiers : chiffrés AES-256-GCM avant stockage en base

### Conventions de Nommage

| Contexte | Convention | Exemple |
|----------|-----------|---------|
| Tables PostgreSQL | `snake_case` pluriel | `orders`, `stock_levels` |
| Colonnes | `snake_case` | `tenant_id`, `created_at` |
| Modèles Prisma | `PascalCase` singulier | `Order`, `StockLevel` |
| DTOs | `PascalCase` + suffixe | `CreateOrderDto` |
| Variables TS | `camelCase` | `tenantId`, `orderId` |
| Fichiers NestJS | `kebab-case` | `order.service.ts` |
| Fichiers React | `PascalCase.tsx` / `camelCase.ts` | `OrderCard.tsx`, `useOrders.ts` |
| Endpoints REST | `kebab-case` pluriel | `/api/v1/stock-levels` |
| Événements SSE | `domain.action` | `order.created`, `stock.alert` |
| Clés BullMQ | `domain:action` | `whatsapp:message_received` |
| Clés cache Redis | `cache:{tenantId}:{resource}` | `cache:abc123:products` |
| Clés R2 | `{tenantId}/{type}/{uuid}` | `abc123/receipts/xyz.jpg` |

### Tests

- Tests unitaires co-localisés avec le service : `{domain}.service.spec.ts`
- Tests d'intégration dans `test/integration/` — utilisent une vraie BDD PostgreSQL (pas de mock Prisma)
- Nommer les tests : `describe('OrdersService')` > `it('should create order with correct tenant isolation')`
- Tester l'isolation multi-tenant en priorité — chaque repository doit avoir un test vérifiant qu'il ne retourne jamais de données cross-tenant

### Format Réponse API

```typescript
// Succès liste
{ data: T[], meta: { total: number, page: number, limit: number } }
// Succès objet
{ data: T }
// Erreur
{ statusCode: number, error: string, message: string, timestamp: string, path: string }
```

### Anti-Patterns Interdits

- ❌ `process.env.X` dans un service → utiliser `ConfigService`
- ❌ `throw new Error()` → utiliser `HttpException` et sous-classes
- ❌ `tenantId` en paramètre de méthode → `@CurrentTenant()` décorateur
- ❌ Prisma dans Controller ou Service → Repository uniquement
- ❌ `useState` pour données serveur → TanStack Query
- ❌ `<img>` HTML natif → `next/image`
- ❌ Modifier `components/ui/` → créer wrapper dans `components/shared/`
- ❌ Fetch sans `credentials: 'include'` → toujours via `lib/api.ts`
- ❌ Réponse API sans enveloppe `{ data }` → `ResponseWrapperInterceptor` global
- ❌ Dates avec timezone locale stockées en base → UTC ISO 8601 obligatoire
- ❌ Float pour les montants FCFA → entiers uniquement

---

## Instructions d'Utilisation

**Pour les agents IA :**

- Lire ce fichier avant d'implémenter tout code
- Suivre TOUTES les règles telles que documentées
- En cas de doute, privilégier l'option la plus restrictive
- Mettre à jour ce fichier si de nouveaux patterns émergent

**Pour les humains :**

- Garder ce fichier lean et focalisé sur les besoins des agents
- Mettre à jour lors d'un changement de stack technologique
- Revoir trimestriellement pour supprimer les règles devenues évidentes

_Dernière mise à jour : 2026-04-12_
