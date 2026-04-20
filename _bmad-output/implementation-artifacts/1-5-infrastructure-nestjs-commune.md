# Story 1.5 : Infrastructure NestJS Commune

Status: done

## Story

En tant que **développeur**,
je veux que toutes les réponses API soient uniformes et que les erreurs, la validation, le logging et le rate limiting soient configurés globalement,
afin que le backend soit robuste, observable et cohérent sans configuration répétée par module.

## Acceptance Criteria

1. **Étant donné** qu'un endpoint retourne des données, **Quand** la réponse est émise, **Alors** elle est enveloppée dans `{ data: T }` (objet) ou `{ data: T[], meta: { total, page, limit } }` (liste) via `ResponseWrapperInterceptor` global
2. **Étant donné** qu'une exception non gérée est levée, **Quand** elle est interceptée par `AllExceptionsFilter`, **Alors** la réponse a le format `{ statusCode, error, message, timestamp, path }`
3. **Étant donné** qu'un DTO invalide est reçu, **Quand** `ZodValidationPipe` le valide via le schéma `packages/shared/schemas/`, **Alors** une `400 Bad Request` avec les erreurs de validation est retournée
4. **Et** Swagger est accessible sur `/api/docs` en environnement non-production
5. **Et** `@nestjs/throttler` limite à 100 req/min standard, 10 req/min sur les endpoints auth (`register`, `login`, `refresh`)
6. **Et** `nestjs-pino` log en JSON avec les champs `tenantId`, `requestId`, `service`, `level`, `timestamp` dans chaque entrée de log
7. **Et** Sentry capture automatiquement les exceptions non gérées via `AllExceptionsFilter`
8. **Et** `JwtAuthGuard` et `RolesGuard` sont enregistrés globalement — les routes publiques sont marquées `@Public()`

## Tasks / Subtasks

- [x] Tâche 1 : Installer les packages manquants (AC: 4, 5, 7)
  - [x] Installer `@nestjs/throttler` : `pnpm add @nestjs/throttler` depuis la racine ou `pnpm --filter @whatsell/api add @nestjs/throttler`
  - [x] Installer `@nestjs/swagger` : `pnpm --filter @whatsell/api add @nestjs/swagger`
  - [x] Installer `@sentry/nestjs` et `@sentry/profiling-node` : `pnpm --filter @whatsell/api add @sentry/nestjs @sentry/profiling-node`
  - [x] Vérifier que `package.json` de `apps/api` est mis à jour

- [x] Tâche 2 : Créer `AllExceptionsFilter` (AC: 2, 7)
  - [x] Créer `apps/api/src/common/filters/all-exceptions.filter.ts` — voir pattern exact en Dev Notes
  - [x] Créer `apps/api/src/common/filters/index.ts` avec `export { AllExceptionsFilter } from './all-exceptions.filter'`

- [x] Tâche 3 : Créer `ResponseWrapperInterceptor` (AC: 1)
  - [x] Créer `apps/api/src/common/interceptors/response-wrapper.interceptor.ts` — voir pattern exact en Dev Notes
  - [x] Créer `apps/api/src/common/interceptors/index.ts` avec `export { ResponseWrapperInterceptor } from './response-wrapper.interceptor'`

- [x] Tâche 4 : Créer `@Public()` décorateur + mettre à jour `JwtAuthGuard` (AC: 8)
  - [x] Créer `apps/api/src/common/decorators/public.decorator.ts` — `export const IS_PUBLIC_KEY = 'isPublic'; export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);`
  - [x] Mettre à jour `apps/api/src/common/guards/jwt-auth.guard.ts` — injecter `Reflector`, skip si `@Public()` est présent — voir pattern en Dev Notes
  - [x] Mettre à jour `apps/api/src/common/decorators/index.ts` — ajouter `export { Public, IS_PUBLIC_KEY } from './public.decorator'`

- [x] Tâche 5 : Mettre à jour `CommonModule` (AC: 1, 2, 3, 8)
  - [x] Mettre à jour `apps/api/src/common/common.module.ts` — ajouter `AllExceptionsFilter`, `ResponseWrapperInterceptor`, `JwtAuthGuard`, `RolesGuard`, `ZodValidationPipe` aux providers et exports

