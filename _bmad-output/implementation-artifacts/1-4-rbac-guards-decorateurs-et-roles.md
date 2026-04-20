# Story 1.4 : RBAC — Guards, Décorateurs & Rôles

Status: done

## Story

En tant que **développeur**,
je veux un système de contrôle d'accès par rôle opérationnel,
afin que chaque endpoint soit protégé selon les permissions du rôle de l'utilisateur authentifié.

## Acceptance Criteria

1. **Étant donné** qu'un endpoint est décoré avec `@Roles(Role.OWNER)`, **Quand** un utilisateur avec le rôle `SELLER` appelle cet endpoint, **Alors** la réponse est `403 Forbidden`
2. **Étant donné** qu'un endpoint est décoré avec `@Roles(Role.OWNER, Role.CO_MANAGER)`, **Quand** un utilisateur avec le rôle `CO_MANAGER` appelle cet endpoint, **Alors** la requête est autorisée et traitée
3. **Et** les rôles disponibles sont : `OWNER`, `CO_MANAGER`, `SELLER`, `ADMIN`
4. **Et** `@CurrentUser()` décorateur retourne l'utilisateur authentifié depuis le JWT *(déjà opérationnel — NE PAS MODIFIER)*
5. **Et** `JwtAuthGuard` est applicable comme guard par endpoint *(déjà opérationnel — NE PAS MODIFIER)*
6. **Étant donné** qu'un endpoint n'a PAS de décorateur `@Roles()`, **Quand** `RolesGuard` est actif, **Alors** l'accès est accordé sans vérification de rôle (pass-through)
7. **Et** `RolesGuard` est créé dans `common/guards/` et exporté — prêt à être enregistré globalement en Story 1.5

## Tasks / Subtasks

- [x] Tâche 1 : Créer le décorateur `@Roles()` (AC: 1, 2, 3)
  - [x] Créer `apps/api/src/common/decorators/roles.decorator.ts`
  - [x] Définir `ROLES_KEY = 'roles'` comme constante exportée
  - [x] Implémenter `@Roles(...roles: Role[])` via `SetMetadata(ROLES_KEY, roles)` depuis `@nestjs/common`
  - [x] Importer `Role` depuis `'../../../generated/prisma/client'` (cohérence avec `jwt.strategy.ts`)
  - [x] Mettre à jour `apps/api/src/common/decorators/index.ts` — ajouter `export { Roles, ROLES_KEY } from './roles.decorator'`

- [x] Tâche 2 : Créer `RolesGuard` (AC: 1, 2, 6, 7)
  - [x] Créer `apps/api/src/common/guards/roles.guard.ts`
  - [x] Implémenter `@Injectable() export class RolesGuard implements CanActivate`
  - [x] Injecter `Reflector` depuis `@nestjs/core`
  - [x] Logique `canActivate` :
    - Récupérer les rôles requis via `this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [context.getHandler(), context.getClass()])`
    - Si aucun rôle requis (`!requiredRoles || requiredRoles.length === 0`) → retourner `true` (pass-through, AC 6)
    - Extraire `request.user` depuis `context.switchToHttp().getRequest()`
    - Si pas de `request.user` → `throw new ForbiddenException('Accès refusé')`
    - Vérifier `requiredRoles.includes(request.user.role)` → retourner `true` ou `throw new ForbiddenException('Rôle insuffisant')`
  - [x] Mettre à jour `apps/api/src/common/guards/index.ts` — ajouter `export { RolesGuard } from './roles.guard'`

- [x] Tâche 3 : Écrire les tests unitaires (AC: 1, 2, 6)
  - [x] Créer `apps/api/src/common/guards/roles.guard.spec.ts`
  - [x] Mocker `Reflector` et `ExecutionContext`
  - [x] Test : aucun `@Roles()` → pass-through (retourne `true`)
  - [x] Test : `@Roles(Role.OWNER)` + user OWNER → retourne `true`
  - [x] Test : `@Roles(Role.OWNER)` + user SELLER → lève `ForbiddenException`
  - [x] Test : `@Roles(Role.OWNER, Role.CO_MANAGER)` + user CO_MANAGER → retourne `true`
  - [x] Test : `@Roles(Role.OWNER, Role.CO_MANAGER)` + user SELLER → lève `ForbiddenException`
  - [x] Test : `@Roles(Role.ADMIN)` + user ADMIN → retourne `true`
  - [x] Test : pas de `request.user` (non authentifié) → lève `ForbiddenException`
  - [x] Vérifier que tous les tests passent : `npm run test --prefix apps/api -- --no-coverage` → 33/33 ✅

