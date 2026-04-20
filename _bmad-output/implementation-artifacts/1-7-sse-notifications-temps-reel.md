# Story 1.7 : SSE — Notifications Temps Réel

Status: done

## Story

En tant que **vendeur**,
je veux recevoir des notifications instantanées dans le dashboard lorsqu'un événement se produit (nouvelle commande IA, alerte stock, etc.),
afin d'être informé en temps réel sans avoir à rafraîchir la page.

## Acceptance Criteria

1. **Étant donné** que le vendeur est connecté au dashboard, **Quand** le frontend établit une connexion `GET /api/v1/events/stream`, **Alors** un flux SSE est ouvert et maintenu, authentifié via le cookie `access_token` JWT (géré par le `JwtAuthGuard` global + `TenantMiddleware`)
2. **Étant donné** qu'un événement `order.created` est émis côté serveur via `EventsService.emit()`, **Quand** le flux SSE est actif pour ce `tenantId`, **Alors** l'événement arrive au frontend dans le format SSE : `event: order.created\ndata: {"tenantId":"...","payload":...,"timestamp":"..."}\n\n`
3. **Et** le hook React `useAgentEvents()` dans `apps/web/src/hooks/useAgentEvents.ts` gère la reconnexion automatique (délai 5s après `onerror`)
4. **Et** les 5 types d'événements supportés sont : `order.created`, `order.status_changed`, `stock.alert`, `agent.status_changed`, `conversation.handoff_required`
5. **Et** la notification parvient au vendeur en ≤ 30 secondes après l'émission (NFR3)
6. **Et** la déconnexion d'un client SSE ne provoque aucune fuite mémoire dans `EventsService`

## Tasks / Subtasks

- [x] Tâche 1 : Créer `EventsService` (AC: 2, 4, 6)
  - [x] Créer `apps/api/src/modules/events/events.service.ts`
  - [x] Implémenter un `Subject` global filtré par `tenantId` (pas de Map — voir Dev Notes pour le pattern exact)
  - [x] Méthode `getStream(tenantId: string): Observable<MessageEvent>` — filtre + map vers format SSE
  - [x] Méthode `emit(event: AgentEventType, tenantId: string, payload: unknown): void`
  - [x] Typer `AgentEventType` avec les 5 types d'événements dans `events.service.ts`

- [x] Tâche 2 : Créer `EventsController` (AC: 1, 2)
  - [x] Créer `apps/api/src/modules/events/events.controller.ts`
  - [x] Endpoint `@Sse('stream')` sur `@Controller('events')` — chemin final : `/api/v1/events/stream`
  - [x] Retourner `this.eventsService.getStream(tenantId)` — `tenantId` via `@CurrentTenant()`
  - [x] Ajouter `@ApiTags('events')` et `@ApiBearerAuth()` pour Swagger

- [x] Tâche 3 : Corriger `ResponseWrapperInterceptor` pour SSE (AC: 2) — **CRITIQUE**
  - [x] Modifier `apps/api/src/common/interceptors/response-wrapper.interceptor.ts`
  - [x] Injecter `Reflector` dans le constructeur
  - [x] Au début de `intercept()`, vérifier `Reflect.getMetadata('sse', context.getHandler())`
  - [x] Si `true`, retourner `next.handle()` sans wrapping (voir Dev Notes)

- [x] Tâche 4 : Créer `EventsModule` (AC: 1)
  - [x] Créer `apps/api/src/modules/events/events.module.ts`
  - [x] `providers: [EventsService]`, `controllers: [EventsController]`, `exports: [EventsService]`

- [x] Tâche 5 : Enregistrer `EventsModule` dans `AppModule` (AC: 1)
  - [x] Modifier `apps/api/src/app.module.ts` — ajouter `EventsModule` aux `imports` (après `QueuesModule`)

