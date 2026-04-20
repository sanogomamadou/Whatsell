# Story 1.6 : Queue BullMQ + Redis

Status: done

## Story

En tant que **développeur**,
je veux une infrastructure de queues BullMQ + Redis opérationnelle,
afin que les traitements asynchrones (webhooks WhatsApp, alertes stock, etc.) puissent être absorbés sans perte de message.

## Acceptance Criteria

1. **Étant donné** que Redis est provisionné (Railway ou local), **Quand** l'application NestJS démarre, **Alors** la connexion Redis est établie et les queues suivantes sont initialisées : `whatsapp-messages`, `stock-alerts`, `advisor-alerts`, `trial-expiry`, `whatsapp-health-check`
2. **Étant donné** qu'un job est ajouté à une queue, **Quand** le processor correspondant le traite et échoue, **Alors** le job est retenté automatiquement (max 3 tentatives, backoff exponentiel — 1s, 2s, 4s)
3. **Et** après 3 échecs, le job est logué en dead-letter avec contexte complet : `queue`, `jobId`, `jobName`, `data`, `attemptsMade`, `error.message`, `timestamp` (NFR20)
4. **Et** chaque queue a son processor stub dédié `{domain}.processor.ts` dans `apps/api/src/queues/processors/`
5. **Et** un `QueuesService` injectable expose des méthodes typées pour enqueuer des jobs depuis n'importe quel module
6. **Et** `REDIS_URL` est requis (non optionnel) dans `env.validation.ts` — le serveur refuse de démarrer sans

## Tasks / Subtasks

- [x] Tâche 1 : Installer les packages (AC: 1)
  - [x] `pnpm --filter @whatsell/api add @nestjs/bullmq bullmq` — vérifier que `package.json` de `apps/api` est mis à jour avec les deux packages
  - [x] Vérifier la compatibilité : `@nestjs/bullmq` ≥ 10.x (compatible NestJS 11), `bullmq` ≥ 5.x

- [x] Tâche 2 : Mettre à jour `env.validation.ts` (AC: 6)
  - [x] Changer `REDIS_URL` de `.optional()` vers requis : `z.string().url('REDIS_URL doit être une URL valide')` (sans `.optional()`)
  - [x] Fichier : `apps/api/src/config/env.validation.ts` ligne 19 — supprimer `.optional()`

- [x] Tâche 3 : Créer `QueuesModule` avec connexion BullMQ globale (AC: 1)
  - [x] Créer `apps/api/src/queues/queues.module.ts` — voir pattern exact en Dev Notes
  - [x] `BullModule.forRootAsync()` avec `ConfigService` → `config.get<string>('redis.url')`
  - [x] `BullModule.registerQueue()` pour les 5 queues dans le même module
  - [x] `defaultJobOptions` global : `{ attempts: 3, backoff: { type: 'exponential', delay: 1000 }, removeOnComplete: { count: 100 }, removeOnFail: { count: 50 } }`

- [x] Tâche 4 : Créer `QueuesService` (AC: 5)
  - [x] Créer `apps/api/src/queues/queues.service.ts` — voir pattern exact en Dev Notes
  - [x] Inject `@InjectQueue('whatsapp-messages')`, `@InjectQueue('stock-alerts')`, etc. via les 5 queues
  - [x] Méthodes : `enqueueWhatsappMessage(data)`, `enqueueStockAlert(data)`, `enqueueAdvisorAlert(data)`, `enqueueTrialExpiry(data)`, `enqueueHealthCheck(data)`
  - [x] Export `QueuesService` depuis `QueuesModule`

- [x] Tâche 5 : Créer les 5 processors stubs (AC: 2, 3, 4)
  - [x] Créer `apps/api/src/queues/processors/whatsapp-messages.processor.ts`
  - [x] Créer `apps/api/src/queues/processors/stock-alerts.processor.ts`
  - [x] Créer `apps/api/src/queues/processors/advisor-alerts.processor.ts`
  - [x] Créer `apps/api/src/queues/processors/trial-expiry.processor.ts`
  - [x] Créer `apps/api/src/queues/processors/whatsapp-health-check.processor.ts`
  - [x] Chaque processor : `extends WorkerHost` + `@OnWorkerEvent('failed')` dead-letter — voir pattern exact en Dev Notes
  - [x] Enregistrer les 5 processors dans `QueuesModule.providers`

