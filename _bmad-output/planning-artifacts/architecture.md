---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8]
lastStep: 8
status: 'complete'
completedAt: '2026-04-11'
inputDocuments:
  - "_bmad-output/planning-artifacts/product-brief-Whatsell.md"
  - "_bmad-output/planning-artifacts/prd.md"
  - "_bmad-output/planning-artifacts/ux-design-specification.md"
workflowType: 'architecture'
project_name: 'Whatsell'
user_name: 'Mamadou'
date: '2026-04-11'
---

# Architecture Decision Document — Whatsell

_Ce document se construit collaborativement à travers un processus de découverte étape par étape. Les sections sont ajoutées au fil des décisions architecturales prises ensemble._

## Analyse du Contexte Projet

### Vue d'ensemble des exigences

**Exigences Fonctionnelles — 51 FR réparties en 9 modules :**

| Module | FRs | Implications architecturales |
|--------|-----|------------------------------|
| Compte & Onboarding | FR1–FR5 | Auth multi-step, wizard 5 étapes, connexion OAuth-like Meta Business Manager |
| Agent WhatsApp IA | FR6–FR16 | Webhook entrant, LLM API, state machine conversation, transfert bidirectionnel IA ↔ vendeur |
| Gestion commandes | FR17–FR21 | Pipeline de statuts, génération PDF, RBAC par rôle |
| Catalogue & Stocks | FR22–FR27 | Variantes libres (schéma flexible), alertes seuil, mises à jour temps réel |
| CRM | FR28–FR30 | Segmentation automatique (event-driven ou cron) |
| Analytics | FR31–FR35 | Agrégations périodiques, export PDF |
| Agent Conseiller IA | FR36–FR39 | Chat LLM sur données vendeur + cron d'alertes proactives |
| Abonnements & Collaborateurs | FR40–FR47 | Compteur de commandes par tier, trial 7 jours, notifications de limite, RBAC collaborateurs |
| Panel Admin | FR48–FR51 | Vue cross-tenant en lecture seule, métriques globales plateforme |

**Exigences Non-Fonctionnelles — 20 NFR structurant l'architecture :**

- **Performance** : ≤3s chargement dashboard sur 3G (NFR2), ≤3 min réponse agent IA (NFR1), ≤30s notification temps réel (NFR3), ≤5s génération PDF (NFR4)
- **Sécurité** : TLS 1.2+ en transit (NFR5), chiffrement au repos données sensibles (NFR6), JWT 15min/7j (NFR7), isolation multi-tenant stricte (NFR8), audit log actions sensibles (NFR9), accès privé photos reçus (NFR10)
- **Fiabilité** : 99% uptime agent sur plage 06h–23h heure locale (NFR11), fallback message d'attente sur indisponibilité IA (NFR12), backup quotidien 30j rétention (NFR13), détection déconnexion token WhatsApp en ≤5 min (NFR14)
- **Scalabilité** : 50→500 vendeurs sans dégradation (NFR15), queue async pour 1 000 messages simultanés (NFR16), architecture extensible nouveaux marchés/langues (NFR17)
- **Intégration** : fallback LLM sur timeout 3 min (NFR18), queue WhatsApp sur indisponibilité Twilio (NFR19), journalisation complète erreurs intégration (NFR20)

### Évaluation de la Complexité

| Dimension | Niveau |
|-----------|--------|
| Complexité globale | **Élevée** |
| Domaine primaire | Full-stack SaaS + IA conversationnelle + Plateforme d'intégration |
| Temps réel | Oui — webhooks WhatsApp entrants + notifications vendeur push |
| Multi-tenancy | Oui — isolation stricte par compte (données, conversations, fichiers) |
| Queue asynchrone | Requise — absorption des pics webhook (1 000 msg simultanés) |
| Dépendances externes | 4 critiques : Twilio/WhatsApp BSP, LLM API, S3-compatible, Email transactionnel |
| RBAC | 3 rôles vendeur (Propriétaire, Co-gérant, Vendeur) + rôle Admin opérateur |
| Cible plateforme | Web mobile-first (360px, 3G) — pas d'app native en V1 |

### Contraintes Techniques et Dépendances

- **Hébergement** : Cloud international (AWS eu-west ou af-south-1) — aucune obligation de localisation données Mali/Burkina Faso en V1
- **WhatsApp** : intégration exclusive via BSP agréé Twilio — webhooks bidirectionnels, gestion fenêtre de conversation 24h
- **Mobile Money** : intégration indirecte en V1 (photo reçu uniquement) — aucune API Orange Money / Moov Money requise
- **LLM** : API externe (OpenAI ou équivalent) avec timeout 3 min max et fallback obligatoire
- **Réglementation** : pas de licence BCEAO requise en V1 (Whatsell ne manipule pas de fonds)
- **Langue** : français uniquement en V1

### Préoccupations Transversales Identifiées

1. **Isolation multi-tenant** — chaque requête BDD et appel API doit être scopé au tenant ; risque critique de fuite de données entre comptes si non traité dès le schéma
2. **Contrôle des coûts LLM** — compteur de commandes IA par tier, politique fair use Business, monitoring coût par compte nécessaire
3. **Traitement asynchrone des webhooks** — queue de messages entrants WhatsApp pour absorber les pics et garantir 0 perte de message
4. **Observabilité opérationnelle** — état des tokens WhatsApp par compte, timeouts LLM, erreurs d'intégration, métriques d'autonomie agent
5. **Performance mobile** — optimisation payload, lazy loading, compression images — cible 3G/360px impose des contraintes fortes sur le frontend
6. **Dualité synchrone/asynchrone** — le dashboard fonctionne en requêtes directes, l'agent travaille en arrière-plan via événements — deux paradigmes à orchestrer

## Évaluation du Template de Démarrage

### Domaine Technologique Primaire

Full-stack SaaS — application web mobile-first + API backend avec traitement asynchrone, basé sur les exigences du projet.

### Options Évaluées

| Option | Avantages | Inconvénients |
|--------|-----------|---------------|
| Turborepo monorepo (Next.js + NestJS) | Types partagés, DX optimal solo dev, Vercel natif, Railway backend | Setup initial légèrement plus complexe |
| Next.js full-stack (API Routes) | Un seul déploiement | Pas adapté aux queues/cron, perd la structure NestJS |
| Repos séparés (frontend + backend) | Isolation totale | Duplication des types, gestion plus lourde en solo |

### Stack Sélectionné : Turborepo Monorepo — Next.js 16 + NestJS 11

