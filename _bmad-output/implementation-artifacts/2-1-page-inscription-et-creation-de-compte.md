# Story 2.1 : Page d'Inscription & Création de Compte

Status: done

## Story

En tant que **nouveau vendeur**,
je veux créer un compte Whatsell avec mon email et un mot de passe, ou me connecter si j'ai déjà un compte,
afin d'accéder à la plateforme et démarrer l'activation de mon agent IA.

## Acceptance Criteria

1. `POST /api/v1/auth/register` avec email valide et mot de passe (≥ 8 chars) → compte créé, essai Pro 7 jours activé automatiquement (FR46), cookies httpOnly posés (`access_token` 15min + `refresh_token` 7j), vendeur redirigé vers `/onboarding`
2. `POST /api/v1/auth/register` avec email déjà utilisé → `409 Conflict`, le frontend affiche : "Cet email est déjà associé à un compte. Connectez-vous ?"  (UX-DR22)
3. `POST /api/v1/auth/login` avec identifiants corrects → authentifié, redirigé vers `/onboarding` si onboarding non terminé, sinon vers le dashboard (`/`)
4. `GET /api/v1/auth/me` retourne `{ data: { id, email, role, tenantId, onboardingCompleted: boolean } }` — `onboardingCompleted: true` si `Tenant.onboardingCompletedAt` est non nul
5. La page `/register` et la page `/login` sont visuellement dans un layout centré dédié (route group `(auth)`) sans la navigation principale du dashboard
6. Les deux formulaires utilisent React Hook Form + schémas Zod partagés (`registerSchema`, `loginSchema` depuis `@whatsell/shared`) — validation côté client en temps réel
7. Tous les messages d'erreur sont en français humain — jamais de codes HTTP ou messages techniques visibles (UX-DR22)

## Tasks / Subtasks

- [x] Tâche 1 : Schéma Prisma — ajout `onboardingCompletedAt` (AC: 3, 4)
  - [x] Ajouter dans `apps/api/prisma/schema.prisma`, modèle `Tenant` : `onboardingCompletedAt DateTime?`
  - [x] Exécuter `npx prisma migrate dev --name add-tenant-onboarding-completed-at` depuis `apps/api/`
  - [x] Vérifier que la migration est générée dans `apps/api/prisma/migrations/`
  - [x] **Note :** ce champ sera mis à jour par `PATCH /api/v1/onboarding/activate` (Story 2.6) — cette story crée uniquement la colonne

- [x] Tâche 2 : AuthRepository — création de l'abonnement essai Pro à l'inscription (AC: 1)
  - [x] Ouvrir `apps/api/src/modules/auth/auth.repository.ts`
  - [x] Dans `createTenantAndUser()`, ajouter dans la même transaction Prisma `tx.subscription.create()` avec :
    - `tenantId: tenant.id`
    - `tier: SubscriptionTier.PRO` (import depuis `'../../../generated/prisma/client'`)
    - `trialEndsAt: new Date(now + 7 * 24 * 60 * 60 * 1000)`
    - `ordersLimit: 100` (tier Pro = 100 commandes/mois selon PRD §MVP freemium)
    - `ordersUsed: 0`
    - `currentPeriodStart: new Date()`
    - `currentPeriodEnd: new Date(now + 7 * 24 * 60 * 60 * 1000)`
  - [x] La création Subscription est atomique avec Tenant+User — si elle échoue, tout rollback
  - [x] Ajouter méthode `findUserWithTenant(id: string)` : `prisma.user.findUnique({ where: { id }, include: { tenant: true } })`

- [x] Tâche 3 : AuthService — méthode `me()` (AC: 4)
  - [x] Ouvrir `apps/api/src/modules/auth/auth.service.ts`
  - [x] Ajouter méthode publique `me(userId: string)` :
    - Appelle `authRepository.findUserWithTenant(userId)`
    - Lève `UnauthorizedException` si user null ou `!user.isActive`
    - Retourne `{ id: user.id, email: user.email, role: user.role, tenantId: user.tenantId, onboardingCompleted: !!user.tenant.onboardingCompletedAt }`
  - [x] **Ne pas modifier** les méthodes existantes `register`, `login`, `refresh`, `logout`, `generateTokens`