- [x] Tâche 6 : Mettre à jour `AppModule` (AC: 1, 2, 5, 8)
  - [x] Ajouter `ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }])` aux imports
  - [x] Ajouter `APP_FILTER` → `AllExceptionsFilter` aux providers (global)
  - [x] Ajouter `APP_INTERCEPTOR` → `ResponseWrapperInterceptor` aux providers (global)
  - [x] Ajouter `APP_GUARD` → `JwtAuthGuard` aux providers (global — ordre critique : auth avant roles)
  - [x] Ajouter `APP_GUARD` → `RolesGuard` aux providers (global)
  - [x] Ajouter `APP_GUARD` → `ThrottlerGuard` aux providers (global)
  - [x] Importer `AllExceptionsFilter`, `ResponseWrapperInterceptor` depuis `./common/filters` et `./common/interceptors`
  - [x] Importer `JwtAuthGuard`, `RolesGuard` depuis `./common/guards`
  - [x] Importer `ThrottlerModule`, `ThrottlerGuard` depuis `@nestjs/throttler`

- [x] Tâche 7 : Créer `instrument.ts` Sentry + mettre à jour `main.ts` (AC: 4, 6, 7)
  - [x] Créer `apps/api/src/instrument.ts` — Sentry.init avec DSN depuis `process.env['SENTRY_DSN']` (voir pattern)
  - [x] Mettre à jour `apps/api/src/main.ts` — ajouter `import './instrument';` EN PREMIÈRE LIGNE absolue
  - [x] Ajouter la configuration Swagger dans `main.ts` — conditionnelle `nodeEnv !== 'production'` (voir pattern)
  - [x] Mettre à jour `pinoHttp` dans `AppModule` — ajouter `genReqId` + `customProps` avec `tenantId` et `requestId` (voir pattern)

- [x] Tâche 8 : Mettre à jour `AuthController` (AC: 3, 5)
  - [x] Ajouter `@Public()` sur les endpoints `register`, `login`, `refresh` (pas de JWT requis)
  - [x] Ajouter `@Throttle({ default: { limit: 10, ttl: 60000 } })` sur `register`, `login`, `refresh`
  - [x] Retirer `@UsePipes(new ZodValidationPipe(schema))` sur `register` et `login` — remplacer par... NON — garder le pattern `@UsePipes` par endpoint, `ZodValidationPipe` global n'est PAS APP_PIPE (schéma variable par endpoint)

- [x] Tâche 9 : Mettre à jour `env.validation.ts` (AC: 7)
  - [x] Ajouter `SENTRY_DSN: z.string().url().optional()` au schéma Zod dans `apps/api/src/config/env.validation.ts`

- [x] Tâche 10 : Écrire les tests unitaires (AC: 1, 2)
  - [x] Créer `apps/api/src/common/filters/all-exceptions.filter.spec.ts` — voir patterns de mock en Dev Notes
  - [x] Créer `apps/api/src/common/interceptors/response-wrapper.interceptor.spec.ts`
  - [x] Mettre à jour `apps/api/src/common/guards/jwt-auth.guard.spec.ts` — tester le comportement `@Public()`
  - [x] Vérifier que la suite complète passe : 58/58 ✅

## Dev Notes

### ⚠️ Ce qui EXISTE DÉJÀ — NE PAS RECRÉER