- [x] Tâche 6 : Créer le hook React `useAgentEvents` (AC: 3, 4)
  - [x] Créer `apps/web/src/hooks/useAgentEvents.ts`
  - [x] `'use client'` obligatoire — hooks React
  - [x] Utiliser `EventSource` natif avec `{ withCredentials: true }` — les cookies JWT sont envoyés automatiquement
  - [x] Implémenter reconnexion automatique (`setTimeout(connect, 5000)` dans `onerror`)
  - [x] Cleanup sur unmount : `source.close()` + `clearTimeout`
  - [x] Exposer callbacks typés pour les 5 événements (voir Dev Notes pour le pattern)

- [x] Tâche 7 : Écrire les tests unitaires (AC: 2, 3, 6)
  - [x] Créer `apps/api/src/modules/events/events.service.spec.ts`
    - [x] Tester `getStream()` : filtre correct par `tenantId` (pas de cross-tenant)
    - [x] Tester `emit()` : emission reçue uniquement par le tenant concerné
    - [x] Tester isolation multi-tenant : tenant A ne reçoit pas les événements de tenant B
  - [x] Créer `apps/api/src/modules/events/events.controller.spec.ts`
    - [x] Tester que `stream()` appelle `eventsService.getStream(tenantId)` avec le bon `tenantId`
  - [x] Vérifier full suite : `pnpm --filter @whatsell/api test` — 92/92 ✅

### Review Findings

- [x] [Review][Decision] D-01 — JWT access_token expire en 15min, reconnexion SSE échoue silencieusement : option B appliquée — ajout de `onAuthError?: () => void` + `maxAuthRetries` (défaut 3) dans `UseAgentEventsOptions`; après N échecs consécutifs, callback appelé et reconnexion stoppée
- [x] [Review][Decision] D-02 — ThrottlerGuard s'applique au endpoint SSE sans @SkipThrottle : `@SkipThrottle()` ajouté sur `EventsController`
- [x] [Review][Decision] D-03 — AgentEventType dupliqué dans events.service.ts et useAgentEvents.ts : déplacé dans `packages/shared/src/types/events.types.ts`, ré-exporté depuis index.ts, importé dans les deux apps
- [x] [Review][Patch] P-01 — JSON.parse sans try/catch dans chaque listener SSE [useAgentEvents.ts] — fonction `parseEventData()` avec try/catch + console.error ajoutée
- [x] [Review][Patch] P-02 — timestamp capturé dans map() et non dans emit() [events.service.ts] — timestamp déplacé dans `InternalEvent`, capturé dans `emit()`, test de cohérence inter-subscribers ajouté
- [x] [Review][Defer] DEF-01 — SSE bypass utilise clé metadata interne NestJS 'sse' [response-wrapper.interceptor.ts:35] — deferred, fonctionne en NestJS 11.x, risque à surveiller lors d'upgrade majeur
- [x] [Review][Defer] DEF-02 — Pas de backoff exponentiel ni cap de retry dans useAgentEvents [useAgentEvents.ts:75] — deferred, amélioration UX post-MVP
- [x] [Review][Defer] DEF-03 — Pas de limite sur les connexions SSE concurrentes [events.service.ts] — deferred, scaling Railway post-MVP
- [x] [Review][Defer] DEF-04 — Pas de @ApiResponse sur le endpoint SSE [events.controller.ts:14] — deferred, documentation non bloquante
- [x] [Review][Defer] DEF-05 — tenantId exposé dans le payload SSE [events.service.ts:27] — deferred, décision d'architecture à prendre séparément
- [x] [Review][Defer] DEF-06 — Race condition si enabled bascule pendant connect() [useAgentEvents.ts:34] — deferred, cas extrêmement rare, post-MVP

## Dev Notes

### ⚠️ Ce qui EXISTE DÉJÀ — NE PAS RECRÉER