## Dev Notes

### ⚠️ Ce qui EXISTE DÉJÀ — NE PAS RECRÉER

| Fichier existant | Contenu | Action |
|-----------------|---------|--------|
| `apps/api/src/common/guards/jwt-auth.guard.ts` | `JwtAuthGuard extends AuthGuard('jwt')` | NE PAS MODIFIER |
| `apps/api/src/common/guards/index.ts` | `export { JwtAuthGuard }` | MODIFIER — ajouter RolesGuard |
| `apps/api/src/common/decorators/current-user.decorator.ts` | `@CurrentUser()` lit `req.user` | NE PAS MODIFIER |
| `apps/api/src/common/decorators/current-tenant.decorator.ts` | `@CurrentTenant()` lit `req.tenantId` | NE PAS MODIFIER |
| `apps/api/src/common/decorators/index.ts` | `export CurrentTenant, CurrentUser` | MODIFIER — ajouter Roles, ROLES_KEY |
| `packages/shared/src/types/roles.types.ts` | `enum Role { OWNER, CO_MANAGER, SELLER, ADMIN }` | NE PAS MODIFIER |
| `apps/api/src/modules/auth/strategies/jwt.strategy.ts` | Interface `AuthUser { id, email, tenantId, role: Role }` | NE PAS MODIFIER |

### Import de `Role` — Source Canonique

`RolesGuard` et `@Roles()` doivent importer `Role` depuis :
```typescript
import { Role } from '../../../generated/prisma/client';
```
**Raison :** Cohérence avec `jwt.strategy.ts` qui fait de même. `packages/shared/src/types/roles.types.ts` est pour le frontend — même valeurs, mais deux sources distinctes par couche.

### Pattern RolesGuard — Implémentation Exacte

```typescript
import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../../generated/prisma/client';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { AuthUser } from '../../modules/auth/strategies/jwt.strategy';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true; // Pas de contrainte de rôle — pass-through
    }

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('Accès refusé');
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Rôle insuffisant');
    }

    return true;
  }
}
```

### Pattern @Roles() — Implémentation Exacte

```typescript
import { SetMetadata } from '@nestjs/common';
import { Role } from '../../../generated/prisma/client';

export const ROLES_KEY = 'roles';

export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
```

### Ordre des Guards — CRITIQUE

`RolesGuard` DÉPEND de `JwtAuthGuard` pour avoir `request.user` disponible. L'ordre d'application est :
1. `JwtAuthGuard` (authentification — vérifie le JWT et remplit `req.user`)
2. `RolesGuard` (autorisation — vérifie le rôle dans `req.user`)

