# Story 1.3 : Authentification JWT httpOnly & Refresh Token

Status: done

## Story

En tant que **vendeur**,
je veux pouvoir m'inscrire, me connecter et rester authentifié de façon sécurisée,
afin que mes données commerciales soient protégées et accessibles uniquement depuis mon compte.

## Acceptance Criteria

1. `POST /api/v1/auth/register` avec email + mot de passe valides → compte Tenant + User créés, deux cookies httpOnly posés : `access_token` (15 min) et `refresh_token` (7j), mot de passe haché bcrypt (salt ≥ 10 rounds)
2. `POST /api/v1/auth/login` avec credentials valides → deux cookies httpOnly posés (mêmes règles)
3. `POST /api/v1/auth/login` avec mauvais password ou email inexistant → `401 Unauthorized` (message générique — ne pas révéler si l'email existe)
4. `POST /api/v1/auth/refresh` avec refresh token valide → nouveau `access_token` émis, `refresh_token` tourné (ancien invalidé en base), deux cookies mis à jour
5. `POST /api/v1/auth/refresh` avec refresh token invalide/expiré/révoqué → `401 Unauthorized`, cookies non mis à jour
6. `POST /api/v1/auth/logout` → les deux cookies sont effacés côté serveur (`maxAge: 0`), `refreshTokenHash` mis à `null` en base
7. `GET /api/v1/auth/me` protégé par `JwtAuthGuard` → retourne `{ data: { id, email, role, tenantId } }` ou `401` si token absent/invalide
8. Tous les cookies : `httpOnly: true`, `secure: true`, `sameSite: 'strict'` — inaccessibles depuis JavaScript
9. `JwtAuthGuard` applicable par endpoint (`@UseGuards(JwtAuthGuard)`) — guard global NON activé dans cette story (viendra en 1.5)
10. `@CurrentUser()` décorateur retourne l'objet `{ id, email, role, tenantId }` depuis le JWT dans n'importe quel controller protégé

## Tasks / Subtasks

- [x] Tâche 1 : Installer les dépendances auth (AC: 1–10)
  - [x] Installer dans `apps/api` : `pnpm add @nestjs/passport @nestjs/jwt passport passport-jwt bcryptjs`
  - [x] Installer les types dev : `pnpm add -D @types/passport-jwt @types/bcryptjs`
  - [x] Vérifier que `apps/api/package.json` reflète les nouvelles dépendances

- [x] Tâche 2 : Créer la Passport JWT Strategy (AC: 7, 9, 10)
  - [x] Créer `apps/api/src/modules/auth/strategies/jwt.strategy.ts`
  - [x] Étend `PassportStrategy(Strategy)` depuis `passport-jwt`
  - [x] Extraction token depuis cookie `access_token` via `ExtractJwt.fromExtractors([(req) => req?.cookies?.access_token])`
  - [x] Secret depuis `configService.get<string>('jwt.secret')`
  - [x] Payload validé : `{ sub: string, email: string, tenantId: string, role: Role, type: 'access' }`
  - [x] `validate()` retourne `{ id: sub, tenantId, role, email }` — cet objet est injecté dans `req.user`
  - [x] Rejeter si `payload.type !== 'access'` avec `UnauthorizedException`

- [x] Tâche 3 : Créer `JwtAuthGuard` et décorateur `@CurrentUser()` (AC: 7, 9, 10)
  - [x] Créer `apps/api/src/common/guards/jwt-auth.guard.ts` — étend `AuthGuard('jwt')` depuis `@nestjs/passport`
  - [x] Créer `apps/api/src/common/decorators/current-user.decorator.ts` — lit `req.user` via `ExecutionContext`
  - [x] Exporter `@CurrentUser()` depuis `apps/api/src/common/decorators/index.ts` (fichier existant — export ajouté)
  - [x] Créer `apps/api/src/common/guards/index.ts` — exporte `JwtAuthGuard`

- [x] Tâche 4 : Créer `AuthRepository` (AC: 1–6)
  - [x] Créer `apps/api/src/modules/auth/auth.repository.ts`
  - [x] Injecter `PrismaService` (déjà global — pas besoin de re-importer `PrismaModule`)
  - [x] Méthodes :
    - `findUserByEmail(email: string): Promise<User | null>` — sans filtre tenant (login cross-tenant)
    - `findUserById(id: string): Promise<User | null>`
    - `createTenantAndUser(data: { email, passwordHash, tenantName, tenantSlug }): Promise<User>` — transaction Prisma atomique
    - `updateRefreshTokenHash(userId: string, hash: string | null): Promise<void>`
  - [x] **JAMAIS** de logique métier dans le repository — uniquement du Prisma

- [x] Tâche 5 : Créer `AuthService` (AC: 1–8)
  - [x] Créer `apps/api/src/modules/auth/auth.service.ts`
  - [x] Injecter `AuthRepository`, `JwtService` (`@nestjs/jwt`), `ConfigService`
  - [x] Méthode `register(dto: RegisterDto)` — vérifie unicité email, hache bcrypt(10), crée Tenant+User en transaction, génère tokens
  - [x] Méthode `login(dto: LoginDto)` — message générique sur identifiants invalides, `bcrypt.compare`, génère tokens
  - [x] Méthode `refresh(rawRefreshToken: string)` — vérifie signature JWT, type 'refresh', user actif, jti bcrypt.compare, rotation
  - [x] Méthode `logout(userId: string)` — met refreshTokenHash à null
  - [x] Méthode privée `generateTokens(user)` — access JWT (15min), refresh JWT (7j) avec jti aléatoire, hash jti en base

- [x] Tâche 6 : Créer `AuthController` (AC: 1–8)
  - [x] Créer `apps/api/src/modules/auth/auth.controller.ts`
  - [x] `POST /auth/register` — ZodValidationPipe(registerSchema), setCookies, 201
  - [x] `POST /auth/login` — ZodValidationPipe(loginSchema), setCookies, 200
  - [x] `POST /auth/refresh` — extrait cookie, refresh, setCookies, 200
  - [x] `POST /auth/logout` — @UseGuards(JwtAuthGuard), clearCookie x2, logout service
  - [x] `GET /auth/me` — @UseGuards(JwtAuthGuard), @CurrentUser(), retourne AuthUser
  - [x] `setCookies()` — httpOnly, secure, sameSite:'strict', maxAge en ms

- [x] Tâche 7 : Créer `AuthModule` et l'importer dans `AppModule` (AC: 1–10)
  - [x] Créer `apps/api/src/modules/auth/auth.module.ts`
  - [x] `JwtModule.registerAsync()` — secret depuis ConfigService
  - [x] `PassportModule.register({ defaultStrategy: 'jwt' })`
  - [x] Déclarer et exporter : AuthController, AuthService, AuthRepository, JwtStrategy, JwtAuthGuard
  - [x] Importer `AuthModule` dans `apps/api/src/app.module.ts`

- [x] Tâche 8 : ZodValidationPipe créé et appliqué localement (AC: 1–3)
  - [x] Créer `apps/api/src/common/pipes/zod-validation.pipe.ts` (minimal, refactorisé global en Story 1.5)
  - [x] Appliqué via `@UsePipes(new ZodValidationPipe(registerSchema))` sur register et login

- [x] Tâche 9 : Écrire les tests unitaires (AC: 1–8)
  - [x] Créer `apps/api/src/modules/auth/auth.service.spec.ts`
  - [x] `register()` — succès : crée tenant+user, hache password, génère tokens
  - [x] `register()` — email déjà pris : lève `ConflictException`
  - [x] `register()` — vérifie bcrypt salt 10
  - [x] `login()` — succès : valide password, retourne tokens
  - [x] `login()` — mauvais password : lève `UnauthorizedException` (message générique)
  - [x] `login()` — email inexistant : lève `UnauthorizedException` (même message)
  - [x] `login()` — user inactif : lève `UnauthorizedException`
  - [x] `refresh()` — token valide : invalide l'ancien jti, retourne nouveaux tokens
  - [x] `refresh()` — jti ne matche pas (token révoqué) : lève `UnauthorizedException`
  - [x] `refresh()` — JWT invalide/expiré : lève `UnauthorizedException`
  - [x] `logout()` — met `refreshTokenHash` à null
  - [x] **25/25 tests passés — 0 régression**

### Review Findings

- [x] [Review][Patch] P-01 — Tenant slug : entropie 3 octets trop faible → porté à 8 octets (16 chars hex) [`apps/api/src/modules/auth/auth.service.ts:52`]
- [x] [Review][Patch] P-02 — Fallback `?? ''` JWT secret → `configService.getOrThrow()` ; mock test mis à jour [`apps/api/src/modules/auth/auth.service.ts:86,122`, `apps/api/src/modules/auth/strategies/jwt.strategy.ts:32`]
- [x] [Review][Defer] D-01 — Race condition refresh token rotation : deux requêtes concurrentes avec le même token peuvent toutes deux passer avant que le hash soit mis à jour — nécessite Redis ou optimistic locking [`apps/api/src/modules/auth/auth.service.ts:85-115`] — deferred, nécessite infrastructure Redis (Story à définir)
- [x] [Review][Defer] D-02 — Pas de rate limiting sur les endpoints auth — prévu Story 1.5 [`apps/api/src/modules/auth/auth.controller.ts`] — deferred, pre-existing
- [x] [Review][Defer] D-03 — `secure:true` sur cookies bloque le développement local HTTP — voulu par spec (NFR7), dev via Railway staging ou tunnel HTTPS [`apps/api/src/modules/auth/auth.controller.ts:22`] — deferred, by design
- [x] [Review][Defer] D-04 — Access token reste valide 15min après logout (pas de blocklist Redis) — explicitement déféré depuis Story 1.2 (D-03) [`apps/api/src/modules/auth/auth.service.ts:108`] — deferred, pre-existing
- [x] [Review][Defer] D-05 — `GET /auth/me` retourne `AuthUser` non-wrappé — `ResponseWrapperInterceptor` global viendra en Story 1.5 [`apps/api/src/modules/auth/auth.controller.ts:90`] — deferred, pre-existing

## Dev Notes

### Dépendances à installer (apps/api)

```bash
# Runtime
pnpm add @nestjs/passport @nestjs/jwt passport passport-jwt bcryptjs

# Dev (types)
pnpm add -D @types/passport-jwt @types/bcryptjs
```

**Utiliser `bcryptjs` (pure JS) — pas `bcrypt` (natif C++)** : évite les problèmes de compilation sur Windows/Railway sans configuration supplémentaire.

### Schémas Zod partagés — DÉJÀ EXISTANTS

`packages/shared/src/schemas/auth.schema.ts` contient déjà `registerSchema` et `loginSchema`. **Ne pas recréer.** Importer directement :

```typescript
import { registerSchema, loginSchema, RegisterDto, LoginDto } from '@whatsell/shared';
```

### Structure de Fichiers Cible

```
apps/api/src/
├── common/
│   ├── decorators/
│   │   ├── current-tenant.decorator.ts  ← EXISTANT (ne pas modifier)
│   │   ├── current-user.decorator.ts    ← NOUVEAU
│   │   └── index.ts                     ← MODIFIER : ajouter export CurrentUser
│   ├── guards/
│   │   ├── jwt-auth.guard.ts            ← NOUVEAU
│   │   └── index.ts                     ← NOUVEAU
│   └── pipes/
│       └── zod-validation.pipe.ts       ← NOUVEAU (utilisé en local, refactorisé en 1.5)
└── modules/
    └── auth/
        ├── auth.module.ts               ← NOUVEAU
        ├── auth.controller.ts           ← NOUVEAU
        ├── auth.service.ts              ← NOUVEAU
        ├── auth.repository.ts           ← NOUVEAU
        ├── auth.service.spec.ts         ← NOUVEAU
        └── strategies/
            └── jwt.strategy.ts          ← NOUVEAU
```

### Payload JWT — Format Imposé par TenantMiddleware Existant

Le `TenantMiddleware` (Story 1.2, **NE PAS MODIFIER**) décode déjà le JWT et lit `payload.tenantId`. Le payload du JWT **doit contenir** :

```typescript
interface JwtPayload {
  sub: string;      // userId
  email: string;    // pour @CurrentUser() et /me endpoint
  tenantId: string; // lu par TenantMiddleware existant
  role: Role;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}
```

### Refresh Token — Architecture (JWT avec jti)

Le refresh token est un **JWT signé** contenant un `jti` (JWT ID) aléatoire :
- Côté client : cookie httpOnly contenant le JWT refresh
- Côté serveur : `user.refreshTokenHash = bcrypt.hash(jti, 10)`
- Validation : `bcrypt.compare(payload.jti, user.refreshTokenHash)`
- Rotation : nouveau `jti` généré → hash mis à jour → ancien jti inutilisable

### Décision — expiresIn numérique (pas StringValue)

`@types/jsonwebtoken` utilise le type `StringValue` de `ms` pour `expiresIn`. TypeScript strict ne peut pas inférer qu'une `string` générique satisfait ce template literal. **Solution retenue** : constantes numériques en secondes :
```typescript
const ACCESS_TOKEN_TTL_S = 15 * 60;           // 900 s
const REFRESH_TOKEN_TTL_S = 7 * 24 * 60 * 60; // 604800 s
```

### Cookie Options — Exact

```typescript
const COOKIE_BASE = { httpOnly: true, secure: true, sameSite: 'strict' as const };
res.cookie('access_token', accessToken, { ...COOKIE_BASE, maxAge: 15 * 60 * 1000 });
res.cookie('refresh_token', refreshToken, { ...COOKIE_BASE, maxAge: 7 * 24 * 60 * 60 * 1000 });
```

### Chemins d'import Prisma (baseUrl: "./")

Depuis `src/modules/auth/`:
- `'../../../generated/prisma/client'` (3 niveaux pour atteindre `apps/api/`)

Depuis `src/modules/auth/strategies/`:
- `'../../../../generated/prisma/client'` (4 niveaux)

### Patterns Existants à Réutiliser (NE PAS Réinventer)

| Pattern | Fichier existant | Usage |
|---------|-----------------|-------|
| `PrismaService` | `src/prisma/prisma.service.ts` | Injecter directement (module global) |
| `ConfigService` | `@nestjs/config` | Lire `jwt.secret`, `jwt.accessExpiresIn`, etc. |
| `@CurrentTenant()` | `src/common/decorators/current-tenant.decorator.ts` | Référence pour créer `@CurrentUser()` |
| cookie-parser | déjà dans `main.ts` | `req.cookies` disponible partout |
| TenantMiddleware | `src/common/middleware/tenant.middleware.ts` | Routes auth déjà exclues (`auth/login`, `auth/register`, `auth/refresh`) |
| `HttpException` | NestJS natif | `throw new ConflictException()`, `throw new UnauthorizedException()` — jamais `throw new Error()` |

### Variables d'Environnement (déjà configurées)

```
JWT_SECRET=<min 32 chars>         # Validé dans env.validation.ts
JWT_ACCESS_EXPIRES_IN=15m         # Via configService.get('jwt.accessExpiresIn')
JWT_REFRESH_EXPIRES_IN=7d         # Via configService.get('jwt.refreshExpiresIn')
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.3]
- [Source: _bmad-output/planning-artifacts/architecture.md#Authentification & Sécurité]
- [Source: _bmad-output/planning-artifacts/architecture.md#Arborescence complète apps/api]
- [Source: packages/shared/src/schemas/auth.schema.ts]
- [Source: apps/api/src/config/configuration.ts#jwt]
- [Source: apps/api/prisma/schema.prisma#model User]
- [Source: _bmad-output/implementation-artifacts/1-2-schema-prisma-et-isolation-multi-tenant.md#Dev Notes]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- **expiresIn StringValue** : `@types/jsonwebtoken@9.0.10` utilise `StringValue` de `ms` — TypeScript strict interdit d'assigner `string` à ce type template literal. Résolution : constantes numériques en secondes (`ACCESS_TOKEN_TTL_S = 900`).
- **Chemins Prisma** : depuis `src/modules/auth/`, il faut 3 niveaux (`../../../`) pour atteindre `apps/api/generated/`. Depuis `strategies/`, 4 niveaux (`../../../../`).
- **Refresh token architecture** : le story spec décrivait un token opaque (randomBytes) incompatible avec `jwtService.verify()`. Décision retenue : JWT refresh avec `jti` aléatoire hashé en base — permet la vérification par signature + la rotation.
- **pnpm workspace filter** : `--filter @whatsell/api` ne fonctionne pas depuis la racine — utiliser `cd apps/api && pnpm add ...` directement.
- **@types/bcryptjs** stub : deprecated (bcryptjs fournit ses propres types) — installé mais inoffensif.

### Completion Notes List

- `AuthModule` créé avec `JwtModule.registerAsync`, `PassportModule`, strategy, guard, repository, service, controller
- `JwtStrategy` extrait le token depuis cookie `access_token`, valide `type === 'access'`, retourne `AuthUser`
- `JwtAuthGuard` étend `AuthGuard('jwt')` — appliqué par endpoint sur `/logout` et `/me`
- `@CurrentUser()` décorateur lit `req.user` (injecté par Passport)
- `AuthRepository` : 4 méthodes, accès Prisma uniquement, transaction atomique pour `createTenantAndUser()`
- `AuthService` : register, login, refresh (rotation jti), logout, generateTokens (access + refresh JWT)
- `AuthController` : 5 endpoints, cookies httpOnly/secure/sameSite:strict, ZodValidationPipe local
- `ZodValidationPipe` minimal créé dans `common/pipes/` (sera globalisé en Story 1.5)
- **25/25 tests** : 11 nouveaux tests AuthService + 14 existants — 0 régression
- TypeScript strict : `tsc --noEmit` propre

### File List

- `apps/api/src/modules/auth/strategies/jwt.strategy.ts` — NOUVEAU
- `apps/api/src/modules/auth/auth.repository.ts` — NOUVEAU
- `apps/api/src/modules/auth/auth.service.ts` — NOUVEAU
- `apps/api/src/modules/auth/auth.service.spec.ts` — NOUVEAU (11 tests)
- `apps/api/src/modules/auth/auth.controller.ts` — NOUVEAU
- `apps/api/src/modules/auth/auth.module.ts` — NOUVEAU
- `apps/api/src/common/guards/jwt-auth.guard.ts` — NOUVEAU
- `apps/api/src/common/guards/index.ts` — NOUVEAU
- `apps/api/src/common/decorators/current-user.decorator.ts` — NOUVEAU
- `apps/api/src/common/decorators/index.ts` — MODIFIÉ (export CurrentUser ajouté)
- `apps/api/src/common/pipes/zod-validation.pipe.ts` — NOUVEAU
- `apps/api/src/app.module.ts` — MODIFIÉ (import AuthModule)
- `apps/api/package.json` — MODIFIÉ (@types/passport-jwt, @types/bcryptjs ajoutés en devDependencies)