| Fichier | Contenu existant | Action |
|---------|-----------------|--------|
| `apps/api/src/app.module.ts` | `AppModule` complet avec `QueuesModule` déjà importé | MODIFIER — ajouter `EventsModule` |
| `apps/api/src/common/guards/jwt-auth.guard.ts` | Guard global déjà appliqué dans `AppModule` | NE PAS MODIFIER — SSE automatiquement protégé |
| `apps/api/src/common/decorators/current-tenant.decorator.ts` | `@CurrentTenant()` lit `req.tenantId` | UTILISER tel quel |
| `apps/api/src/common/middleware/tenant.middleware.ts` | Injecte `req.tenantId` depuis cookie JWT | NE PAS MODIFIER |
| `apps/api/src/common/interceptors/response-wrapper.interceptor.ts` | Wrapping global `{ data }` | MODIFIER — ajouter bypass SSE |
| `apps/web/src/lib/api.ts` | Client HTTP centralisé | NE PAS UTILISER pour SSE — `EventSource` direct |
| `rxjs` | Déjà dans `apps/api/package.json` (`^7.8.0`) | UTILISER `Subject`, `Observable`, `filter`, `map` |

### ⚠️ CRITIQUE : `ResponseWrapperInterceptor` + SSE = Conflit

Le `ResponseWrapperInterceptor` global fait `map(result => ({ data: result }))` sur chaque emission. Pour SSE, chaque `MessageEvent` serait wrappé dans `{ data: MessageEvent }`, cassant complètement le protocole SSE (la structure finale serait `data: { data: { data: '...', type: 'order.created' } }` au lieu de `event: order.created\ndata: {...}`).

**Fix obligatoire dans `response-wrapper.interceptor.ts` :**

```typescript
import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class ResponseWrapperInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}  // ← AJOUTER

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // ← AJOUTER : bypass SSE (le décorateur @Sse() pose 'sse' = true sur le handler)
    const isSse = Reflect.getMetadata('sse', context.getHandler()) === true;
    if (isSse) return next.handle();

    return next.handle().pipe(
      map((result: unknown) => {
        if (isPaginatedResult(result)) return result;
        return { data: result };
      }),
    );
  }
}
```

**Attention** : puisque `ResponseWrapperInterceptor` est enregistré via `{ provide: APP_INTERCEPTOR, useClass: ... }` dans `AppModule`, NestJS résout ses dépendances automatiquement — ajouter `Reflector` au constructeur fonctionne sans changement de module.

### Pattern `EventsService` — Implémentation Exacte

Utiliser un seul `Subject` global filtré (pas de `Map<string, Subject>` pour éviter les fuites mémoire) :

```typescript
// apps/api/src/modules/events/events.service.ts
import { Injectable } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { MessageEvent } from '@nestjs/common';

export type AgentEventType =
  | 'order.created'
  | 'order.status_changed'
  | 'stock.alert'
  | 'agent.status_changed'
  | 'conversation.handoff_required';

interface InternalEvent {
  tenantId: string;
  event: AgentEventType;
  payload: unknown;
}

@Injectable()
export class EventsService {
  private readonly stream$ = new Subject<InternalEvent>();

  getStream(tenantId: string): Observable<MessageEvent> {
    return this.stream$.pipe(
      filter((e) => e.tenantId === tenantId),
      map((e): MessageEvent => ({
        data: JSON.stringify({
          tenantId: e.tenantId,
          payload: e.payload,
          timestamp: new Date().toISOString(),
        }),
        type: e.event,
      })),
    );
  }

  emit(event: AgentEventType, tenantId: string, payload: unknown): void {
    this.stream$.next({ tenantId, event, payload });
  }
}
```

**Pourquoi ce pattern** : un seul Subject = pas de fuites mémoire, pas de cleanup manuel. Le Subject est un singleton NestJS — il vit toute la durée du processus. Chaque abonné SSE subscribe/unsubscribe proprement via le cycle de vie de l'Observable.

### Pattern `EventsController` — Implémentation Exacte