- [x] Tâche 6 : Intégrer `QueuesModule` dans `AppModule` (AC: 1)
  - [x] Ajouter `QueuesModule` à `imports` de `apps/api/src/app.module.ts` (après `AuthModule`)

- [x] Tâche 7 : Mettre à jour `.env.example` (AC: 6)
  - [x] Vérifier que `apps/api/.env.example` contient `REDIS_URL=redis://localhost:6379`

- [x] Tâche 8 : Écrire les tests unitaires (AC: 2, 3, 5)
  - [x] Créer `apps/api/src/queues/queues.service.spec.ts` — tester que chaque méthode enqueue appelle `queue.add()` avec les bons arguments
  - [x] Créer `apps/api/src/queues/processors/whatsapp-messages.processor.spec.ts` — tester que `process()` existe et `onFailed()` log en dead-letter à l'attempt 3
  - [x] Créer (ou répliquer pour les autres processors) un test représentatif pour `stock-alerts.processor.spec.ts`
  - [x] Vérifier que la suite complète passe sans régression : `pnpm --filter @whatsell/api test`

### Review Findings

- [x] [Review][Decision] D-01 — Processors stubs no-op complètes les jobs silencieusement : `process()` retourne `undefined` sans erreur, BullMQ marque les jobs comme `completed` et les supprime via `removeOnComplete`. Un déploiement accidentel en production détruirait irrémédiablement tous les messages entrants. Décision requise : faut-il que les stubs `throw new Error('Not implemented')` pour bloquer tout déploiement prématuré ?
- [x] [Review][Decision] D-02 — `job.data` loggué verbatim dans le dead-letter : les payloads WhatsApp contiennent des numéros de téléphone, corps de messages, potentiellement des tokens. Tous les champs sont loggués à `error` level vers le log aggregator. Décision requise : quelle stratégie de sanitisation/redaction appliquer avant le log ?
- [x] [Review][Patch] P-01 — `configService.get<string>('redis.url')` peut retourner `undefined` [`queues/queues.module.ts:17`] — utiliser `configService.getOrThrow<string>('redis.url')` (NestJS built-in) pour garantir un crash explicite au démarrage si le mapping de config est cassé
- [x] [Review][Patch] P-02 — Erreurs de `queue.add()` propagées brutes aux appelants sans handling [`queues/queues.service.ts:15-33`] — si Redis devient indisponible au runtime, le reject non catchée remonte comme 500 raw avec stack trace BullMQ. Envelopper dans try/catch avec log structuré.
- [x] [Review][Defer] D-01 — Redis unreachable au démarrage bloque le bootstrap (ioredis retry infini) [`queues/queues.module.ts`] — deferred, nécessite config ioredis `maxRetriesPerRequest: 0` ou `enableOfflineQueue: false`, concerne l'infrastructure de déploiement Railway, hors scope story 1.6
- [x] [Review][Defer] D-02 — Pas de déduplication des jobs (pas de jobId dérivé du payload) [`queues/queues.service.ts`] — deferred, même message peut être enqueué plusieurs fois, Story 4.x (implémentation processors réels)
- [x] [Review][Defer] D-03 — Asymétrie `defaultJobOptions` / `job.opts.attempts` si overrides per-queue futurs [`queues/processors/*.processor.ts:17`] — deferred, le fallback `?? 3` sera incorrect si une queue est configurée avec `attempts: 5`, à corriger quand les processors domaine seront implémentés
- [x] [Review][Defer] D-04 — `enqueueHealthCheck` enqueue un job one-shot, pas récurrent [`queues/queues.service.ts:31`] — deferred, BullMQ `repeat` option requise pour health-check périodique, Story 9.1
- [x] [Review][Defer] D-05 — Duplicate dead-letter entries sous scaling horizontal [`queues/processors/*.processor.ts`] — deferred, plusieurs worker instances peuvent émettre l'event `failed` en parallèle pour le même job, risque de logs dupliqués, concerne infrastructure multi-instance post-MVP