- [x] Tâche 4 : AuthController — remplacer `me()` (AC: 4)
  - [x] Ouvrir `apps/api/src/modules/auth/auth.controller.ts`
  - [x] Modifier le handler `GET /auth/me` :
    - Appeler `this.authService.me(user.id)` à la place de retourner `user` directement
    - `ResponseWrapperInterceptor` global enveloppera automatiquement dans `{ data: ... }` — ne pas envelopper manuellement
  - [x] Mettre à jour le type de retour si nécessaire

- [x] Tâche 5 : Tests unitaires — auth.service.spec.ts (AC: 1, 4)
  - [x] Ouvrir `apps/api/src/modules/auth/auth.service.spec.ts`
  - [x] Ajouter mock pour `authRepository.findUserWithTenant`
  - [x] Ajouter tests :
    - `me()` — retourne `onboardingCompleted: false` si `tenant.onboardingCompletedAt` est `null`
    - `me()` — retourne `onboardingCompleted: true` si `tenant.onboardingCompletedAt` est une date
    - `me()` — lève `UnauthorizedException` si user non trouvé
    - `me()` — lève `UnauthorizedException` si user inactif
  - [x] Tous les tests existants continuent à passer — 15/15 ✅

- [x] Tâche 6 : Frontend — route group `(auth)` layout (AC: 5)
  - [x] Créer `apps/web/src/app/(auth)/layout.tsx`
  - [x] Layout centré verticalement et horizontalement, fond neutre (`bg-background`)
  - [x] Largeur max `max-w-sm` sur mobile, centré avec `mx-auto` — 360px en priorité
  - [x] Composant serveur Next.js (pas de `'use client'`)
  - [x] En-tête "Whatsell" avec tagline

- [x] Tâche 7 : Frontend — Page `/register` (AC: 1, 2, 6, 7)
  - [x] Créer `apps/web/src/app/(auth)/register/page.tsx` (`'use client'` — formulaire interactif)
  - [x] React Hook Form avec `zodResolver(registerSchema)` — import depuis `@whatsell/shared`
  - [x] Champs : `email` (type="email") + `password` (type="password")
  - [x] Composants : `Button` + `Input` (nouveau) + `Card` depuis `@/components/ui/`
  - [x] Appel API : `apiPost<{ message: string }>('/api/v1/auth/register', ...)` via `@/lib/api`
  - [x] Succès → `router.push('/onboarding')` (hook `useRouter` depuis `next/navigation`)
  - [x] Erreur 409 → "Cet email est déjà associé à un compte. Connectez-vous ?"
  - [x] Autres erreurs → "Une erreur est survenue. Veuillez réessayer."
  - [x] Lien vers `/login` en bas du formulaire
  - [x] Bouton désactivé pendant la soumission (état `isSubmitting`)

- [x] Tâche 8 : Frontend — Page `/login` (AC: 3, 6, 7)
  - [x] Créer `apps/web/src/app/(auth)/login/page.tsx` (`'use client'` — formulaire interactif)
  - [x] React Hook Form avec `zodResolver(loginSchema)` — import depuis `@whatsell/shared`
  - [x] Champs : `email` (type="email") + `password` (type="password")
  - [x] Appel API login puis `GET /api/v1/auth/me` pour redirect
    - `onboardingCompleted: false` → `/onboarding`
    - `onboardingCompleted: true` → `/` (dashboard)
  - [x] Erreur 401 → "Email ou mot de passe invalide."
  - [x] Autres erreurs → "Une erreur est survenue. Veuillez réessayer."
  - [x] Lien vers `/register` en bas
  - [x] Bouton désactivé pendant la soumission