```typescript
// apps/api/src/modules/events/events.controller.ts
import { Controller, Sse } from '@nestjs/common';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { EventsService } from './events.service';
import { CurrentTenant } from '../../common/decorators';

@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Sse('stream')
  stream(@CurrentTenant() tenantId: string): Observable<MessageEvent> {
    return this.eventsService.getStream(tenantId);
  }
}
```

**Note critique sur `@CurrentTenant()`** : ce décorateur lit `req.tenantId` mis par `TenantMiddleware`. Il fonctionne normalement pour SSE car le middleware s'exécute avant le handler.

### Pattern `useAgentEvents` — Implémentation Frontend

```typescript
// apps/web/src/hooks/useAgentEvents.ts
'use client';

import { useEffect, useRef } from 'react';

export type AgentEventType =
  | 'order.created'
  | 'order.status_changed'
  | 'stock.alert'
  | 'agent.status_changed'
  | 'conversation.handoff_required';

export interface AgentEventData {
  tenantId: string;
  payload: unknown;
  timestamp: string;
}

export interface UseAgentEventsOptions {
  onOrderCreated?: (data: AgentEventData) => void;
  onOrderStatusChanged?: (data: AgentEventData) => void;
  onStockAlert?: (data: AgentEventData) => void;
  onAgentStatusChanged?: (data: AgentEventData) => void;
  onConversationHandoffRequired?: (data: AgentEventData) => void;
  enabled?: boolean; // default true — permet de désactiver si non authentifié
}

export function useAgentEvents(options: UseAgentEventsOptions = {}): void {
  const { enabled = true } = options;
  // Stocker les handlers dans un ref pour éviter les re-subscriptions
  const handlersRef = useRef(options);
  handlersRef.current = options;

  useEffect(() => {
    if (!enabled) return;

    let source: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isClosed = false;

    function connect(): void {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
      source = new EventSource(`${baseUrl}/api/v1/events/stream`, {
        withCredentials: true, // OBLIGATOIRE — envoie le cookie access_token
      });

      source.addEventListener('order.created', (e: Event) => {
        const data = JSON.parse((e as MessageEvent).data) as AgentEventData;
        handlersRef.current.onOrderCreated?.(data);
      });

      source.addEventListener('order.status_changed', (e: Event) => {
        const data = JSON.parse((e as MessageEvent).data) as AgentEventData;
        handlersRef.current.onOrderStatusChanged?.(data);
      });

      source.addEventListener('stock.alert', (e: Event) => {
        const data = JSON.parse((e as MessageEvent).data) as AgentEventData;
        handlersRef.current.onStockAlert?.(data);
      });

      source.addEventListener('agent.status_changed', (e: Event) => {
        const data = JSON.parse((e as MessageEvent).data) as AgentEventData;
        handlersRef.current.onAgentStatusChanged?.(data);
      });

      source.addEventListener('conversation.handoff_required', (e: Event) => {
        const data = JSON.parse((e as MessageEvent).data) as AgentEventData;
        handlersRef.current.onConversationHandoffRequired?.(data);
      });

      source.onerror = () => {
        source?.close();
        if (!isClosed) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      };
    }

    connect();

    return () => {
      isClosed = true;
      source?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [enabled]);
}
```

**Pourquoi `handlersRef`** : évite de redémarrer la connexion SSE à chaque re-render si les callbacks changent (closures stables).

### Pattern `EventsModule`

```typescript
// apps/api/src/modules/events/events.module.ts
import { Module } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

@Module({
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],  // Exporté pour injection dans OrdersService, etc. plus tard
})
export class EventsModule {}
```

### Structure de Fichiers

```
apps/api/src/modules/events/
├── events.module.ts          ← CRÉER
├── events.controller.ts      ← CRÉER
├── events.service.ts         ← CRÉER
├── events.service.spec.ts    ← CRÉER
└── events.controller.spec.ts ← CRÉER

apps/web/src/hooks/
└── useAgentEvents.ts         ← CRÉER (remplace le .gitkeep)
```