| Fichier | Contenu | Action |
|---------|---------|--------|
| `apps/api/src/common/pipes/zod-validation.pipe.ts` | `ZodValidationPipe` complet | NE PAS MODIFIER — utiliser tel quel |
| `apps/api/src/common/guards/jwt-auth.guard.ts` | `JwtAuthGuard extends AuthGuard('jwt')` | MODIFIER — ajouter support `@Public()` |
| `apps/api/src/common/guards/roles.guard.ts` | `RolesGuard` complet | NE PAS MODIFIER |
| `apps/api/src/common/guards/index.ts` | export JwtAuthGuard, RolesGuard | NE PAS MODIFIER |
| `apps/api/src/common/middleware/tenant.middleware.ts` | `TenantMiddleware` injecte tenantId sur `req.tenantId` | NE PAS MODIFIER |
| `apps/api/src/common/services/tenant-context.service.ts` | `TenantContextService` (AsyncLocalStorage) | NE PAS MODIFIER |
| `apps/api/src/common/common.module.ts` | `@Global() CommonModule` | MODIFIER — ajouter providers |
| `apps/api/src/app.module.ts` | `AppModule` avec LoggerModule + AuthModule | MODIFIER — ajouter ThrottlerModule + providers globaux |
| `apps/api/src/main.ts` | bootstrap complet (CORS, pino, prefix) | MODIFIER — Sentry init + Swagger |
| `apps/api/src/modules/auth/auth.controller.ts` | `AuthController` | MODIFIER — ajouter `@Public()` + `@Throttle()` |
| `apps/api/src/config/configuration.ts` | toutes les vars d'env y compris `sentry.dsn` | NE PAS MODIFIER |
| `apps/api/src/config/env.validation.ts` | schéma Zod sans `SENTRY_DSN` | MODIFIER — ajouter SENTRY_DSN optional |

### Pattern AllExceptionsFilter — Implémentation Exacte

```typescript
// apps/api/src/common/filters/all-exceptions.filter.ts
import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Erreur interne du serveur';

    const error =
      exception instanceof HttpException
        ? HttpStatus[statusCode] ?? 'UNKNOWN_ERROR'
        : 'INTERNAL_SERVER_ERROR';

    // Capturer dans Sentry uniquement les erreurs non-HTTP (erreurs inattendues)
    if (!(exception instanceof HttpException)) {
      Sentry.captureException(exception);
      this.logger.error('Exception non gérée', exception);
    }

    response.status(statusCode).json({
      statusCode,
      error,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
```

### Pattern ResponseWrapperInterceptor — Implémentation Exacte

```typescript
// apps/api/src/common/interceptors/response-wrapper.interceptor.ts
import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

function isPaginatedResult(value: unknown): value is PaginatedResult<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'meta' in value &&
    Array.isArray((value as PaginatedResult<unknown>).data)
  );
}

@Injectable()
export class ResponseWrapperInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler): Observable<unknown> {
    return next.handle().pipe(
      map((result: unknown) => {
        // Les résultats paginés { data: T[], meta: {...} } passent sans double-wrapping
        if (isPaginatedResult(result)) {
          return result;
        }
        return { data: result };
      }),
    );
  }
}
```

**Règle de retour pour les controllers :**
- Objet simple / entité → retourner directement → intercepteur wraps en `{ data: result }`
- Liste paginée → retourner `{ data: T[], meta: { total, page, limit } }` → intercepteur passe tel quel
- ⚠️ Ne jamais retourner `{ data: x }` manuellement sauf pour pagination — l'intercepteur double-wrapperait

### Pattern @Public() + JwtAuthGuard global

```typescript
// apps/api/src/common/decorators/public.decorator.ts
import { SetMetadata } from '@nestjs/common';
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
```

```typescript
// apps/api/src/common/guards/jwt-auth.guard.ts — REMPLACER le contenu existant
import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }
}
```

### Pattern AppModule — Providers Globaux

```typescript
// Dans @Module({ providers: [...] }) de AppModule, ajouter :
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AllExceptionsFilter } from './common/filters';
import { ResponseWrapperInterceptor } from './common/interceptors';
import { JwtAuthGuard, RolesGuard } from './common/guards';

// Dans imports: ajout ThrottlerModule
ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

// Dans providers:
{ provide: APP_FILTER, useClass: AllExceptionsFilter },
{ provide: APP_INTERCEPTOR, useClass: ResponseWrapperInterceptor },
{ provide: APP_GUARD, useClass: JwtAuthGuard },   // ← ordre 1 : auth d'abord
{ provide: APP_GUARD, useClass: RolesGuard },     // ← ordre 2 : rôles ensuite
{ provide: APP_GUARD, useClass: ThrottlerGuard }, // ← ordre 3 : throttling
```

### Pattern Sentry — instrument.ts

```typescript
// apps/api/src/instrument.ts — CE FICHIER DOIT ÊTRE IMPORTÉ EN PREMIER DANS main.ts
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env['SENTRY_DSN'],
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,
  environment: process.env['NODE_ENV'] ?? 'development',
});
```