## Dev Notes

### ⚠️ Ce qui EXISTE DÉJÀ — NE PAS RECRÉER

| Fichier | Contenu | Action |
|---------|---------|--------|
| `apps/api/src/config/configuration.ts` | `redis.url` configuré depuis `REDIS_URL` | NE PAS MODIFIER |
| `apps/api/src/config/env.validation.ts` | `REDIS_URL` présent en `.optional()` | MODIFIER — supprimer `.optional()` |
| `apps/api/src/app.module.ts` | `AppModule` complet | MODIFIER — ajouter `QueuesModule` aux imports |
| `apps/api/package.json` | packages existants (sans BullMQ) | MODIFIER — ajouter `@nestjs/bullmq` + `bullmq` |

### ⚠️ Erreur courante à éviter : `@nestjs/bull` vs `@nestjs/bullmq`

**UTILISER** `@nestjs/bullmq` (API moderne, BullMQ v5+, compatible NestJS 11)
**NE PAS UTILISER** `@nestjs/bull` (ancien package basé sur bull v4, API différente)

Différences clés :
- `@nestjs/bullmq` : `WorkerHost`, `@OnWorkerEvent`, `BullModule.forRootAsync({ connection: { url } })`
- `@nestjs/bull` : `BullProcessor`, `@OnQueueFailed`, `BullModule.forRoot({ redis: { host, port } })`

### Pattern QueuesModule — Implémentation Exacte

```typescript
// apps/api/src/queues/queues.module.ts
import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { QueuesService } from './queues.service';
import { WhatsappMessagesProcessor } from './processors/whatsapp-messages.processor';
import { StockAlertsProcessor } from './processors/stock-alerts.processor';
import { AdvisorAlertsProcessor } from './processors/advisor-alerts.processor';
import { TrialExpiryProcessor } from './processors/trial-expiry.processor';
import { WhatsappHealthCheckProcessor } from './processors/whatsapp-health-check.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.get<string>('redis.url'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000, // 1s → 2s → 4s
          },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 50 },
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'whatsapp-messages' },
      { name: 'stock-alerts' },
      { name: 'advisor-alerts' },
      { name: 'trial-expiry' },
      { name: 'whatsapp-health-check' },
    ),
  ],
  providers: [
    QueuesService,
    WhatsappMessagesProcessor,
    StockAlertsProcessor,
    AdvisorAlertsProcessor,
    TrialExpiryProcessor,
    WhatsappHealthCheckProcessor,
  ],
  exports: [
    QueuesService,
    // Exporter BullModule pour que d'autres modules puissent injecter les queues individuellement si besoin
    BullModule,
  ],
})
export class QueuesModule {}
```

### Pattern QueuesService — Implémentation Exacte

```typescript
// apps/api/src/queues/queues.service.ts
import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueuesService {
  constructor(
    @InjectQueue('whatsapp-messages') private readonly whatsappMessagesQueue: Queue,
    @InjectQueue('stock-alerts') private readonly stockAlertsQueue: Queue,
    @InjectQueue('advisor-alerts') private readonly advisorAlertsQueue: Queue,
    @InjectQueue('trial-expiry') private readonly trialExpiryQueue: Queue,
    @InjectQueue('whatsapp-health-check') private readonly whatsappHealthCheckQueue: Queue,
  ) {}

  async enqueueWhatsappMessage(data: Record<string, unknown>): Promise<void> {
    await this.whatsappMessagesQueue.add('process', data);
  }

  async enqueueStockAlert(data: Record<string, unknown>): Promise<void> {
    await this.stockAlertsQueue.add('check', data);
  }

  async enqueueAdvisorAlert(data: Record<string, unknown>): Promise<void> {
    await this.advisorAlertsQueue.add('alert', data);
  }

  async enqueueTrialExpiry(data: Record<string, unknown>): Promise<void> {
    await this.trialExpiryQueue.add('notify', data);
  }

  async enqueueHealthCheck(data: Record<string, unknown>): Promise<void> {
    await this.whatsappHealthCheckQueue.add('check', data);
  }
}
```