## Dev Notes

### Contexte Critique — Ce Qui Existe Déjà

**Le module auth backend est COMPLET depuis Story 1.3.** Ne pas recréer ni refactoriser :
- `apps/api/src/modules/auth/auth.controller.ts` — EXISTANT, modifier uniquement `GET /auth/me`
- `apps/api/src/modules/auth/auth.service.ts` — EXISTANT, ajouter uniquement `me()`
- `apps/api/src/modules/auth/auth.repository.ts` — EXISTANT, modifier `createTenantAndUser()` + ajouter `findUserWithTenant()`
- `apps/api/src/modules/auth/auth.module.ts` — EXISTANT, pas de modification
- `packages/shared/src/schemas/auth.schema.ts` — `registerSchema` et `loginSchema` DÉJÀ EXPORTÉS. Ne pas recréer.

### Tier et Limites d'Abonnement — Valeurs Exactes

Source : PRD §MVP "Modèle freemium" :
| Tier | Commandes/mois | Transition |
|------|---------------|------------|
| FREE | 20 | Défaut après expiration du trial |
| PRO  | 100 | Trial 7j à l'inscription |
| BUSINESS | illimité (fair use) | Upgrade manuel |

**À l'inscription :** créer Subscription PRO avec `ordersLimit: 100`, `trialEndsAt: +7j`.

**Attention :** le schéma Prisma a `ordersLimit: Int @default(50)` — cette valeur par défaut est incorrecte pour le PRO. Passer `ordersLimit: 100` explicitement à la création.

### Import Prisma Enums

```typescript
// Dans auth.repository.ts — l'enum SubscriptionTier vient du client Prisma généré
import { User, SubscriptionTier } from '../../../generated/prisma/client';
```

### Structure cible auth.repository.ts

```typescript
async createTenantAndUser(data: CreateTenantAndUserInput): Promise<User> {
  return this.prisma.$transaction(async (tx) => {
    const tenant = await tx.tenant.create({ ... });
    const user = await tx.user.create({ ... });

    // Abonnement essai Pro 7 jours — atomique avec la création du compte (FR46)
    const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await tx.subscription.create({
      data: {
        tenantId: tenant.id,
        tier: SubscriptionTier.PRO,
        ordersLimit: 100,
        ordersUsed: 0,
        trialEndsAt: trialEnd,
        currentPeriodStart: new Date(),
        currentPeriodEnd: trialEnd,
      },
    });

    return user;
  });
}

findUserWithTenant(id: string) {
  return this.prisma.user.findUnique({
    where: { id },
    include: { tenant: true },
  });
}
```

### Structure Cible Pages Frontend

```
apps/web/src/app/
├── (auth)/
│   ├── layout.tsx        ← NOUVEAU — layout centré sans nav
│   ├── register/
│   │   └── page.tsx      ← NOUVEAU — formulaire inscription
│   └── login/
│       └── page.tsx      ← NOUVEAU — formulaire connexion
└── (dashboard)/          ← EXISTANT — ne pas toucher
```

### Pattern React Hook Form avec Zod — Appliqué dans ce Projet

```typescript
'use client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { registerSchema, RegisterDto } from '@whatsell/shared';
import { apiPost } from '@/lib/api';
import { useRouter } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterDto>({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data: RegisterDto) => {
    try {
      await apiPost('/api/v1/auth/register', data);
      router.push('/onboarding');
    } catch (err) {
      // Détecter 409 dans le message d'erreur (apiPost lève Error avec le status)
      if (err instanceof Error && err.message.includes('409')) {
        setError('email', { message: 'Cet email est déjà associé à un compte. Connectez-vous ?' });
      } else {
        setError('root', { message: 'Une erreur est survenue. Veuillez réessayer.' });
      }
    }
  };
  // ...
}
```