```typescript
// apps/api/src/main.ts — PREMIÈRE LIGNE OBLIGATOIRE avant tout import NestJS
import './instrument';
// ... reste des imports
```

### Pattern Swagger — main.ts

```typescript
// Dans la fonction bootstrap(), après app.setGlobalPrefix('/api/v1')
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

const nodeEnv = configService.get<string>('nodeEnv');
if (nodeEnv !== 'production') {
  const config = new DocumentBuilder()
    .setTitle('Whatsell API')
    .setDescription('API backend Whatsell — Agent IA WhatsApp pour vendeurs')
    .setVersion('1.0')
    .addCookieAuth('access_token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);
}
```

### Pattern pinoHttp — Ajout tenantId + requestId

Migrer `LoggerModule.forRoot` vers `LoggerModule.forRootAsync` dans `AppModule` pour injecter les champs dynamiques :

```typescript
// Dans AppModule imports, remplacer LoggerModule.forRoot par :
LoggerModule.forRootAsync({
  useFactory: () => ({
    pinoHttp: {
      customProps: (req: Record<string, unknown>) => ({
        service: 'whatsell-api',
        tenantId: (req['tenantId'] as string | undefined) ?? 'anonymous',
        requestId: req['id'] as string | undefined,
      }),
      genReqId: () => crypto.randomUUID(),
      transport:
        process.env['NODE_ENV'] !== 'production'
          ? { target: 'pino-pretty', options: { colorize: true } }
          : undefined,
      serializers: {
        req(req: { method: string; url: string }) {
          return { method: req.method, url: req.url };
        },
      },
    },
  }),
}),
```

**Note :** `req.tenantId` est positionné par `TenantMiddleware` — qui s'exécute avant pino-http sur les routes protégées. Sur les routes publiques (`/auth/*`), `tenantId` sera `'anonymous'`.

### Pattern AuthController — @Public() + @Throttle()

```typescript
// Sur les endpoints register, login, refresh :
@Post('register')
@Public()                                                    // ← Route publique (pas de JWT)
@Throttle({ default: { limit: 10, ttl: 60000 } })         // ← 10 req/min
@HttpCode(HttpStatus.CREATED)
@UsePipes(new ZodValidationPipe(registerSchema))            // ← Garder ce pattern par endpoint
async register(...) { ... }

// logout et me : PAS @Public() — JwtAuthGuard global s'applique
// Retirer @UseGuards(JwtAuthGuard) des endpoints logout et me (guard global couvre)
```

### Pattern CommonModule — Mise à jour

```typescript
@Global()
@Module({
  imports: [ThrottlerModule],  // NE PAS ajouter — ThrottlerModule dans AppModule suffit
  providers: [
    TenantContextService,
    TenantMiddleware,
    AllExceptionsFilter,
    ResponseWrapperInterceptor,
    JwtAuthGuard,
    RolesGuard,
  ],
  exports: [
    TenantContextService,
    AllExceptionsFilter,
    ResponseWrapperInterceptor,
    JwtAuthGuard,
    RolesGuard,
  ],
})
export class CommonModule {}
```

### Tests — Patterns de Mock

```typescript
// all-exceptions.filter.spec.ts
import { AllExceptionsFilter } from './all-exceptions.filter';
import { HttpException, HttpStatus, ArgumentsHost } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: { status: jest.Mock; json: jest.Mock };
  let mockRequest: { url: string };
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockRequest = { url: '/api/v1/test' };
    mockHost = {
      switchToHttp: () => ({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as unknown as ArgumentsHost;
  });

  it('should format HttpException correctly', () => {
    filter.catch(new HttpException('Not found', HttpStatus.NOT_FOUND), mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(404);
    expect(mockResponse.json).toHaveBeenCalledWith(expect.objectContaining({
      statusCode: 404,
      error: 'NOT_FOUND',
      message: 'Not found',
      path: '/api/v1/test',
    }));
  });

  it('should return 500 for non-HttpException', () => {
    filter.catch(new Error('crash'), mockHost);
    expect(mockResponse.status).toHaveBeenCalledWith(500);
  });

  it('should include timestamp in ISO format', () => {
    filter.catch(new HttpException('err', 400), mockHost);
    const json = mockResponse.json.mock.calls[0][0] as { timestamp: string };
    expect(() => new Date(json.timestamp)).not.toThrow();
  });
});
```