**Justification :**
- TypeScript strict sur toute la stack — cohérence et sécurité des types de bout en bout
- Types partagés via `packages/shared` — 0 désynchronisation entre frontend et backend
- Next.js 16 sur Vercel — déploiement frontend optimisé, App Router, Turbopack
- NestJS 11 sur Railway — processus persistants requis pour queue BullMQ, cron alertes, webhooks WhatsApp
- Vercel supporte nativement les monorepos Turborepo — CI/CD frontend automatique
- Railway provisionne PostgreSQL + Redis en 1 clic — stack complète sans ops complexe

### Commandes d'Initialisation

```bash
# Monorepo Turborepo
npx create-turbo@latest whatsell

# Frontend
cd apps && npx create-next-app@latest web --typescript --tailwind --app --turbopack

# Backend
npm install -g @nestjs/cli@latest && nest new api
```

### Structure du Monorepo

```
whatsell/
├── apps/
│   ├── web/          → Next.js 16 — dashboard frontend
│   └── api/          → NestJS 11 — API + webhooks + cron
└── packages/
    └── shared/       → Types TypeScript, DTOs, interfaces partagés
```

### Décisions Architecturales Établies par ce Stack

| Dimension | Décision |
|-----------|----------|
| Langage | TypeScript strict (toute la stack) |
| Frontend | Next.js 16, App Router, Tailwind CSS |
| Backend | NestJS 11, architecture modulaire par domaine |
| ORM | Prisma (PostgreSQL, migrations typées) |
| Queue | BullMQ + Redis (traitement async webhooks WhatsApp) |
| Auth | Passport.js + JWT (intégré NestJS) |
| Monorepo | Turborepo (build cache, scripts partagés) |
| Déploiement frontend | Vercel |
| Déploiement backend | Railway |
| Base de données | PostgreSQL sur Railway |
| Cache / Queue broker | Redis sur Railway |
| Docker | Non requis en V1 (Railway gère la conteneurisation) |

**Note :** L'initialisation du projet à partir de ces commandes constitue la première story d'implémentation.

## Décisions Architecturales Cœur

### Analyse des Priorités de Décision