**Note :** `apiPost` dans `apps/web/src/lib/api.ts` lève `Error` avec message `"POST /api/v1/auth/register échoué : 409"` — parser le code HTTP depuis le message.

### Dépendances Frontend à Vérifier

```bash
# Vérifier que @hookform/resolvers est déjà installé dans apps/web
# Si absent : pnpm add --filter @whatsell/web @hookform/resolvers
cat apps/web/package.json | grep hookform
```

### CORS & Cookies — Déjà Configuré

- CORS est configuré dans `apps/api/src/main.ts` avec `credentials: true` et `origin: configService.get('frontendUrl')`
- `credentials: 'include'` est déjà dans `apiClient()` de `apps/web/src/lib/api.ts` — les cookies httpOnly seront automatiquement envoyés

### Réponse API — Format `{ data: ... }` Obligatoire

`ResponseWrapperInterceptor` global (Story 1.5) enveloppe toutes les réponses NestJS dans `{ data: ... }`. Côté frontend, lire `response.data` si on parse manuellement. La méthode `apiGet<T>` retourne le JSON brut — pour `GET /auth/me`, le type `T` doit être `{ data: { id, email, role, tenantId, onboardingCompleted: boolean } }`.

### UX — Contraintes Mobile-First

- Largeur 360px prioritaire — composants pleine largeur sur mobile
- Bouton de soumission : `w-full`, hauteur minimum `h-11` (44px — touch target)
- Messages d'erreur visibles sous le champ concerné — pas de modales
- Fond page auth : utiliser `bg-background` (token design system) — jamais de couleur hardcodée

### Champ `onboardingCompletedAt` — Utilisation dans les Stories Suivantes

Ce champ sera mis à `new Date()` dans Story 2.6 (`PATCH /api/v1/onboarding/activate`). Ne pas définir de valeur par défaut dans Prisma — il doit rester `null` après inscription pour que la redirection vers le wizard fonctionne correctement.

### References

- Architecture auth : [architecture.md — Authentification & Sécurité](_bmad-output/planning-artifacts/architecture.md)
- AuthController existant : [auth.controller.ts](apps/api/src/modules/auth/auth.controller.ts)
- AuthService existant : [auth.service.ts](apps/api/src/modules/auth/auth.service.ts)
- AuthRepository existant : [auth.repository.ts](apps/api/src/modules/auth/auth.repository.ts)
- Schémas Zod partagés : [auth.schema.ts](packages/shared/src/schemas/auth.schema.ts)
- Client HTTP frontend : [api.ts](apps/web/src/lib/api.ts)
- Schéma Prisma : [schema.prisma](apps/api/prisma/schema.prisma)
- PRD tier freemium : [prd.md §MVP](_bmad-output/planning-artifacts/prd.md)

### Review Findings

- [x] [Review][Patch] `user.tenant` null dereference crashes `me()` with unhandled TypeError [apps/api/src/modules/auth/auth.service.ts:137]
- [x] [Review][Patch] Login page single try/catch merges POST-login and GET-me errors — successful login can show wrong error and leave user stuck [apps/web/src/app/(auth)/login/page.tsx:34-50]
- [x] [Review][Defer] Concurrent registration race: same-email requests → raw Prisma P2002 instead of 409 [apps/api/src/modules/auth/auth.service.ts] — deferred, pre-existing
- [x] [Review][Defer] `err.message.includes('409'/'401')` parsing fragile — requires api.ts refactor to expose typed error status [apps/web/src/lib/api.ts] — deferred, pre-existing
- [x] [Review][Defer] Cookie `secure: true` hardcoded — silently breaks auth flow in local HTTP dev environments [apps/api/src/modules/auth/auth.controller.ts] — deferred, pre-existing
- [x] [Review][Defer] `isActive` checked in `me()` but not in `findUserById` — inconsistent active-user enforcement [apps/api/src/modules/auth/auth.repository.ts] — deferred, pre-existing
- [x] [Review][Defer] No explicit CSRF token on login/register forms (mitigated by sameSite:strict cookies) — deferred, pre-existing design
- [x] [Review][Defer] Tenant slug collision on empty email local part (e.g. `123@example.com`) [apps/api/src/modules/auth/auth.service.ts] — deferred, pre-existing
- [x] [Review][Defer] PostgreSQL `@unique` on email is case-sensitive — Zod lowercases but DB column lacks `citext` or lower() index [apps/api/prisma/schema.prisma] — deferred, pre-existing
- [x] [Review][Defer] `ordersLimit @default(50)` in schema — wrong for PRO tier, future paths could silently use 50 [apps/api/prisma/schema.prisma] — deferred, pre-existing
- [x] [Review][Defer] No integration test for subscription atomicity rollback — unit mocks don't cover `$transaction` failure rollback [apps/api/src/modules/auth/auth.service.spec.ts] — deferred, pre-existing
- [x] [Review][Defer] `GET /auth/me` missing `@Throttle` decorator — only auth endpoint without rate limiting [apps/api/src/modules/auth/auth.controller.ts] — deferred, pre-existing

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