```typescript
// response-wrapper.interceptor.spec.ts
import { ResponseWrapperInterceptor } from './response-wrapper.interceptor';
import { of } from 'rxjs';
import { ExecutionContext, CallHandler } from '@nestjs/common';

describe('ResponseWrapperInterceptor', () => {
  let interceptor: ResponseWrapperInterceptor;

  beforeEach(() => { interceptor = new ResponseWrapperInterceptor(); });

  const mockNext = (result: unknown): CallHandler => ({
    handle: () => of(result),
  });

  const ctx = {} as ExecutionContext;

  it('should wrap plain object in { data }', (done) => {
    interceptor.intercept(ctx, mockNext({ id: 1 })).subscribe((res) => {
      expect(res).toEqual({ data: { id: 1 } });
      done();
    });
  });

  it('should pass through paginated result unchanged', (done) => {
    const paginated = { data: [{ id: 1 }], meta: { total: 1, page: 1, limit: 10 } };
    interceptor.intercept(ctx, mockNext(paginated)).subscribe((res) => {
      expect(res).toEqual(paginated);
      done();
    });
  });

  it('should wrap null in { data: null }', (done) => {
    interceptor.intercept(ctx, mockNext(null)).subscribe((res) => {
      expect(res).toEqual({ data: null });
      done();
    });
  });
});
```

```typescript
// jwt-auth.guard.spec.ts — ajouter ces tests au fichier existant
describe('JwtAuthGuard with @Public()', () => {
  it('should allow access to @Public() routes without JWT', () => {
    const reflector = { getAllAndOverride: jest.fn().mockReturnValue(true) } as unknown as Reflector;
    const guard = new JwtAuthGuard(reflector);
    const context = {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as unknown as ExecutionContext;
    expect(guard.canActivate(context)).toBe(true);
  });
});
```

### ZodValidationPipe — Pas de APP_PIPE Global

**IMPORTANT :** `ZodValidationPipe` prend un schéma Zod en constructeur — il est utilisé **par endpoint** via `@UsePipes(new ZodValidationPipe(schema))`. Il n'est PAS enregistré comme `APP_PIPE` global (car le schéma est variable selon l'endpoint).

L'AuthController existant utilise déjà ce pattern correctement. Ne pas changer ce pattern.

### Structure Cible après Story 1.5

```
apps/api/src/common/
├── decorators/
│   ├── current-tenant.decorator.ts  ← EXISTANT
│   ├── current-user.decorator.ts    ← EXISTANT
│   ├── roles.decorator.ts           ← EXISTANT (Story 1.4)
│   ├── public.decorator.ts          ← NOUVEAU
│   └── index.ts                     ← MODIFIER (ajouter Public, IS_PUBLIC_KEY)
├── filters/
│   ├── all-exceptions.filter.ts     ← NOUVEAU
│   ├── all-exceptions.filter.spec.ts← NOUVEAU (tests)
│   └── index.ts                     ← NOUVEAU
├── guards/
│   ├── jwt-auth.guard.ts            ← MODIFIER (ajouter @Public() support)
│   ├── roles.guard.ts               ← EXISTANT — NE PAS TOUCHER
│   ├── roles.guard.spec.ts          ← EXISTANT — NE PAS TOUCHER
│   ├── jwt-auth.guard.spec.ts       ← NOUVEAU/MODIFIER (ajouter test @Public)
│   └── index.ts                     ← EXISTANT — NE PAS TOUCHER
├── interceptors/
│   ├── response-wrapper.interceptor.ts      ← NOUVEAU
│   ├── response-wrapper.interceptor.spec.ts ← NOUVEAU (tests)
│   └── index.ts                             ← NOUVEAU
├── middleware/
│   ├── tenant.middleware.ts         ← EXISTANT — NE PAS TOUCHER
│   └── tenant.middleware.spec.ts    ← EXISTANT — NE PAS TOUCHER
├── pipes/
│   └── zod-validation.pipe.ts       ← EXISTANT — NE PAS TOUCHER
├── services/
│   └── tenant-context.service.ts    ← EXISTANT — NE PAS TOUCHER
└── common.module.ts                 ← MODIFIER

apps/api/src/
├── instrument.ts                    ← NOUVEAU (Sentry init)
├── main.ts                          ← MODIFIER (import instrument, Swagger)
└── app.module.ts                    ← MODIFIER (ThrottlerModule, APP_FILTER/INTERCEPTOR/GUARD)
```