### Pattern Processor Stub — Implémentation Exacte (même pattern pour tous)

```typescript
// apps/api/src/queues/processors/whatsapp-messages.processor.ts
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('whatsapp-messages')
export class WhatsappMessagesProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsappMessagesProcessor.name);

  // Stub — implémentation réelle en Story 4.3 (WebhooksProcessor)
  async process(_job: Job): Promise<void> {
    // no-op pour l'instant
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    // Dead-letter logging après épuisement de toutes les tentatives (NFR20)
    if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
      this.logger.error({
        event: 'dead-letter',
        queue: 'whatsapp-messages',
        jobId: job.id,
        jobName: job.name,
        data: job.data,
        attemptsMade: job.attemptsMade,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
```

**Répliquer ce pattern pour les 4 autres processors** — seuls `@Processor('nom-queue')`, le nom de classe, `Logger`, et la valeur `queue` dans le log changent :

| Fichier | @Processor | Classe | Remplacé en |
|---------|-----------|--------|-------------|
| `whatsapp-messages.processor.ts` | `'whatsapp-messages'` | `WhatsappMessagesProcessor` | Story 4.3 |
| `stock-alerts.processor.ts` | `'stock-alerts'` | `StockAlertsProcessor` | Story 3.5 |
| `advisor-alerts.processor.ts` | `'advisor-alerts'` | `AdvisorAlertsProcessor` | Story 7.3 |
| `trial-expiry.processor.ts` | `'trial-expiry'` | `TrialExpiryProcessor` | Story 2.8 |
| `whatsapp-health-check.processor.ts` | `'whatsapp-health-check'` | `WhatsappHealthCheckProcessor` | Story 9.1 |

### Pattern env.validation.ts — Modification

```typescript
// AVANT (ligne 19) :
REDIS_URL: z.string().url('REDIS_URL doit être une URL valide').optional(),

// APRÈS :
REDIS_URL: z.string().url('REDIS_URL doit être une URL valide'),
```

⚠️ Sans cette modification, `REDIS_URL` absent en production ne ferait pas crasher l'app au démarrage — BullMQ échouerait plus tard avec une erreur de connexion difficile à diagnostiquer.

### Pattern AppModule — Ajout QueuesModule

```typescript
// apps/api/src/app.module.ts
// Ajouter l'import en haut :
import { QueuesModule } from './queues/queues.module';

// Dans @Module({ imports: [...] }), après AuthModule :
AuthModule,
QueuesModule,
```

### Tests — Patterns

```typescript
// apps/api/src/queues/queues.service.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { getQueueToken } from '@nestjs/bullmq';
import { QueuesService } from './queues.service';

describe('QueuesService', () => {
  let service: QueuesService;
  const mockQueue = { add: jest.fn() };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        QueuesService,
        { provide: getQueueToken('whatsapp-messages'), useValue: mockQueue },
        { provide: getQueueToken('stock-alerts'), useValue: mockQueue },
        { provide: getQueueToken('advisor-alerts'), useValue: mockQueue },
        { provide: getQueueToken('trial-expiry'), useValue: mockQueue },
        { provide: getQueueToken('whatsapp-health-check'), useValue: mockQueue },
      ],
    }).compile();
    service = module.get<QueuesService>(QueuesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('enqueueWhatsappMessage should call queue.add with "process"', async () => {
    await service.enqueueWhatsappMessage({ phone: '+2250700000000', message: 'test' });
    expect(mockQueue.add).toHaveBeenCalledWith('process', { phone: '+2250700000000', message: 'test' });
  });

  it('enqueueStockAlert should call queue.add with "check"', async () => {
    await service.enqueueStockAlert({ productId: 'abc' });
    expect(mockQueue.add).toHaveBeenCalledWith('check', { productId: 'abc' });
  });

  // Répliquer pour enqueueAdvisorAlert, enqueueTrialExpiry, enqueueHealthCheck
});
```