Usage par endpoint :
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.OWNER)
async sensitiveEndpoint() { ... }
```

**Note :** En Story 1.5, `JwtAuthGuard` et `RolesGuard` seront enregistrés globalement. Cette story les crée uniquement — sans activation globale.

### Scope de cette Story

**Cette story crée UNIQUEMENT :**
- `roles.decorator.ts`
- `roles.guard.spec.ts`
- `roles.guard.ts`
- Mise à jour des barrels `index.ts`

**Cette story NE fait PAS :**
- ❌ Enregistrement global de `RolesGuard` dans `AppModule` — Story 1.5
- ❌ Modification de `CommonModule` — Story 1.5
- ❌ Guard `@Roles()` + `JwtAuthGuard` sur des endpoints métier réels — Stories futures
- ❌ Route admin `/api/v1/admin/*` bypassing tenant — Stories futures

### Tests — Pattern de Mock

```typescript
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { RolesGuard } from './roles.guard';
import { Role } from '../../../generated/prisma/client';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() } as unknown as jest.Mocked<Reflector>;
    guard = new RolesGuard(reflector);
  });

  const mockContext = (user?: object): ExecutionContext => ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: () => ({
      getRequest: () => ({ user }),
    }),
  } as unknown as ExecutionContext);

  it('should allow access when no roles defined', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(mockContext())).toBe(true);
  });
  // ... etc.
});
```

### Chemins d'import (depuis `common/guards/`)

- `Role` : `'../../../generated/prisma/client'`
- `ROLES_KEY` : `'../decorators/roles.decorator'`
- `AuthUser` : `'../../modules/auth/strategies/jwt.strategy'`

### Commande de test

```bash
# Depuis la racine du monorepo
pnpm --filter @whatsell/api test

# Ou directement depuis apps/api/
cd apps/api && pnpm test
```

### Project Structure Notes

Structure cible après cette story :
```
apps/api/src/common/
├── decorators/
│   ├── current-tenant.decorator.ts  ← EXISTANT — NE PAS TOUCHER
│   ├── current-user.decorator.ts    ← EXISTANT — NE PAS TOUCHER
│   ├── roles.decorator.ts           ← NOUVEAU
│   └── index.ts                     ← MODIFIER (ajouter Roles, ROLES_KEY)
├── guards/
│   ├── jwt-auth.guard.ts            ← EXISTANT — NE PAS TOUCHER
│   ├── roles.guard.ts               ← NOUVEAU
│   ├── roles.guard.spec.ts          ← NOUVEAU (tests)
│   └── index.ts                     ← MODIFIER (ajouter RolesGuard)
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.4]
- [Source: _bmad-output/planning-artifacts/architecture.md#RBAC — Guards & Decorators NestJS]
- [Source: _bmad-output/implementation-artifacts/1-3-authentification-jwt-httponly-et-refresh-token.md#Dev Notes]
- [Source: apps/api/src/common/guards/jwt-auth.guard.ts]
- [Source: apps/api/src/modules/auth/strategies/jwt.strategy.ts]
- [Source: packages/shared/src/types/roles.types.ts]
- [Source: apps/api/src/common/decorators/index.ts]

### Review Findings

- [x] [Review][Patch] P-02 — Test manquant : `@Roles(OWNER)` + user ADMIN → `ForbiddenException` (confirme qu'ADMIN est un rôle plat, pas un super-rôle) [`apps/api/src/common/guards/roles.guard.spec.ts`]
- [x] [Review][Patch] P-01 — `UnauthorizedException` (401) au lieu de `ForbiddenException` (403) quand `user` est absent avec des rôles requis [`apps/api/src/common/guards/roles.guard.ts:24`]
- [x] [Review][Defer] D-02 — Enregistrement global de `RolesGuard` non présent [`apps/api/src/common/guards/roles.guard.ts`] — deferred, prévu Story 1.5 par design
- [x] [Review][Defer] D-03 — Contextes non-HTTP (WebSocket, GraphQL) : `switchToHttp()` non conditionnel [`apps/api/src/common/guards/roles.guard.ts:21`] — deferred, API REST uniquement en V1, hors scope
- [x] [Review][Defer] D-04 — Validation de rôle non scopée au `tenantId` — deferred, isolation tenant gérée par `TenantMiddleware`, hors scope RBAC Story 1.4
- [x] [Review][Defer] D-05 — Architecture mono-rôle par utilisateur (`user.role` scalaire) — deferred, conception V1 délibérée, un rôle par user

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- **Role type (Prisma)** : `Role` dans `generated/prisma/enums.ts` est un `const` object + type union (`'OWNER' | 'CO_MANAGER' | 'SELLER' | 'ADMIN'`), pas un enum TypeScript natif. `.includes()` fonctionne sans problème avec ce pattern.
- **Commande de test** : `pnpm` non disponible dans l'environnement shell → `npm run test --prefix apps/api -- --no-coverage` utilisé à la place.

### Completion Notes List

- `roles.decorator.ts` : `ROLES_KEY = 'roles'` + `Roles(...roles: Role[])` via `SetMetadata` — importation `Role` depuis `generated/prisma/client` (cohérence avec `jwt.strategy.ts`)
- `roles.guard.ts` : `RolesGuard implements CanActivate` — `Reflector.getAllAndOverride`, pass-through si pas de rôles requis, `ForbiddenException` si rôle manquant ou user absent
- Barrels mis à jour : `decorators/index.ts` (+ Roles, ROLES_KEY) et `guards/index.ts` (+ RolesGuard)
- **8 tests unitaires** `roles.guard.spec.ts` : pass-through, OWNER autorisé, CO_MANAGER sur multi-rôles, SELLER refusé x2, ADMIN autorisé, user absent refusé
- **Suite complète : 33/33 tests passés — 0 régression**

### File List

- `apps/api/src/common/decorators/roles.decorator.ts` — NOUVEAU
- `apps/api/src/common/decorators/index.ts` — MODIFIÉ (export Roles, ROLES_KEY ajouté)
- `apps/api/src/common/guards/roles.guard.ts` — NOUVEAU
- `apps/api/src/common/guards/roles.guard.spec.ts` — NOUVEAU (8 tests)
- `apps/api/src/common/guards/index.ts` — MODIFIÉ (export RolesGuard ajouté)