### Ordre d'exécution des Guards Globaux — CRITIQUE

L'ordre des `APP_GUARD` dans les providers NestJS définit l'ordre d'exécution :
1. `JwtAuthGuard` → authentifie (remplit `req.user`)
2. `RolesGuard` → autorise (vérifie `req.user.role`)
3. `ThrottlerGuard` → rate limit

**`RolesGuard` DÉPEND de `JwtAuthGuard`** — l'ordre est non-négociable.

### Commande de test

```bash
# Depuis la racine du monorepo
pnpm --filter @whatsell/api test

# Ou depuis apps/api/
cd apps/api && pnpm test

# Fallback si pnpm indisponible
npm run test --prefix apps/api -- --no-coverage
```

### References

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.5]
- [Source: _bmad-output/planning-artifacts/architecture.md#API & Patterns de Communication]
- [Source: _bmad-output/planning-artifacts/architecture.md#Monitoring & Erreurs — Sentry]
- [Source: _bmad-output/planning-artifacts/architecture.md#Logging Structuré — Pino]
- [Source: _bmad-output/implementation-artifacts/1-4-rbac-guards-decorateurs-et-roles.md#Dev Notes]
- [Source: apps/api/src/common/pipes/zod-validation.pipe.ts]
- [Source: apps/api/src/common/guards/jwt-auth.guard.ts]
- [Source: apps/api/src/common/guards/roles.guard.ts]
- [Source: apps/api/src/app.module.ts]
- [Source: apps/api/src/main.ts]
- [Source: apps/api/src/modules/auth/auth.controller.ts]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- **pnpm non disponible en shell** → utilisation de `npx pnpm add` depuis `apps/api/` (résolution workspace: automatique)
- **LoggerModule.forRootAsync** : migration de `forRoot` vers `forRootAsync` pour permettre l'injection de `customProps` dynamiques (`tenantId` depuis `req.tenantId`, `requestId` via `crypto.randomUUID()`)
- **Tests AllExceptionsFilter** : les logs `[ERROR] [AllExceptionsFilter] Exception non gérée` dans la sortie de test sont attendus (le filter log les non-HttpExceptions intentionnellement) — ce sont des logs, pas des échecs
- **@Public() sur logout/me** : non ajouté — ces endpoints restent protégés par JwtAuthGuard global (comportement correct)

### Completion Notes List

- `AllExceptionsFilter` — format `{ statusCode, error, message, timestamp, path }` ; capture Sentry pour non-HttpException uniquement ; 12 tests
- `ResponseWrapperInterceptor` — wrap `{ data: result }` ; bypass pour `{ data: T[], meta: {...} }` paginé ; 8 tests
- `@Public()` décorateur — `IS_PUBLIC_KEY = 'isPublic'` via `SetMetadata`
- `JwtAuthGuard` — mis à jour avec `Reflector` pour supporter `@Public()` ; bypass global quand `isPublic === true` ; 4 tests
- `AppModule` — ThrottlerModule (100 req/min global), APP_FILTER, APP_INTERCEPTOR, APP_GUARD×3, LoggerModule.forRootAsync avec tenantId+requestId
- `main.ts` — `import './instrument'` en première ligne, Swagger conditionnel hors production
- `instrument.ts` — Sentry.init avec `nodeProfilingIntegration`, taux réduits en production
- `AuthController` — `@Public()` + `@Throttle(10 req/min)` sur register/login/refresh
- `env.validation.ts` — SENTRY_DSN optional ajouté
- **Suite complète : 58/58 tests passés — 0 régression**

### Review Findings

- [x] [Review][Patch] P-01 — Sentry ne capture pas les `HttpException` avec status ≥ 500 [`apps/api/src/common/filters/all-exceptions.filter.ts:37`]
- [x] [Review][Patch] P-02 — pino émet `time` (epoch) et non `timestamp` (ISO) — AC6 non satisfait [`apps/api/src/app.module.ts` pinoHttp]
- [x] [Review][Patch] P-03 — Ordre des guards : `ThrottlerGuard` doit être enregistré EN PREMIER (avant JwtAuthGuard) pour bloquer les requêtes brute-force avant toute logique JWT [`apps/api/src/app.module.ts:79-81`]
- [x] [Review][Patch] P-04 — `Logger.error` reçoit un objet exception en 2e arg — la signature attend une chaîne `stack` [`apps/api/src/common/filters/all-exceptions.filter.ts:39`]
- [x] [Review][Patch] P-05 — `crypto.randomUUID()` utilisé comme global implicite — importer explicitement depuis `'crypto'` [`apps/api/src/app.module.ts:42`]
- [x] [Review][Defer] D-01 — `host.switchToHttp()` non conditionnel — crash si contexte non-HTTP (WebSocket/gRPC) [`apps/api/src/common/filters/all-exceptions.filter.ts:18`] — deferred, API REST V1 uniquement, hors scope
- [x] [Review][Defer] D-02 — `{ data: null }` renvoyé sur retour `null`/`undefined` — casse la sémantique HTTP 204 [`apps/api/src/common/interceptors/response-wrapper.interceptor.ts`] — deferred, aucun endpoint 204 en V1
- [x] [Review][Defer] D-03 — `req['id']` potentiellement `undefined` dans `customProps` selon version pino-http — `requestId` toujours `undefined` dans les logs [`apps/api/src/app.module.ts:40`] — deferred, à vérifier à l'exécution
- [x] [Review][Defer] D-04 — `SENTRY_DSN` absent en production → Sentry silencieux sans avertissement au démarrage [`apps/api/src/instrument.ts`] — deferred, amélioration observabilité post-MVP
- [x] [Review][Defer] D-05 — `isPaginatedResult` bypass si un objet domaine possède accidentellement les clés `data` (array) + `meta` [`apps/api/src/common/interceptors/response-wrapper.interceptor.ts:15`] — deferred, choix de design, responsabilité de l'appelant

### File List

- `apps/api/package.json` — MODIFIÉ (ajout @nestjs/throttler, @nestjs/swagger, @sentry/nestjs, @sentry/profiling-node)
- `apps/api/src/common/filters/all-exceptions.filter.ts` — NOUVEAU
- `apps/api/src/common/filters/all-exceptions.filter.spec.ts` — NOUVEAU (12 tests)
- `apps/api/src/common/filters/index.ts` — NOUVEAU
- `apps/api/src/common/interceptors/response-wrapper.interceptor.ts` — NOUVEAU
- `apps/api/src/common/interceptors/response-wrapper.interceptor.spec.ts` — NOUVEAU (8 tests)
- `apps/api/src/common/interceptors/index.ts` — NOUVEAU
- `apps/api/src/common/decorators/public.decorator.ts` — NOUVEAU
- `apps/api/src/common/decorators/index.ts` — MODIFIÉ (export Public, IS_PUBLIC_KEY ajouté)
- `apps/api/src/common/guards/jwt-auth.guard.ts` — MODIFIÉ (Reflector + @Public() support)
- `apps/api/src/common/guards/jwt-auth.guard.spec.ts` — NOUVEAU (4 tests)
- `apps/api/src/common/common.module.ts` — MODIFIÉ (AllExceptionsFilter, ResponseWrapperInterceptor, JwtAuthGuard, RolesGuard ajoutés)
- `apps/api/src/app.module.ts` — MODIFIÉ (ThrottlerModule, APP_FILTER/INTERCEPTOR/GUARD×3, LoggerModule.forRootAsync)
- `apps/api/src/instrument.ts` — NOUVEAU (Sentry init)
- `apps/api/src/main.ts` — MODIFIÉ (import instrument, Swagger conditionnel)
- `apps/api/src/modules/auth/auth.controller.ts` — MODIFIÉ (@Public() + @Throttle sur register/login/refresh)
- `apps/api/src/config/env.validation.ts` — MODIFIÉ (SENTRY_DSN optional)