```typescript
// apps/api/src/queues/processors/whatsapp-messages.processor.spec.ts
import { WhatsappMessagesProcessor } from './whatsapp-messages.processor';
import { Job } from 'bullmq';

describe('WhatsappMessagesProcessor', () => {
  let processor: WhatsappMessagesProcessor;

  beforeEach(() => {
    processor = new WhatsappMessagesProcessor();
  });

  it('process() should return without throwing', async () => {
    const job = { id: '1', name: 'process', data: {}, opts: {} } as unknown as Job;
    await expect(processor.process(job)).resolves.toBeUndefined();
  });

  it('onFailed() should log dead-letter when all attempts exhausted', () => {
    const logSpy = jest.spyOn(processor['logger'], 'error');
    const job = {
      id: '1',
      name: 'process',
      data: { phone: '+225' },
      attemptsMade: 3,
      opts: { attempts: 3 },
    } as unknown as Job;
    processor.onFailed(job, new Error('Connection timeout'));
    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'dead-letter',
        queue: 'whatsapp-messages',
        jobId: '1',
        attemptsMade: 3,
        error: 'Connection timeout',
      }),
    );
  });

  it('onFailed() should NOT log dead-letter on intermediate failure (attempt 1)', () => {
    const logSpy = jest.spyOn(processor['logger'], 'error');
    const job = {
      id: '2',
      name: 'process',
      data: {},
      attemptsMade: 1,
      opts: { attempts: 3 },
    } as unknown as Job;
    processor.onFailed(job, new Error('Temp error'));
    expect(logSpy).not.toHaveBeenCalled();
  });
});
```

### Structure Cible après Story 1.6

```
apps/api/src/
├── queues/
│   ├── queues.module.ts                          ← NOUVEAU
│   ├── queues.service.ts                         ← NOUVEAU
│   ├── queues.service.spec.ts                    ← NOUVEAU (tests)
│   └── processors/
│       ├── whatsapp-messages.processor.ts        ← NOUVEAU (stub)
│       ├── whatsapp-messages.processor.spec.ts   ← NOUVEAU (tests)
│       ├── stock-alerts.processor.ts             ← NOUVEAU (stub)
│       ├── stock-alerts.processor.spec.ts        ← NOUVEAU (tests)
│       ├── advisor-alerts.processor.ts           ← NOUVEAU (stub)
│       ├── trial-expiry.processor.ts             ← NOUVEAU (stub)
│       └── whatsapp-health-check.processor.ts    ← NOUVEAU (stub)
├── app.module.ts                                 ← MODIFIER (ajouter QueuesModule)
└── config/
    └── env.validation.ts                         ← MODIFIER (REDIS_URL requis)

apps/api/package.json                             ← MODIFIER (ajouter @nestjs/bullmq, bullmq)
```

### Intelligence de la Story Précédente (1.5)

Apprentissages critiques applicables à 1.6 :

- **Pattern `forRootAsync` avec `ConfigService`** : `JwtModule.registerAsync({ inject: [ConfigService], useFactory: (cs) => ... })` — même pattern pour `BullModule.forRootAsync()`
- **Pattern d'installation** : `pnpm --filter @whatsell/api add <package>` depuis la racine du monorepo
- **Pattern d'import dans AppModule** : ajouter dans `imports: [...]` après les modules existants — NE PAS toucher l'ordre des guards/filters/interceptors
- **`ConfigService.get<string>('redis.url')`** : déjà présent dans `configuration.ts` — ne pas recréer
- **Tests de processor** : utiliser `new Processor()` directement dans les tests unitaires (pas besoin de `TestingModule` pour les processors simples sans injection)
- **`pnpm non disponible en shell`** : si bloqué, utiliser `npx pnpm add` depuis `apps/api/`