- ✅ Migration Prisma `20260518154957_add_tenant_onboarding_completed_at` appliquée — ajout `onboardingCompletedAt DateTime?` sur le modèle `Tenant`
- ✅ `AuthRepository.createTenantAndUser()` étendu — création atomique de `Subscription` PRO (100 cmd/mois, trial 7j) dans la même transaction (FR46)
- ✅ `AuthRepository.findUserWithTenant()` ajouté — Prisma `include: { tenant: true }` pour la méthode `me()`
- ✅ `AuthService.me()` ajouté — retourne `onboardingCompleted: boolean` basé sur `tenant.onboardingCompletedAt`
- ✅ `AuthController.GET /auth/me` mis à jour — délègue à `authService.me(user.id)` au lieu de retourner le payload JWT brut
- ✅ Tests `auth.service.spec.ts` enrichis — 15/15 passés, 4 nouveaux tests pour `me()`, 0 régression
- ✅ `@hookform/resolvers` installé dans `@whatsell/web` (absent de package.json)
- ✅ `apps/web/src/components/ui/input.tsx` créé — composant shadcn/ui `Input` standard (manquant)
- ✅ Route group `(auth)` créé — layout centré mobile-first, sans navigation dashboard
- ✅ Page `/register` implémentée — React Hook Form + Zod, gestion 409, redirect `/onboarding`
- ✅ Page `/login` implémentée — React Hook Form + Zod, redirect conditionnel via `GET /auth/me`
- ✅ TypeScript check passé (0 erreur) sur `apps/web`
- ⚠️ 4 échecs pré-existants non liés à cette story (notifications DTO manquant, StorageService test, encryption message, Notification JSDOM)

### File List

- `apps/api/prisma/schema.prisma` — modifié : ajout `onboardingCompletedAt DateTime?` sur `Tenant`
- `apps/api/prisma/migrations/20260518154957_add_tenant_onboarding_completed_at/migration.sql` — créé
- `apps/api/src/modules/auth/auth.repository.ts` — modifié : `createTenantAndUser()` + `findUserWithTenant()`
- `apps/api/src/modules/auth/auth.service.ts` — modifié : ajout `me()`
- `apps/api/src/modules/auth/auth.controller.ts` — modifié : `GET /auth/me` → `authService.me()`
- `apps/api/src/modules/auth/auth.service.spec.ts` — modifié : +4 tests `me()`, mock `findUserWithTenant`
- `apps/web/package.json` — modifié : ajout `@hookform/resolvers`
- `apps/web/src/components/ui/input.tsx` — créé
- `apps/web/src/app/(auth)/layout.tsx` — créé
- `apps/web/src/app/(auth)/register/page.tsx` — créé
- `apps/web/src/app/(auth)/login/page.tsx` — créé