**Décisions Critiques (bloquent l'implémentation) :**
- Isolation multi-tenant (row-level avec middleware NestJS)
- Stockage des tokens JWT (httpOnly cookies)
- Communication temps réel (SSE)

**Décisions Importantes (structurent l'architecture) :**
- Stockage fichiers (Cloudflare R2)
- Bibliothèque de composants UI (shadcn/ui)
- Gestion d'état frontend (TanStack Query + Zustand)
- Validation partagée (Zod sur les deux couches)
- Logging (Pino / nestjs-pino)

**Décisions Différées (Post-MVP) :**
- Reconnexion automatique token WhatsApp Business (V2)
- Validation automatique reçus Mobile Money via API opérateurs (V2)
- Application mobile native iOS/Android (V2)

---

### Architecture des Données

**Isolation Multi-Tenant — Row-Level avec Middleware**

- Stratégie : `tenant_id` sur toutes les tables de données vendeur (commandes, produits, clients, stocks, conversations)
- Implémentation : Middleware NestJS extrait le `tenantId` du JWT et l'injecte dans un `AsyncLocalStorage` global — toutes les couches (Service, Repository) y accèdent automatiquement sans le passer manuellement
- Rationale : simple, sûr, testable ; adapté à 50–500 vendeurs ; évite la complexité des schémas multiples
- Risque atténué : fuite de données cross-tenant si le middleware est bypassé — couvert par tests d'intégration systématiques

| Table | tenant_id requis |
|-------|-----------------|
| orders | ✅ |
| products | ✅ |
| customers | ✅ |
| stock_levels | ✅ |
| conversations | ✅ |
| invoices | ✅ |
| users (collaborateurs) | ✅ |
| subscriptions | ✅ |

**Stockage Fichiers — Cloudflare R2**

- Décision : Cloudflare R2 (compatible AWS S3)
- SDK : `@aws-sdk/client-s3` — aucun changement si migration vers S3 ultérieure
- Organisation des buckets : `whatsell-receipts/{tenant_id}/`, `whatsell-logos/{tenant_id}/`, `whatsell-invoices/{tenant_id}/`
- Accès : URLs signées temporaires (presigned URLs) — jamais d'accès public direct aux reçus
- Rationale : 0 frais de sortie réseau, free tier généreux (10 GB), isolation par préfixe tenant

**Stratégie de Cache — Redis (instance partagée BullMQ)**

- Outil : `cache-manager` NestJS + adaptateur Redis
- Cas d'usage : résultats analytics coûteux (TTL 5 min), catalogue produits (TTL 1 min), sessions utilisateur
- Pas de cache cross-tenant : clés préfixées `cache:{tenantId}:{resource}`

**Migrations — Prisma Migrate**

- Migrations versionnées dans `apps/api/prisma/migrations/`
- Exécution automatique au démarrage du conteneur Railway (production)
- Review manuelle obligatoire avant tout `migrate deploy` en production

---

### Authentification & Sécurité

**Tokens JWT — httpOnly Cookies**

- Access token : httpOnly cookie, SameSite=Strict, Secure, expiration 15 min
- Refresh token : httpOnly cookie séparé, expiration 7 jours, rotation à chaque usage
- Rationale : protection contre XSS (inaccessible depuis JavaScript), obligatoire pour données financières vendeurs

**RBAC — Guards & Decorators NestJS**

- Décorateur `@Roles(Role.OWNER, Role.CO_MANAGER)` sur les endpoints sensibles
- `RolesGuard` global vérifie le rôle extrait du JWT
- Rôles : `OWNER`, `CO_MANAGER`, `SELLER` (vendeur collaborateur), `ADMIN` (opérateur plateforme)
- Pas de lib externe — Guards NestJS natifs suffisants pour ce modèle

**Isolation Tenant dans les Requêtes**

- `TenantMiddleware` appliqué à toutes les routes `/api/v1/*`
- Injecte `tenantId` dans `AsyncLocalStorage` au début de chaque requête
- `PrismaService` lit automatiquement le `tenantId` depuis le contexte pour filtrer toutes les requêtes
- Les routes Admin (`/api/v1/admin/*`) exigent le rôle `ADMIN` et bypassent le filtre tenant (accès cross-tenant en lecture)

**Chiffrement au Repos**

- Données sensibles (tokens WhatsApp Business, clés API) : chiffrées via `crypto` Node.js (AES-256-GCM) avant stockage BDD
- Photos de reçus : stockées dans R2 avec accès privé + URLs signées à durée limitée

---

### API & Patterns de Communication

**Style API — REST avec versioning**

- Préfixe global : `/api/v1/`
- Documentation : Swagger auto-généré via `@nestjs/swagger` (décorateurs sur les DTOs et controllers)
- Versioning : header `Accept-Version` pour futures évolutions — pas de duplication de routes en V1

**Notifications Temps Réel — Server-Sent Events (SSE)**

- Implémentation : endpoint NestJS `GET /api/v1/events/stream` retournant un flux SSE
- Événements émis : `order.created`, `order.status_changed`, `stock.alert`, `agent.status_changed`, `conversation.handoff_required`
- Frontend : hook React `useEventSource()` avec reconnexion automatique
- Rationale : unidirectionnel serveur → client (pas besoin de WebSocket bidirectionnel), très léger sur 3G, nativement supporté par tous les navigateurs

**Gestion des Erreurs — Format Unifié**

- `AllExceptionsFilter` global NestJS — intercepte toutes les exceptions
- Format de réponse standardisé :
```json
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Description lisible",
  "timestamp": "2026-04-11T10:00:00Z",
  "path": "/api/v1/orders"
}
```

**Rate Limiting**

- `@nestjs/throttler` — limites par compte : 100 req/min standard, 10 req/min sur endpoints sensibles (auth, webhooks)
- Webhooks WhatsApp entrants exemptés du throttling (IPs Twilio whitelistées)

---

### Architecture Frontend

**Gestion d'État**

| Couche | Outil | Rôle |
|--------|-------|------|
| Données serveur | TanStack Query v5 | Fetching, cache, invalidation, optimistic updates |
| État UI local | Zustand | Modales, sidebar, état de navigation |
| Formulaires | React Hook Form | Gestion formulaires complexes (catalogue, onboarding) |

- Pas de Redux — overhead injustifié pour ce cas d'usage

**Bibliothèque de Composants — shadcn/ui**

- Composants headless basés sur Radix UI + Tailwind CSS
- Accessibilité native (ARIA) — important pour les utilisateurs sur écrans variés
- Bundle optimisé — seuls les composants utilisés sont inclus
- Personnalisable au pixel pour respecter les exigences UX mobile-first 360px

**Validation Partagée — Zod**

- Schémas Zod définis dans `packages/shared/schemas/`
- Utilisés côté NestJS (via `class-validator` + transformation Zod) ET côté Next.js (React Hook Form resolver)
- Garantit la cohérence des règles de validation entre frontend et backend

**Génération PDF — @react-pdf/renderer**

- Exécuté côté serveur NestJS (pas dans le navigateur)
- Template facture : composants React PDF avec logo boutique, données commande, numérotation séquentielle
- Résultat : buffer PDF retourné en réponse API → téléchargement direct depuis le dashboard

**Performance Mobile (cible 3G / 360px)**

- Images : `next/image` avec optimisation automatique WebP + lazy loading
- Code splitting : automatique via Next.js App Router (chaque route = bundle séparé)
- Fonts : `next/font` avec chargement local (évite les requêtes Google Fonts sur connexion lente)
- Composants lourds (graphiques analytics) : `dynamic()` avec `ssr: false`

---

### Infrastructure & Déploiement

**CI/CD — GitHub Actions**

```
Push main → GitHub Actions :
  ├── Lint + TypeScript check (toute la stack)
  ├── Tests unitaires (NestJS + Next.js)
  ├── Build Next.js → Vercel deploy (auto via intégration)
  └── Build NestJS → Railway deploy (via webhook)
```

- Environnements : `development` (local), `preview` (PR Vercel), `production`
- Variables d'environnement : Railway secrets pour le backend, Vercel env vars pour le frontend

**Monitoring & Erreurs — Sentry**

- SDK `@sentry/nestjs` + `@sentry/nextjs`
- Capture automatique des exceptions non gérées + performances (traces)
- Alertes sur erreurs d'intégration (NFR20) : Twilio, LLM, R2

**Logging Structuré — Pino**

- `nestjs-pino` avec sortie JSON en production
- Champs systématiques : `tenantId`, `requestId`, `service`, `level`, `timestamp`
- Niveaux : `error` (intégrations), `warn` (approche limite tier), `info` (webhooks entrants), `debug` (développement)

---

### Analyse d'Impact des Décisions

**Séquence d'implémentation recommandée :**

1. Setup Turborepo monorepo + workspaces
2. Schéma Prisma avec `tenant_id` (isolation multi-tenant dès le départ)
3. Auth NestJS (JWT httpOnly cookies + RBAC Guards)
4. `TenantMiddleware` + `AsyncLocalStorage` (fondation de la sécurité)
5. Modules NestJS par domaine (orders, products, customers, agent...)
6. SSE endpoint pour notifications temps réel
7. Frontend Next.js avec TanStack Query + shadcn/ui
8. Intégration Twilio (webhooks + queue BullMQ)
9. Intégration LLM (agent conversationnel)
10. Cloudflare R2 (upload reçus, génération PDF)

**Dépendances Cross-Composants :**

- L'isolation multi-tenant (Prisma + AsyncLocalStorage) est un prérequis à TOUS les autres modules
- Le schéma Zod partagé (`packages/shared`) doit être défini avant les DTOs NestJS et les formulaires Next.js
- BullMQ (queue webhooks) dépend de Redis — à provisionner en même temps que PostgreSQL sur Railway
- SSE frontend dépend du middleware d'auth (le flux SSE doit être authentifié)

## Patterns d'Implémentation & Règles de Cohérence

### Points de Conflit Identifiés

**5 zones où des agents IA pourraient faire des choix incompatibles sans ces règles :**
1. Conventions de nommage (3 casses coexistent dans le stack)
2. Format des réponses API (enveloppe vs réponse directe)
3. Organisation des modules NestJS (structure des fichiers)
4. Organisation des composants Next.js (feature-first vs type-first)
5. Gestion des états de chargement et d'erreur frontend

---

### Patterns de Nommage

**Base de données (PostgreSQL / Prisma) :**

| Élément | Convention | Exemple |
|---------|-----------|---------|
| Tables | `snake_case` pluriel | `orders`, `stock_levels`, `whatsapp_conversations` |
| Colonnes | `snake_case` | `tenant_id`, `created_at`, `mobile_money_receipt_url` |
| Modèles Prisma | `PascalCase` singulier | `Order`, `StockLevel`, `WhatsappConversation` |
| Clés étrangères | `{table_singulier}_id` | `order_id`, `product_id`, `tenant_id` |
| Index | `{table}_{colonne}_idx` | `orders_tenant_id_idx`, `products_sku_idx` |

**TypeScript / API :**

| Élément | Convention | Exemple |
|---------|-----------|---------|
| DTOs | `PascalCase` + suffixe | `CreateOrderDto`, `OrderResponseDto` |
| Interfaces | `PascalCase` | `OrderStatus`, `TenantContext` |
| Variables / propriétés | `camelCase` | `tenantId`, `createdAt`, `orderId` |
| Fichiers NestJS | `kebab-case` | `order.controller.ts`, `order.service.ts` |
| Fichiers React | `PascalCase.tsx` (composants), `camelCase.ts` (hooks/utils) | `OrderCard.tsx`, `useOrders.ts` |
| Endpoints REST | `kebab-case` pluriel | `/api/v1/orders`, `/api/v1/stock-levels` |
| Événements SSE | `domain.action` (dot notation, snake_case) | `order.created`, `stock.alert`, `agent.status_changed` |
| Événements BullMQ | `domain:action` | `whatsapp:message_received`, `agent:response_ready` |

---

### Patterns de Structure

**Structure obligatoire d'un module NestJS :**

```
modules/{domain}/
├── {domain}.module.ts
├── {domain}.controller.ts
├── {domain}.service.ts
├── {domain}.repository.ts      ← toutes les queries Prisma ici, jamais ailleurs
├── dto/
│   ├── create-{domain}.dto.ts
│   ├── update-{domain}.dto.ts
│   └── {domain}-response.dto.ts
└── {domain}.service.spec.ts    ← tests co-localisés avec le service
```

**Arborescence complète apps/api :**

```
apps/api/src/
├── modules/
│   ├── orders/
│   ├── products/
│   ├── customers/
│   ├── stock/
│   ├── analytics/
│   ├── invoices/
│   ├── agent/                  ← Agent WhatsApp IA
│   ├── advisor/                ← Agent Conseiller IA
│   ├── conversations/          ← Gestion handoff vendeur ↔ IA
│   ├── webhooks/               ← Réception webhooks Twilio
│   ├── auth/
│   ├── subscriptions/
│   ├── collaborators/
│   └── admin/
├── common/
│   ├── guards/                 ← RolesGuard, JwtAuthGuard
│   ├── decorators/             ← @Roles(), @CurrentTenant(), @CurrentUser()
│   ├── filters/                ← AllExceptionsFilter
│   ├── interceptors/           ← ResponseWrapperInterceptor
│   ├── middleware/             ← TenantMiddleware
│   └── pipes/                  ← ZodValidationPipe
├── config/                     ← @nestjs/config — toutes les variables d'env
└── prisma/
    └── prisma.service.ts
```

**Arborescence complète apps/web :**

```
apps/web/src/
├── app/
│   ├── (auth)/
│   │   ├── login/page.tsx
│   │   └── register/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx          ← Layout avec navigation fixe
│   │   ├── page.tsx            ← Accueil dashboard (résumé activité)
│   │   ├── orders/page.tsx
│   │   ├── conversations/page.tsx
│   │   ├── products/page.tsx
│   │   ├── customers/page.tsx
│   │   ├── analytics/page.tsx
│   │   └── settings/page.tsx
│   └── onboarding/
│       └── page.tsx
├── components/
│   ├── ui/                     ← shadcn/ui — NE JAMAIS MODIFIER ces fichiers
│   ├── orders/                 ← Composants spécifiques aux commandes
│   ├── products/
│   ├── agent/                  ← Badge statut agent, panneau conversations
│   └── shared/                 ← Composants réutilisables cross-feature
├── hooks/
│   ├── useOrders.ts
│   ├── useProducts.ts
│   ├── useCustomers.ts
│   ├── useAnalytics.ts
│   └── useAgentEvents.ts       ← Hook SSE pour les événements temps réel
├── lib/
│   ├── api.ts                  ← Client HTTP centralisé (fetch wrapper + auth)
│   └── utils.ts
└── store/
    └── ui.store.ts             ← Zustand — état UI uniquement (modales, sidebar)
```

**Package partagé :**

```
packages/shared/
├── schemas/                    ← Schémas Zod partagés frontend ↔ backend
│   ├── order.schema.ts
│   ├── product.schema.ts
│   └── auth.schema.ts
└── types/                      ← Types TypeScript purs (sans Zod)
    ├── order.types.ts
    └── agent.types.ts
```

---

### Patterns de Format

**Enveloppe de réponse API — obligatoire sur tous les endpoints :**

```typescript
// ✅ Liste avec pagination
{
  "data": [...],
  "meta": { "total": 42, "page": 1, "limit": 20 }
}

// ✅ Objet unique
{
  "data": { "id": "...", "status": "confirmed" }
}

// ✅ Erreur
{
  "statusCode": 400,
  "error": "BAD_REQUEST",
  "message": "Le produit est hors stock.",
  "timestamp": "2026-04-11T10:00:00.000Z",
  "path": "/api/v1/orders"
}

// ❌ INTERDIT — réponse directe sans enveloppe
[{ "id": "...", "status": "confirmed" }]
```

**Formats de données :**

| Type | Format | Exemple |
|------|--------|---------|
| Champs JSON API | `camelCase` | `tenantId`, `createdAt`, `mobileMoneyReceiptUrl` |
| Dates | ISO 8601 UTC | `"2026-04-11T10:00:00.000Z"` |
| Booléens | `true` / `false` | jamais `1` / `0` |
| Montants FCFA | Entier (centimes non utilisés) | `22000` (= 22 000 FCFA) |
| IDs | UUID v4 string | `"550e8400-e29b-41d4-a716-446655440000"` |
| Pagination | `?page=1&limit=20` | défaut `limit=20`, max `100` |
| Null | `null` explicite | jamais omettre le champ |

---

### Patterns de Communication

**Événements SSE — payload standardisé :**

```typescript
// Tous les événements SSE suivent cette structure
interface SseEvent<T> {
  event: string;       // "order.created", "stock.alert"
  data: {
    tenantId: string;
    payload: T;
    timestamp: string; // ISO 8601
  }
}
```

**Hooks TanStack Query — nommage obligatoire :**

```typescript
// Queries (lecture)
useOrders(filters?)       // liste avec filtres optionnels
useOrder(id)              // objet unique par ID
useOrderStats()           // données analytics

// Mutations (écriture)
useCreateOrder()
useUpdateOrderStatus()
useDeleteProduct()

// ❌ INTERDIT — gestion manuelle du loading
const [loading, setLoading] = useState(false)
const [data, setData] = useState(null)
```

**État UI Zustand — uniquement pour l'état d'interface :**

```typescript
// ✅ Ce qui va dans Zustand
interface UIStore {
  isSidebarOpen: boolean;
  activeConversationId: string | null;
  isAgentControlled: boolean; // takeover actif
}

// ❌ Ce qui NE va PAS dans Zustand
// Données serveur → TanStack Query
// Données formulaire → React Hook Form
```

---

### Patterns de Processus

**Gestion des états de chargement frontend :**

```tsx
// ✅ Pattern obligatoire — toujours ces trois états
const { data, isLoading, error } = useOrders()

if (isLoading) return <OrdersSkeleton />    // Skeleton spécifique, jamais spinner générique
if (error) return <ErrorMessage error={error} retry={refetch} />
return <OrdersList orders={data.data} />
```

**Gestion des erreurs NestJS — jamais de `throw new Error()` brut :**

```typescript
// ✅ Erreurs métier
throw new HttpException('Produit hors stock', HttpStatus.BAD_REQUEST)
throw new NotFoundException(`Commande #${id} introuvable`)
throw new ForbiddenException('Accès réservé aux collaborateurs Business')

// ❌ INTERDIT
throw new Error('something went wrong')
```

**Accès Prisma — uniquement depuis les Repositories :**

```typescript
// ✅ Dans OrdersRepository
async findByTenant(page: number, limit: number) {
  const tenantId = this.tenantContext.getTenantId() // AsyncLocalStorage
  return this.prisma.order.findMany({
    where: { tenantId },
    skip: (page - 1) * limit,
    take: limit,
  })
}

// ❌ INTERDIT — accès Prisma dans le Controller ou Service directement
constructor(private readonly prisma: PrismaService) {} // dans un Controller
```

---

### Règles Obligatoires — Tous les Agents

**Tous les agents IA DOIVENT :**

- Placer toutes les queries Prisma dans le `{domain}.repository.ts` — jamais dans le service ou le controller
- Lire le `tenantId` depuis `AsyncLocalStorage` via `@CurrentTenant()` — jamais le passer en paramètre de méthode
- Définir les schémas Zod de validation dans `packages/shared/schemas/` avant de créer les DTOs NestJS
- Utiliser `HttpException` et ses sous-classes pour toutes les erreurs métier NestJS
- Stocker toutes les dates en UTC — conversion timezone côté frontend uniquement
- Centraliser toutes les variables d'environnement dans `apps/api/src/config/` via `@nestjs/config`
- Ne jamais modifier les fichiers `components/ui/` (shadcn/ui) — créer des wrappers dans `components/shared/` si nécessaire
- Utiliser `ResponseWrapperInterceptor` global — ne jamais retourner de données sans l'enveloppe `{ data: ... }`

**Anti-patterns à bannir :**

| Anti-pattern | Pattern correct |
|-------------|-----------------|
| Accès Prisma dans Controller | Passer par Repository |
| `throw new Error()` | `throw new HttpException()` |
| `tenantId` en paramètre de méthode | `@CurrentTenant()` décorateur |
| `useState` pour données serveur | TanStack Query |
| Spinner générique pour loading | Skeleton spécifique au composant |
| Réponse API sans enveloppe | `{ data: ... }` obligatoire |
| Dates sans timezone | ISO 8601 UTC obligatoire |
| Schémas Zod dans le module | `packages/shared/schemas/` |

## Structure du Projet & Frontières Architecturales

### Arborescence Complète du Monorepo

```
whatsell/
├── .github/
│   └── workflows/
│       ├── ci.yml                    ← Lint + tests sur chaque PR
│       └── deploy.yml                ← Deploy Vercel (web) + Railway (api) sur main
├── packages/
│   └── shared/
│       ├── package.json
│       ├── tsconfig.json
│       ├── schemas/                  ← Schémas Zod partagés frontend ↔ backend
│       │   ├── order.schema.ts
│       │   ├── product.schema.ts
│       │   ├── customer.schema.ts
│       │   ├── auth.schema.ts
│       │   └── agent.schema.ts
│       └── types/                    ← Types TypeScript purs (enums, interfaces)
│           ├── order.types.ts
│           ├── subscription.types.ts
│           └── agent.types.ts
│
├── apps/
│   ├── api/                          ← NestJS 11 — déployé sur Railway
│   │   ├── package.json
│   │   ├── nest-cli.json
│   │   ├── tsconfig.json
│   │   ├── .env.example
│   │   ├── prisma/
│   │   │   ├── schema.prisma         ← Schéma unique PostgreSQL multi-tenant
│   │   │   └── migrations/
│   │   └── src/
│   │       ├── main.ts               ← Bootstrap NestJS + Swagger + pipes globaux
│   │       ├── app.module.ts         ← Import de tous les modules
│   │       ├── config/
│   │       │   ├── app.config.ts
│   │       │   ├── database.config.ts
│   │       │   ├── jwt.config.ts
│   │       │   ├── twilio.config.ts
│   │       │   ├── llm.config.ts
│   │       │   ├── r2.config.ts
│   │       │   └── redis.config.ts
│   │       ├── prisma/
│   │       │   └── prisma.service.ts
│   │       ├── common/
│   │       │   ├── guards/
│   │       │   │   ├── jwt-auth.guard.ts
│   │       │   │   └── roles.guard.ts
│   │       │   ├── decorators/
│   │       │   │   ├── roles.decorator.ts
│   │       │   │   ├── current-tenant.decorator.ts
│   │       │   │   └── current-user.decorator.ts
│   │       │   ├── filters/
│   │       │   │   └── all-exceptions.filter.ts
│   │       │   ├── interceptors/
│   │       │   │   └── response-wrapper.interceptor.ts
│   │       │   ├── middleware/
│   │       │   │   └── tenant.middleware.ts
│   │       │   ├── pipes/
│   │       │   │   └── zod-validation.pipe.ts
│   │       │   └── services/
│   │       │       ├── storage.service.ts   ← Cloudflare R2
│   │       │       └── mail.service.ts      ← Email transactionnel
│   │       └── modules/
│   │           ├── auth/                    ← FR1, FR5
│   │           │   ├── auth.module.ts
│   │           │   ├── auth.controller.ts
│   │           │   ├── auth.service.ts
│   │           │   ├── auth.repository.ts
│   │           │   ├── dto/
│   │           │   └── auth.service.spec.ts
│   │           ├── onboarding/              ← FR2, FR3, FR4
│   │           │   ├── onboarding.module.ts
│   │           │   ├── onboarding.controller.ts
│   │           │   ├── onboarding.service.ts
│   │           │   └── dto/
│   │           ├── webhooks/                ← FR6–FR13 (réception Twilio)
│   │           │   ├── webhooks.module.ts
│   │           │   ├── webhooks.controller.ts  ← POST /webhooks/whatsapp
│   │           │   ├── webhooks.service.ts
│   │           │   └── webhooks.processor.ts   ← BullMQ consumer
│   │           ├── agent/                   ← FR6–FR13 (logique IA)
│   │           │   ├── agent.module.ts
│   │           │   ├── agent.service.ts
│   │           │   ├── agent.repository.ts
│   │           │   ├── llm.service.ts
│   │           │   └── agent.service.spec.ts
│   │           ├── conversations/           ← FR14, FR15, FR16
│   │           │   ├── conversations.module.ts
│   │           │   ├── conversations.controller.ts
│   │           │   ├── conversations.service.ts
│   │           │   └── conversations.repository.ts
│   │           ├── events/                  ← SSE global
│   │           │   ├── events.module.ts
│   │           │   └── events.controller.ts ← GET /events/stream
│   │           ├── orders/                  ← FR17–FR21
│   │           │   ├── orders.module.ts
│   │           │   ├── orders.controller.ts
│   │           │   ├── orders.service.ts
│   │           │   ├── orders.repository.ts
│   │           │   ├── dto/
│   │           │   └── orders.service.spec.ts
│   │           ├── products/                ← FR22–FR25
│   │           │   ├── products.module.ts
│   │           │   ├── products.controller.ts
│   │           │   ├── products.service.ts
│   │           │   ├── products.repository.ts
│   │           │   └── dto/
│   │           ├── stock/                   ← FR24, FR26, FR27
│   │           │   ├── stock.module.ts
│   │           │   ├── stock.controller.ts
│   │           │   ├── stock.service.ts
│   │           │   ├── stock.repository.ts
│   │           │   └── stock-alert.processor.ts ← BullMQ cron
│   │           ├── customers/               ← FR28–FR30
│   │           │   ├── customers.module.ts
│   │           │   ├── customers.controller.ts
│   │           │   ├── customers.service.ts
│   │           │   ├── customers.repository.ts
│   │           │   └── segmentation.service.ts
│   │           ├── analytics/               ← FR31–FR34
│   │           │   ├── analytics.module.ts
│   │           │   ├── analytics.controller.ts
│   │           │   ├── analytics.service.ts
│   │           │   └── analytics.repository.ts
│   │           ├── invoices/                ← FR20, FR35
│   │           │   ├── invoices.module.ts
│   │           │   ├── invoices.controller.ts
│   │           │   ├── invoices.service.ts
│   │           │   └── pdf.service.ts
│   │           ├── advisor/                 ← FR36–FR39
│   │           │   ├── advisor.module.ts
│   │           │   ├── advisor.controller.ts
│   │           │   ├── advisor.service.ts
│   │           │   └── advisor-alerts.processor.ts ← BullMQ cron
│   │           ├── subscriptions/           ← FR40–FR47
│   │           │   ├── subscriptions.module.ts
│   │           │   ├── subscriptions.controller.ts
│   │           │   ├── subscriptions.service.ts
│   │           │   ├── subscriptions.repository.ts
│   │           │   └── trial.processor.ts
│   │           ├── collaborators/           ← FR42–FR44
│   │           │   ├── collaborators.module.ts
│   │           │   ├── collaborators.controller.ts
│   │           │   ├── collaborators.service.ts
│   │           │   └── collaborators.repository.ts
│   │           └── admin/                   ← FR48–FR51
│   │               ├── admin.module.ts
│   │               ├── admin.controller.ts
│   │               ├── admin.service.ts
│   │               └── admin.repository.ts
│
│   └── web/                                 ← Next.js 16 — déployé sur Vercel
│       ├── package.json
│       ├── next.config.ts
│       ├── tailwind.config.ts
│       ├── tsconfig.json
│       ├── .env.local.example
│       ├── public/
│       │   └── fonts/
│       └── src/
│           ├── middleware.ts
│           ├── app/
│           │   ├── layout.tsx
│           │   ├── (auth)/
│           │   │   ├── login/page.tsx
│           │   │   └── register/page.tsx
│           │   ├── onboarding/page.tsx
│           │   ├── (dashboard)/
│           │   │   ├── layout.tsx
│           │   │   ├── page.tsx             ← Accueil : résumé + statut agent
│           │   │   ├── orders/
│           │   │   │   ├── page.tsx         ← FR17
│           │   │   │   └── [id]/page.tsx    ← FR18, FR19, FR20
│           │   │   ├── conversations/page.tsx ← FR14, FR15
│           │   │   ├── products/
│           │   │   │   ├── page.tsx         ← FR22–FR25
│           │   │   │   └── [id]/page.tsx    ← FR24, FR26
│           │   │   ├── customers/
│           │   │   │   ├── page.tsx         ← FR29, FR30
│           │   │   │   └── [id]/page.tsx    ← FR29
│           │   │   ├── analytics/page.tsx   ← FR31–FR34
│           │   │   └── settings/page.tsx    ← FR40–FR44
│           │   └── (admin)/
│           │       └── dashboard/page.tsx   ← FR48–FR51
│           ├── components/
│           │   ├── ui/                      ← shadcn/ui — NE PAS MODIFIER
│           │   ├── shared/
│           │   │   ├── ErrorMessage.tsx
│           │   │   ├── PageHeader.tsx
│           │   │   └── ConfirmDialog.tsx
│           │   ├── orders/
│           │   │   ├── OrderCard.tsx
│           │   │   ├── OrdersList.tsx
│           │   │   ├── OrderStatusBadge.tsx
│           │   │   ├── OrdersSkeleton.tsx
│           │   │   └── StatusProgressButton.tsx
│           │   ├── products/
│           │   │   ├── ProductCard.tsx
│           │   │   ├── ProductForm.tsx
│           │   │   └── VariantEditor.tsx
│           │   ├── agent/
│           │   │   ├── AgentStatusBadge.tsx
│           │   │   ├── ConversationPanel.tsx
│           │   │   └── TakeoverButton.tsx
│           │   ├── advisor/
│           │   │   └── AdvisorChat.tsx
│           │   └── onboarding/
│           │       ├── OnboardingWizard.tsx
│           │       └── WhatsAppConnectStep.tsx
│           ├── hooks/
│           │   ├── useOrders.ts
│           │   ├── useOrder.ts
│           │   ├── useUpdateOrderStatus.ts
│           │   ├── useProducts.ts
│           │   ├── useCreateProduct.ts
│           │   ├── useCustomers.ts
│           │   ├── useAnalytics.ts
│           │   ├── useSubscription.ts
│           │   ├── useAgentEvents.ts        ← SSE hook
│           │   └── useConversations.ts
│           ├── lib/
│           │   ├── api.ts
│           │   └── utils.ts
│           └── store/
│               └── ui.store.ts
│
├── turbo.json
├── package.json
└── pnpm-workspace.yaml
```

### Frontières Architecturales

**Frontières API :**

| Frontière | Description |
|-----------|-------------|
| `POST /webhooks/whatsapp` | IP Twilio whitelistée, signature vérifiée, push BullMQ immédiat — pas de traitement synchrone |
| `GET /events/stream` | SSE authentifié — connexion longue durée scopée au tenant |
| `/api/v1/admin/*` | Cross-tenant en lecture — exige rôle `ADMIN`, bypass `TenantMiddleware` |
| `/api/v1/*` | Toutes autres routes — `TenantMiddleware` obligatoire |

**Frontières de données :**

| Service | Accès | Isolation |
|---------|-------|-----------|
| `PrismaService` | Via Repository uniquement | `tenantId` filtré via `AsyncLocalStorage` |
| Cloudflare R2 | Via `StorageService` centralisé | Clé préfixée `{tenantId}/` obligatoire |
| Redis BullMQ | Queues nommées par domaine | `whatsapp-messages`, `stock-alerts`, `advisor-alerts`, `trial-expiry` |
| Redis Cache | Via `CacheService` | Clés préfixées `cache:{tenantId}:` |

### Mapping FR → Structure

| FRs | Module API | Page Web |
|-----|-----------|----------|
| FR1, FR5 | `modules/auth/` | `(auth)/login/`, `(auth)/register/` |
| FR2, FR3, FR4 | `modules/onboarding/` | `onboarding/` |
| FR6–FR13 | `modules/webhooks/`, `modules/agent/` | — (backend uniquement) |
| FR14, FR15, FR16 | `modules/conversations/`, `modules/events/` | `(dashboard)/conversations/` |
| FR17–FR21 | `modules/orders/`, `modules/invoices/` | `(dashboard)/orders/` |
| FR22–FR27 | `modules/products/`, `modules/stock/` | `(dashboard)/products/` |
| FR28–FR30 | `modules/customers/` | `(dashboard)/customers/` |
| FR31–FR35 | `modules/analytics/`, `modules/invoices/` | `(dashboard)/analytics/` |
| FR36–FR39 | `modules/advisor/` | `components/advisor/AdvisorChat.tsx` |
| FR40–FR47 | `modules/subscriptions/` | `(dashboard)/settings/` |
| FR42–FR44 | `modules/collaborators/` | `(dashboard)/settings/` |
| FR48–FR51 | `modules/admin/` | `(admin)/dashboard/` |

### Flux de Données Principaux

**Flux 1 — Message WhatsApp entrant (chemin critique)**
```
Twilio webhook → POST /webhooks/whatsapp
  → Vérification signature Twilio
  → Push queue BullMQ "whatsapp-messages"
  → WebhooksProcessor.consume()
    → AgentService.handleMessage(tenantId, message)
      → LlmService.generateResponse(context, catalog, rules)
      → OrdersService.createOrder() si intention confirmée
      → Twilio API → message réponse au client
  → SSE event "order.created" → dashboard vendeur
```

**Flux 2 — Takeover vendeur (reprise de contrôle)**
```
Vendeur tap "Reprendre" → POST /conversations/:id/takeover
  → ConversationsService.setMode(id, 'HUMAN')
  → SSE event "conversation.mode_changed"
  → AgentService suspend traitement de cette conversation
  → Vendeur envoie messages directement via Twilio API
  → POST /conversations/:id/release
  → AgentService reprend avec contexte complet
```

**Flux 3 — Alerte stock proactive**
```
BullMQ cron "stock-alerts" (toutes les heures)
  → StockAlertProcessor.run()
    → StockRepository.findBelowThreshold() — pour chaque tenant actif
    → SSE event "stock.alert" → dashboard vendeur
    → AdvisorService.queueProactiveAlert()
```

### Points d'Intégration Externes

| Service | Point d'entrée | Localisation |
|---------|---------------|--------------|
| Twilio (webhooks entrants) | `POST /webhooks/whatsapp` | `modules/webhooks/webhooks.controller.ts` |
| Twilio (envoi messages sortants) | Appelé par `AgentService` | `modules/agent/agent.service.ts` |
| LLM API (OpenAI) | Appelé par `LlmService` | `modules/agent/llm.service.ts` |
| Cloudflare R2 | Via `StorageService` | `common/services/storage.service.ts` |
| Email transactionnel | Via `MailService` | `common/services/mail.service.ts` |

## Validation de l'Architecture

### Validation de la Cohérence ✅

**Compatibilité des décisions :**
Toutes les technologies du stack sont compatibles entre elles : Turborepo + Next.js 16 + NestJS 11 + Prisma + PostgreSQL + BullMQ + Redis + Cloudflare R2 forment un ensemble éprouvé sans conflits de versions ni de paradigmes.

**Cohérence des patterns :**
Les patterns de nommage, la structure modulaire NestJS, et l'organisation feature-first Next.js sont alignés avec les choix technologiques. Les règles de validation Zod partagées via `packages/shared` garantissent la cohérence entre les deux applications.

**Alignement de la structure :**
La structure du projet supporte toutes les décisions architecturales : séparation claire API/Frontend, isolation des modules NestJS par domaine, feature-first côté React.

### Validation de la Couverture des Exigences ✅

**Couverture fonctionnelle — 51/51 FRs couverts :**
Tous les modules sont mappés à des exigences fonctionnelles spécifiques. Aucun FR sans support architectural identifié (voir tableau de mapping FR → Structure).

**Couverture non-fonctionnelle — 20/20 NFRs adressés :**

| Catégorie | NFRs | Couverture architecturale |
|-----------|------|--------------------------|
| Performance (NFR1–4) | ✅ | LlmService timeout 3min, Next.js lazy loading, SSE ≤30s, react-pdf serveur |
| Sécurité (NFR5–10) | ✅ | TLS Railway/Vercel natif, AES-256-GCM, JWT httpOnly cookies, isolation tenant AsyncLocalStorage, R2 presigned URLs, AuditLogInterceptor |
| Fiabilité (NFR11–14) | ✅ | Railway always-on, fallback message d'attente LLM, backups Railway PostgreSQL, BullMQ cron health-check WhatsApp |
| Scalabilité (NFR15–17) | ✅ | BullMQ queue 1000 msg, PostgreSQL indexes sur tenant_id, modules isolés extensibles |
| Intégration (NFR18–20) | ✅ | Fallback LLM → transfert vendeur, BullMQ queue Twilio, Pino + Sentry journalisation |

### Gaps Identifiés et Résolus

**Gap 1 (Critique) — CORS cross-origin avec httpOnly cookies**

Le frontend (Vercel) et le backend (Railway) étant sur des domaines différents, les httpOnly cookies nécessitent une configuration CORS explicite.

Décision ajoutée :

```typescript
// apps/api/src/main.ts — configuration obligatoire
app.enableCors({
  origin: process.env.FRONTEND_URL,  // 'https://app.whatsell.com' en prod
  credentials: true,                 // OBLIGATOIRE pour httpOnly cookies
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
})

// apps/web/src/lib/api.ts — toutes les requêtes
fetch(url, {
  credentials: 'include',  // OBLIGATOIRE pour envoyer les cookies
  ...options
})
```

Variables d'environnement requises :
- `FRONTEND_URL` dans Railway : `https://app.whatsell.com` (prod), `http://localhost:3000` (dev)
- `NEXT_PUBLIC_API_URL` dans Vercel : `https://api.whatsell.com` (prod), `http://localhost:3001` (dev)

**Gap 2 (Important) — Audit Log (NFR9)**

Implémentation via décorateur + intercepteur NestJS :

- Table `audit_logs` en base : `id`, `tenant_id`, `user_id`, `action`, `resource`, `resource_id`, `metadata`, `created_at`
- `AuditLogInterceptor` : intercepte les réponses 2xx sur les endpoints décorés
- Décorateur `@AuditLog('action.resource')` sur les endpoints sensibles :
  - Modification règles de paiement, export données, gestion collaborateurs, changement abonnement
- Localisation : `common/interceptors/audit-log.interceptor.ts` + `modules/audit/audit.repository.ts`

**Gap 3 (Important) — Surveillance token WhatsApp (NFR14 : détection ≤5 min)**

BullMQ cron dédié `whatsapp-health-check` :

- Fréquence : toutes les 3 minutes, uniquement sur plage 06h–23h heure locale Mali/Burkina Faso (UTC+0)
- Logique : interroge l'état du token WhatsApp Business via Twilio API pour chaque compte actif
- Sur déconnexion détectée :
  - SSE event `agent.disconnected` → indicateur rouge dans le dashboard vendeur
  - Email vendeur avec lien de reconnexion guidée
  - Flag `whatsapp_connected: false` en base + alerte admin panel
- Localisation : `modules/agent/whatsapp-health.processor.ts`

### Checklist de Complétude Architecturale

**✅ Analyse des exigences**
- [x] Contexte projet analysé (PRD + Brief + UX)
- [x] Complexité évaluée (Élevée — SaaS + IA + intégrations)
- [x] Contraintes techniques identifiées
- [x] Préoccupations transversales mappées (6 identifiées)

**✅ Décisions architecturales**
- [x] Stack technologique complet spécifié avec versions
- [x] Stratégie multi-tenant décidée (row-level + AsyncLocalStorage)
- [x] Auth et sécurité définies (JWT httpOnly + RBAC Guards)
- [x] Communication temps réel choisie (SSE)
- [x] Déploiement défini (Vercel frontend + Railway backend)
- [x] CORS cross-origin documenté

**✅ Patterns d'implémentation**
- [x] Conventions de nommage (5 contextes couverts)
- [x] Structure obligatoire des modules NestJS
- [x] Organisation feature-first Next.js
- [x] Format réponses API standardisé
- [x] Règles obligatoires pour tous les agents

**✅ Structure du projet**
- [x] Arborescence complète du monorepo définie
- [x] Frontières architecturales documentées
- [x] 51 FRs mappés à des fichiers/modules spécifiques
- [x] 3 flux de données principaux documentés
- [x] Points d'intégration externes spécifiés

### Évaluation de Maturité pour l'Implémentation

**Statut global : PRÊT POUR L'IMPLÉMENTATION**

**Niveau de confiance : Élevé**

**Points forts de cette architecture :**
- Isolation multi-tenant robuste dès le schéma — risque de fuite de données minimisé
- Queue BullMQ pour les webhooks WhatsApp — aucune perte de message possible même en pic de charge
- Types TypeScript partagés via `packages/shared` — cohérence garantie entre frontend et backend
- Patterns clairs et sans ambiguïté — les agents IA ont des règles explicites pour chaque décision

**Domaines à surveiller en implémentation :**
- La configuration LLM (prompting en français informel) nécessitera des itérations — prévoir phase beta avec corpus réel
- Le coût LLM sur le tier Business "illimité" doit être monitoré dès les premiers vendeurs actifs
- L'onboarding Meta Business Manager est le point de friction #1 — tester avec des vendeurs réels dès le MVP

### Handoff vers l'Implémentation

**Instructions pour les agents IA :**
1. Suivre toutes les décisions architecturales telles que documentées — ne pas improviser
2. Appliquer les patterns d'implémentation de façon systématique
3. Respecter les frontières de modules — tout accès Prisma via Repository
4. Se référer à ce document pour toute question architecturale

**Première priorité d'implémentation :**

```bash
# Story 1 — Initialisation du monorepo
npx create-turbo@latest whatsell
cd apps && npx create-next-app@latest web --typescript --tailwind --app --turbopack
npm install -g @nestjs/cli@latest && nest new api

# Story 2 — Schéma Prisma multi-tenant (fondation de toute la suite)
# Définir schema.prisma avec tenant_id sur toutes les tables
# Configurer TenantMiddleware + AsyncLocalStorage AVANT tout autre module
```