### Anti-Patterns Interdits

- ❌ `new Map<string, Subject>()` pour les streams par tenant → Subject global filtré
- ❌ `apiClient()` ou `fetch()` pour SSE → `new EventSource(url, { withCredentials: true })`
- ❌ `source.onmessage` pour écouter les événements typés → `source.addEventListener('order.created', ...)`
- ❌ Oublier `ResponseWrapperInterceptor` bypass → le flux SSE sera cassé silencieusement
- ❌ `@CurrentUser()` pour obtenir le tenantId → `@CurrentTenant()` (lit `req.tenantId`)
- ❌ Passer `tenantId` en paramètre des méthodes `emit()` depuis l'intérieur des services → le passer depuis le contexte appelant
- ❌ `emit()` sans `tenantId` explicite → le Subject global sans filtrage enverrait des données cross-tenant

### Tests — Patterns Importants

```typescript
// events.service.spec.ts — Test isolation multi-tenant OBLIGATOIRE
it('should not deliver events of tenant A to tenant B', (done) => {
  const events: unknown[] = [];
  service.getStream('tenant-B').subscribe((e) => events.push(e));

  service.emit('order.created', 'tenant-A', { orderId: '123' });

  setTimeout(() => {
    expect(events).toHaveLength(0); // tenant B ne reçoit rien
    done();
  }, 50);
});
```

### Contexte Précédent — Patterns Story 1.6 à Réutiliser

- Pattern de module NestJS : `providers`, `exports` (voir `QueuesModule`)
- `ConfigService` injection si nécessaire
- Tests avec `@nestjs/testing` `Test.createTestingModule()`

### Références Techniques

- Architecture : `_bmad-output/planning-artifacts/architecture.md` — section "Notifications Temps Réel — Server-Sent Events"
- Epics : `_bmad-output/planning-artifacts/epics.md` — Story 1.7
- `@CurrentTenant()` : `apps/api/src/common/decorators/current-tenant.decorator.ts`
- `ResponseWrapperInterceptor` : `apps/api/src/common/interceptors/response-wrapper.interceptor.ts`
- `TenantMiddleware` : `apps/api/src/common/middleware/tenant.middleware.ts`

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Tâche 3 : `ResponseWrapperInterceptor` utilisait `new ResponseWrapperInterceptor()` sans argument dans les tests — ajout de `Reflector` mock + null-check sur `context.getHandler?.()` pour compatibilité

### Completion Notes List

- EventsService : Subject global unique filtré par tenantId — pas de Map, pas de fuites mémoire
- EventsController : @Sse('stream') + @CurrentTenant() — endpoint `/api/v1/events/stream` protégé par JwtAuthGuard global
- ResponseWrapperInterceptor : Reflector injecté, bypass SSE via `Reflect.getMetadata('sse', handler)` — 10 tests mis à jour (dont 2 nouveaux SSE)
- EventsModule : exporté pour injection dans les modules domaine futurs (orders, stocks…)
- useAgentEvents hook : EventSource withCredentials, handlersRef pour closure stable, reconnexion 5s, cleanup complet
- Suite complète : 92/92 tests, 0 régression

### File List

- apps/api/src/modules/events/events.service.ts (créé)
- apps/api/src/modules/events/events.service.spec.ts (créé)
- apps/api/src/modules/events/events.controller.ts (créé)
- apps/api/src/modules/events/events.controller.spec.ts (créé)
- apps/api/src/modules/events/events.module.ts (créé)
- apps/api/src/common/interceptors/response-wrapper.interceptor.ts (modifié)
- apps/api/src/common/interceptors/response-wrapper.interceptor.spec.ts (modifié)
- apps/api/src/app.module.ts (modifié)
- apps/web/src/hooks/useAgentEvents.ts (créé)