### Commande de test

```bash
# Depuis la racine du monorepo
pnpm --filter @whatsell/api test

# Ou depuis apps/api/
cd apps/api && pnpm test
```

### Références

- [Source: _bmad-output/planning-artifacts/epics.md#Story 1.6]
- [Source: _bmad-output/planning-artifacts/architecture.md#Queue asynchrone BullMQ]
- [Source: _bmad-output/planning-artifacts/architecture.md#Frontières Architecturales — Redis BullMQ]
- [Source: _bmad-output/planning-artifacts/architecture.md#Flux 1 — Message WhatsApp entrant]
- [Source: _bmad-output/implementation-artifacts/1-5-infrastructure-nestjs-commune.md#Dev Notes]
- [Source: apps/api/src/config/configuration.ts — redis.url]
- [Source: apps/api/src/config/env.validation.ts — REDIS_URL]
- [Source: apps/api/src/app.module.ts]
- [Source: apps/api/package.json]

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- **pnpm non disponible en shell** → utilisation de `npx pnpm add` depuis `apps/api/` — résolution workspace automatique (`@nestjs/bullmq@11.0.4`, `bullmq@5.74.1`)
- **Logs ERROR en sortie de test** → attendus et corrects — les processors loguent volontairement le dead-letter, ce ne sont pas des échecs de test
- **`REDIS_URL` rendu requis** → modification de `.optional()` supprimée dans `env.validation.ts` — sans Redis, BullMQ échoue silencieusement, désormais le serveur crash au démarrage avec message explicite

### Completion Notes List

- `QueuesModule` — `BullModule.forRootAsync()` + 5 queues enregistrées + defaultJobOptions (attempts: 3, backoff exponentiel 1s→2s→4s, removeOnComplete: 100, removeOnFail: 50)
- `QueuesService` — 5 méthodes typées (`enqueueWhatsappMessage`, `enqueueStockAlert`, `enqueueAdvisorAlert`, `enqueueTrialExpiry`, `enqueueHealthCheck`) avec `@InjectQueue`
- 5 processors stubs (`WhatsappMessagesProcessor`, `StockAlertsProcessor`, `AdvisorAlertsProcessor`, `TrialExpiryProcessor`, `WhatsappHealthCheckProcessor`) — `extends WorkerHost` + `@OnWorkerEvent('failed')` dead-letter logging NFR20
- `env.validation.ts` — `REDIS_URL` rendu requis (suppression `.optional()`)
- `AppModule` — `QueuesModule` ajouté aux imports
- **Suite complète : 75/75 tests passés — 0 régression** (15 nouveaux tests queues + 60 tests existants)

### File List

- `apps/api/package.json` — MODIFIÉ (ajout `@nestjs/bullmq@11.0.4`, `bullmq@5.74.1`)
- `apps/api/src/config/env.validation.ts` — MODIFIÉ (`REDIS_URL` rendu requis)
- `apps/api/src/queues/queues.module.ts` — NOUVEAU
- `apps/api/src/queues/queues.service.ts` — NOUVEAU
- `apps/api/src/queues/queues.service.spec.ts` — NOUVEAU (6 tests)
- `apps/api/src/queues/processors/whatsapp-messages.processor.ts` — NOUVEAU (stub)
- `apps/api/src/queues/processors/whatsapp-messages.processor.spec.ts` — NOUVEAU (6 tests)
- `apps/api/src/queues/processors/stock-alerts.processor.ts` — NOUVEAU (stub)
- `apps/api/src/queues/processors/stock-alerts.processor.spec.ts` — NOUVEAU (3 tests)
- `apps/api/src/queues/processors/advisor-alerts.processor.ts` — NOUVEAU (stub)
- `apps/api/src/queues/processors/trial-expiry.processor.ts` — NOUVEAU (stub)
- `apps/api/src/queues/processors/whatsapp-health-check.processor.ts` — NOUVEAU (stub)
- `apps/api/src/app.module.ts` — MODIFIÉ (import `QueuesModule`)
