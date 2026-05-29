# Story 2.8 : Notifications Essai Gratuit & Expiration

Status: done

## Story

En tant que **vendeur en essai gratuit**,
je veux être notifié avant l'expiration de mon essai Pro,
afin de pouvoir souscrire un abonnement sans perdre l'accès à mes fonctionnalités.

## Acceptance Criteria

1. Étant donné que le vendeur est à J-2 avant la fin de son essai Pro, Quand le job BullMQ `trial-expiry` s'exécute avec le job name `check-trials`, Alors un email est envoyé à chaque vendeur dont `trialEndsAt` est dans la fenêtre [now+1.5j, now+2.5j] l'invitant à souscrire, avec un lien vers la page d'upgrade (FR47)

2. Étant donné que l'essai Pro expire sans souscription, Quand le job `check-trials` s'exécute, Alors tous les `Subscription` avec `tier=PRO` et `trialEndsAt < now` sont basculés vers `tier=FREE`, `ordersLimit=20` (FR46)

3. Étant donné que le compte d'un vendeur a été basculé vers le tier Free, Quand il visite `/settings` ou la page principale `/`, Alors un bandeau informatif s'affiche : "Votre essai Pro est terminé. Passez en Pro pour continuer à profiter de toutes les fonctionnalités."

4. Le job `check-trials` est déclenché automatiquement **chaque jour à 6h UTC** via le scheduler BullMQ (aucune intervention manuelle requise)

5. `GET /api/v1/subscriptions/status` retourne `{ data: { tier, trialEndsAt, isTrialExpired, ordersUsed, ordersLimit } }` — scopé au tenant courant

6. Si `RESEND_API_KEY` n'est pas configuré, `MailService` loggue un warning et ne lève pas d'erreur (dégradation gracieuse — évite de bloquer le déploiement en dev)

7. Un test unitaire `subscriptions.service.spec.ts` couvre : détection J-2, basculement FREE, pas de double-envoi si fenêtre non atteinte

## Tasks / Subtasks

- [x] Tâche 1 : Config email + `MailService` (AC: 1, 6)
  - [x] Ajouter dans `apps/api/src/config/configuration.ts` la section `mail: { resendApiKey, from }`
  - [x] Ajouter dans `apps/api/src/config/env.validation.ts` : `RESEND_API_KEY` et `MAIL_FROM` en `.optional().default('')`
  - [x] Créer `apps/api/src/common/services/mail.service.ts` (Injectable) avec `sendTrialExpiringWarning({ email, shopName, trialEndsAt, upgradeUrl })` — utilise le package `resend`, soft-fail si clé absente
  - [x] Ajouter `MailService` dans providers ET exports de `apps/api/src/common/common.module.ts`

- [x] Tâche 2 : `SubscriptionsRepository` (AC: 1, 2, 5)
  - [x] Créer `apps/api/src/modules/subscriptions/subscriptions.repository.ts`
  - [x] `findSubscriptionsExpiringSoon(windowStart, windowEnd)` : `prisma.subscription.findMany` où `trialEndsAt >= windowStart AND trialEndsAt <= windowEnd AND tier = PRO` avec `include: { tenant: { include: { users: { take: 1, where: { role: OWNER } } } } }`
  - [x] `downgradeExpiredTrials()` : `prisma.subscription.updateMany` où `trialEndsAt < now AND tier = PRO` → `{ tier: FREE, ordersLimit: 20 }` — retourner le `count`
  - [x] `getSubscriptionByTenant(tenantId)` : `prisma.subscription.findUnique` où `tenantId`, retourner `{ tier, trialEndsAt, ordersUsed, ordersLimit }`

- [x] Tâche 3 : `SubscriptionsService` (AC: 1, 2, 3, 5, 7)
  - [x] Créer `apps/api/src/modules/subscriptions/subscriptions.service.ts`
  - [x] Injecter `SubscriptionsRepository`, `MailService`, `ConfigService`
  - [x] `getStatus(tenantId)` : appelle repo, calcule `isTrialExpired = tier === FREE && trialEndsAt !== null && trialEndsAt < now`
  - [x] `processTrialWarnings()` : fenêtre `[now + 1.5j, now + 2.5j]` → pour chaque sub, récupère email de l'OWNER → appelle `mailService.sendTrialExpiringWarning(...)` avec `upgradeUrl = configService.get('frontendUrl') + '/settings'`
  - [x] `processTrialExpirations()` : appelle `downgradeExpiredTrials()`, log le `count`

- [x] Tâche 4 : `SubscriptionsController` + `SubscriptionsModule` (AC: 5)
  - [x] Créer `apps/api/src/modules/subscriptions/subscriptions.controller.ts`
  - [x] `@Get('status')` avec `@CurrentTenant()` → `subscriptionsService.getStatus(tenantId)`
  - [x] Créer `apps/api/src/modules/subscriptions/subscriptions.module.ts` — exporter `SubscriptionsService`
  - [x] **Pas d'import de `AuditModule` ou `CommonModule`** — globaux

- [x] Tâche 5 : Implémenter `TrialExpiryProcessor` + déclencher le cron (AC: 1, 2, 4)
  - [x] Dans `apps/api/src/queues/queues.module.ts` : ajouter `SubscriptionsModule` aux imports
  - [x] Remplacer le stub `apps/api/src/queues/processors/trial-expiry.processor.ts` — injecter `SubscriptionsService`
  - [x] Méthode `process(job)` : si `job.name === 'check-trials'` → `await service.processTrialWarnings()` puis `await service.processTrialExpirations()` ; sinon `this.logger.warn` et return
  - [x] Dans `apps/api/src/queues/queues.service.ts` : implémenter `OnModuleInit`, appeler `trialExpiryQueue.upsertJobScheduler('daily-trial-check', { pattern: '0 6 * * *' }, { name: 'check-trials', data: {} })` — s'exécute chaque jour à 6h UTC

- [x] Tâche 6 : Enregistrer `SubscriptionsModule` dans `AppModule` (AC: 3, 5)
  - [x] Dans `apps/api/src/app.module.ts` : `import { SubscriptionsModule }` et `import { SubscriptionsController }`
  - [x] Ajouter `SubscriptionsModule` dans les imports du `@Module`
  - [x] Ajouter `SubscriptionsController` dans `TenantMiddleware.forRoutes(...)` — **CRITIQUE pour `@CurrentTenant()`**

- [x] Tâche 7 : Tests unitaires `subscriptions.service.spec.ts` (AC: 7)
  - [x] Mocks : `mockSubscriptionsRepository`, `mockMailService`, `mockConfigService`
  - [x] Test `getStatus` — tier=FREE avec trialEndsAt passé → `isTrialExpired: true`
  - [x] Test `getStatus` — tier=PRO avec trialEndsAt futur → `isTrialExpired: false`
  - [x] Test `getStatus` — tier=FREE sans trialEndsAt (compte créé avant le trial) → `isTrialExpired: false`
  - [x] Test `processTrialWarnings` — sub dans fenêtre J-2 → `mailService.sendTrialExpiringWarning` appelé
  - [x] Test `processTrialWarnings` — sub hors fenêtre → mail NOT appelé
  - [x] Test `processTrialExpirations` — appelle `downgradeExpiredTrials()` et log le count

- [x] Tâche 8 : Frontend — `TrialExpiryBanner` + intégration (AC: 3)
  - [x] Créer `apps/web/src/components/shared/TrialExpiryBanner.tsx` — fetch `GET /api/v1/subscriptions/status` au mount, afficher le bandeau si `isTrialExpired === true`
  - [x] Bandeau : fond `bg-warning/10 border border-warning`, texte "Votre essai Pro est terminé. Passez en Pro pour continuer à profiter de toutes les fonctionnalités.", bouton "Passer en Pro" → `/settings` (Epic 8 ajoutera la page upgrade)
  - [x] Ajouter `<TrialExpiryBanner />` dans `apps/web/src/app/page.tsx` (dashboard provisoire)
  - [x] Ajouter `<TrialExpiryBanner />` dans `apps/web/src/app/settings/page.tsx` (sous le `<h1>Paramètres`)

## Dev Notes

### État du Codebase — Ce qui Existe Déjà

**Queue `trial-expiry` déjà initialisée** dans `QueuesModule` (`apps/api/src/queues/queues.module.ts`) avec les options globales retry×3 + backoff exponentiel. Le processor stub est à `apps/api/src/queues/processors/trial-expiry.processor.ts` avec l'annotation `@Processor('trial-expiry')` déjà en place.

**`QueuesService.enqueueTrialExpiry()`** existe mais ne sera plus nécessaire depuis l'extérieur — le cron interne suffit. Ne pas supprimer (peut servir pour des tests manuels).

**Schéma Prisma `Subscription`** (déjà migré, NE PAS TOUCHER schema.prisma) :
```prisma
model Subscription {
  id                 String           @id @default(uuid())
  tenantId           String           @unique
  tier               SubscriptionTier @default(FREE)
  ordersUsed         Int              @default(0)
  ordersLimit        Int              @default(50)
  trialEndsAt        DateTime?        // null = pas de trial ; non-null = date de fin essai
  currentPeriodStart DateTime         @default(now())
  currentPeriodEnd   DateTime
  createdAt          DateTime         @default(now())
  updatedAt          DateTime         @updatedAt
  @@index([tenantId])
  @@map("subscriptions")
}

enum SubscriptionTier { FREE PRO BUSINESS }
```

**Initialisation du trial à l'inscription** (Story 2.1 — `apps/api/src/modules/auth/auth.repository.ts:50`) :
```typescript
tier: SubscriptionTier.PRO
ordersLimit: 100
trialEndsAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
currentPeriodEnd: trialEnd
```
→ Un vendeur en essai a **`tier=PRO` ET `trialEndsAt` non-null**. Après expiration : `tier=FREE`.

**`MailService`** n'existe pas encore — c'est un nouveau service global (mention dans l'architecture : `common/services/mail.service.ts`). Utiliser le package `resend` (npm install `resend` dans `apps/api/`).

**`CommonModule` est `@Global()`** — une fois `MailService` ajouté à ses `providers` et `exports`, il sera injectable partout sans import supplémentaire.

---

### Structure des Nouveaux Fichiers

```
apps/api/src/
├── common/services/
│   └── mail.service.ts            ← NOUVEAU
├── modules/subscriptions/         ← NOUVEAU module
│   ├── subscriptions.module.ts
│   ├── subscriptions.controller.ts
│   ├── subscriptions.service.ts
│   ├── subscriptions.repository.ts
│   └── subscriptions.service.spec.ts
└── queues/
    ├── queues.module.ts            ← MODIFIER (import SubscriptionsModule)
    ├── queues.service.ts           ← MODIFIER (OnModuleInit + upsertJobScheduler)
    └── processors/
        └── trial-expiry.processor.ts ← MODIFIER (remplacer stub)

apps/web/src/
├── components/shared/
│   └── TrialExpiryBanner.tsx      ← NOUVEAU
├── app/
│   ├── page.tsx                   ← MODIFIER (ajouter banner)
│   └── settings/
│       └── page.tsx               ← MODIFIER (ajouter banner)
```

---

### Implémentation `MailService`

```typescript
// apps/api/src/common/services/mail.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

interface TrialExpiringWarningParams {
  email: string;
  shopName: string;
  trialEndsAt: Date;
  upgradeUrl: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private resend: Resend | null = null;
  private readonly from: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('mail.resendApiKey', '');
    this.from = this.configService.get<string>('mail.from', 'Whatsell <noreply@whatsell.io>');
    if (apiKey) {
      this.resend = new Resend(apiKey);
    } else {
      this.logger.warn('RESEND_API_KEY non configuré — envoi email désactivé');
    }
  }

  async sendTrialExpiringWarning(params: TrialExpiringWarningParams): Promise<void> {
    if (!this.resend) {
      this.logger.warn({ event: 'mail-skipped', email: params.email }, 'Email non envoyé (Resend non configuré)');
      return;
    }
    const expiryDate = params.trialEndsAt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
    try {
      await this.resend.emails.send({
        from: this.from,
        to: params.email,
        subject: `⚠️ Votre essai Pro Whatsell expire dans 2 jours`,
        html: `
          <h2>Votre essai Pro se termine bientôt</h2>
          <p>Bonjour,</p>
          <p>L'essai gratuit Pro de votre boutique <strong>${params.shopName}</strong> sur Whatsell expire le <strong>${expiryDate}</strong>.</p>
          <p>Sans souscription, votre compte basculera automatiquement vers le tier Free (20 commandes/mois).</p>
          <p><a href="${params.upgradeUrl}" style="background:#6366F1;color:white;padding:12px 24px;border-radius:6px;text-decoration:none;display:inline-block;margin-top:16px">Passer en Pro maintenant</a></p>
          <p style="color:#94A3B8;font-size:12px;margin-top:24px">Vous recevez cet email car vous avez un compte Whatsell.</p>
        `,
      });
      this.logger.log({ event: 'trial-warning-sent', email: params.email });
    } catch (err) {
      // Log mais ne pas propager — l'expiration doit se produire même si l'email échoue (NFR20)
      this.logger.error({ event: 'mail-send-failed', email: params.email, err });
    }
  }
}
```

---

### Implémentation `SubscriptionsRepository`

```typescript
// apps/api/src/modules/subscriptions/subscriptions.repository.ts
import { Injectable } from '@nestjs/common';
import { SubscriptionTier } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  trialEndsAt: Date | null;
  ordersUsed: number;
  ordersLimit: number;
}

export interface SubscriptionWithOwnerEmail {
  tenantId: string;
  trialEndsAt: Date;
  tenant: {
    name: string;
    users: Array<{ email: string }>;
  };
}

@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSubscriptionByTenant(tenantId: string): Promise<SubscriptionStatus | null> {
    return this.prisma.subscription.findUnique({
      where: { tenantId },
      select: { tier: true, trialEndsAt: true, ordersUsed: true, ordersLimit: true },
    });
  }

  async findSubscriptionsExpiringSoon(
    windowStart: Date,
    windowEnd: Date,
  ): Promise<SubscriptionWithOwnerEmail[]> {
    return this.prisma.subscription.findMany({
      where: {
        tier: SubscriptionTier.PRO,
        trialEndsAt: { gte: windowStart, lte: windowEnd },
      },
      select: {
        tenantId: true,
        trialEndsAt: true,
        tenant: {
          select: {
            name: true,
            users: {
              take: 1,
              where: { role: 'OWNER' },
              select: { email: true },
            },
          },
        },
      },
    }) as Promise<SubscriptionWithOwnerEmail[]>;
  }

  async downgradeExpiredTrials(): Promise<number> {
    const result = await this.prisma.subscription.updateMany({
      where: {
        tier: SubscriptionTier.PRO,
        trialEndsAt: { lt: new Date() },
      },
      data: {
        tier: SubscriptionTier.FREE,
        ordersLimit: 20,
      },
    });
    return result.count;
  }
}
```

---

### Implémentation `SubscriptionsService`

```typescript
// apps/api/src/modules/subscriptions/subscriptions.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionTier } from '../../../generated/prisma/client';
import { MailService } from '../../common/services/mail.service';
import { SubscriptionsRepository, type SubscriptionStatus } from './subscriptions.repository';

export interface SubscriptionStatusResult extends SubscriptionStatus {
  isTrialExpired: boolean;
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async getStatus(tenantId: string): Promise<SubscriptionStatusResult> {
    const sub = await this.subscriptionsRepository.getSubscriptionByTenant(tenantId);
    if (!sub) {
      // Cas edge : compte sans subscription — retour défensif
      return { tier: SubscriptionTier.FREE, trialEndsAt: null, ordersUsed: 0, ordersLimit: 20, isTrialExpired: false };
    }
    const isTrialExpired =
      sub.tier === SubscriptionTier.FREE &&
      sub.trialEndsAt !== null &&
      sub.trialEndsAt < new Date();
    return { ...sub, isTrialExpired };
  }

  async processTrialWarnings(): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 1.5 * 24 * 60 * 60 * 1000);
    const windowEnd   = new Date(now.getTime() + 2.5 * 24 * 60 * 60 * 1000);

    const subscriptions = await this.subscriptionsRepository.findSubscriptionsExpiringSoon(windowStart, windowEnd);
    this.logger.log({ event: 'trial-warnings-found', count: subscriptions.length });

    const upgradeUrl = `${this.configService.get<string>('frontendUrl', 'http://localhost:3000')}/settings`;

    for (const sub of subscriptions) {
      const ownerEmail = sub.tenant.users[0]?.email;
      if (!ownerEmail) {
        this.logger.warn({ event: 'trial-owner-email-missing', tenantId: sub.tenantId });
        continue;
      }
      await this.mailService.sendTrialExpiringWarning({
        email: ownerEmail,
        shopName: sub.tenant.name,
        trialEndsAt: sub.trialEndsAt,
        upgradeUrl,
      });
    }
  }

  async processTrialExpirations(): Promise<void> {
    const count = await this.subscriptionsRepository.downgradeExpiredTrials();
    if (count > 0) {
      this.logger.log({ event: 'trials-downgraded', count });
    }
  }
}
```

---

### Implémentation `SubscriptionsController`

```typescript
// apps/api/src/modules/subscriptions/subscriptions.controller.ts
import { Controller, Get } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('status')
  async getStatus(@CurrentTenant() tenantId: string) {
    return this.subscriptionsService.getStatus(tenantId);
  }
}
```

**Pas de `@Roles` :** tout vendeur authentifié peut consulter son propre statut d'abonnement.

---

### Implémentation `SubscriptionsModule`

```typescript
// apps/api/src/modules/subscriptions/subscriptions.module.ts
import { Module } from '@nestjs/common';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsRepository } from './subscriptions.repository';

@Module({
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, SubscriptionsRepository],
  exports: [SubscriptionsService], // exporté pour TrialExpiryProcessor via QueuesModule
})
export class SubscriptionsModule {}
```

---

### Mise à Jour `TrialExpiryProcessor`

```typescript
// apps/api/src/queues/processors/trial-expiry.processor.ts
import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SubscriptionsService } from '../../modules/subscriptions/subscriptions.service';

@Processor('trial-expiry')
export class TrialExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(TrialExpiryProcessor.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== 'check-trials') {
      this.logger.warn({ event: 'unknown-job', jobName: job.name });
      return;
    }
    this.logger.log({ event: 'trial-check-start', timestamp: new Date().toISOString() });
    await this.subscriptionsService.processTrialWarnings();
    await this.subscriptionsService.processTrialExpirations();
    this.logger.log({ event: 'trial-check-done', timestamp: new Date().toISOString() });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
      this.logger.error({
        event: 'dead-letter',
        queue: 'trial-expiry',
        jobId: job.id,
        jobName: job.name,
        attemptsMade: job.attemptsMade,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
```

---

### Mise à Jour `QueuesModule` — Importer `SubscriptionsModule`

```typescript
// apps/api/src/queues/queues.module.ts — ajouter dans imports[]
import { SubscriptionsModule } from '../modules/subscriptions/subscriptions.module';

// Dans @Module({ imports: [...] }) ajouter :
SubscriptionsModule,
```

---

### Mise à Jour `QueuesService` — Cron BullMQ

```typescript
// apps/api/src/queues/queues.service.ts — ajouter OnModuleInit
import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';

@Injectable()
export class QueuesService implements OnModuleInit {
  // ... code existant ...

  async onModuleInit(): Promise<void> {
    // Planifier le job quotidien de vérification des essais à 6h UTC
    // upsertJobScheduler est idempotent — safe à appeler à chaque démarrage
    await this.trialExpiryQueue.upsertJobScheduler(
      'daily-trial-check',
      { pattern: '0 6 * * *', tz: 'UTC' },
      { name: 'check-trials', data: {} },
    );
    this.logger.log({ event: 'trial-expiry-scheduler-registered', pattern: '0 6 * * *' });
  }
}
```

**Note importante :** `upsertJobScheduler` est la méthode BullMQ v5+ (remplace `add(..., { repeat: ... })`). Vérifier la version BullMQ installée avec `cat apps/api/package.json | grep bullmq`. Si v4.x, utiliser `add('check-trials', {}, { repeat: { pattern: '0 6 * * *' } })`.

---

### Mise à Jour `AppModule` — CRITIQUE

```typescript
// apps/api/src/app.module.ts
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { SubscriptionsController } from './modules/subscriptions/subscriptions.controller';

// Dans @Module imports[], ajouter SubscriptionsModule après SettingsModule :
SubscriptionsModule,

// Dans configure(), ajouter SubscriptionsController :
consumer
  .apply(TenantMiddleware)
  .forRoutes(
    OnboardingController,
    EventsController,
    NotificationsController,
    ProductsController,
    SettingsController,
    SubscriptionsController,  // ← AJOUTER
  );
```

---

### Frontend — `TrialExpiryBanner`

```typescript
// apps/web/src/components/shared/TrialExpiryBanner.tsx
'use client';

import { useEffect, useState } from 'react';
import { apiGet } from '@/lib/api';

type SubscriptionStatus = {
  tier: string;
  trialEndsAt: string | null;
  isTrialExpired: boolean;
  ordersUsed: number;
  ordersLimit: number;
};

export function TrialExpiryBanner() {
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    apiGet<{ data: SubscriptionStatus }>('/api/v1/subscriptions/status')
      .then((res) => {
        if (res.data.isTrialExpired) setIsExpired(true);
      })
      .catch(() => {
        // Erreur silencieuse — ne pas bloquer l'affichage de la page
      });
  }, []);

  if (!isExpired) return null;

  return (
    <div className="w-full bg-warning/10 border border-warning/30 rounded-lg px-4 py-3 flex items-center justify-between gap-3 mb-4">
      <p className="text-sm text-text-primary">
        Votre essai Pro est terminé. Passez en Pro pour continuer à profiter de toutes les fonctionnalités.
      </p>
      <a
        href="/settings"
        className="shrink-0 text-sm font-medium text-primary hover:text-primary-hover underline"
      >
        Passer en Pro
      </a>
    </div>
  );
}
```

**Intégration dans `apps/web/src/app/page.tsx` :**
```tsx
import { TrialExpiryBanner } from '@/components/shared/TrialExpiryBanner';

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8">
      <div className="w-full max-w-sm">
        <TrialExpiryBanner />
        <h1 className="text-4xl font-bold text-primary">Whatsell</h1>
        <p className="mt-4 text-text-secondary">Dashboard vendeur — en cours de construction</p>
      </div>
    </main>
  );
}
```

**Intégration dans `apps/web/src/app/settings/page.tsx` :**
Ajouter `<TrialExpiryBanner />` juste après `<h1 className="text-xl font-bold text-text-primary">Paramètres</h1>` (avant les `<Card>` sections).

---

### Config à Ajouter

**`apps/api/src/config/configuration.ts`** — ajouter dans le return :
```typescript
mail: {
  resendApiKey: process.env['RESEND_API_KEY'] ?? '',
  from: process.env['MAIL_FROM'] ?? 'Whatsell <noreply@whatsell.io>',
},
```

**`apps/api/src/config/env.validation.ts`** — ajouter dans `envSchema` :
```typescript
RESEND_API_KEY: z.string().optional().default(''),
MAIL_FROM: z.string().optional().default('Whatsell <noreply@whatsell.io>'),
```

**`apps/api/.env.example`** — ajouter (pour documentation) :
```
RESEND_API_KEY=
MAIL_FROM=Whatsell <noreply@whatsell.io>
```

---

### BullMQ — Vérifier la Version pour `upsertJobScheduler`

```bash
# Dans apps/api/ :
cat package.json | grep bullmq
```

- **BullMQ ≥ 5.0** → `queue.upsertJobScheduler('id', { pattern: '...' }, { name: '...', data: {} })`
- **BullMQ 4.x** → `queue.add('check-trials', {}, { repeat: { pattern: '0 6 * * *' } })` dans `onModuleInit`

---

### Logique J-2 — Explication de la Fenêtre

Le job tourne chaque jour à 6h UTC. Pour détecter J-2 de façon idempotente :
- `windowStart = now + 1.5 jours` (36h)
- `windowEnd   = now + 2.5 jours` (60h)

Un vendeur dont `trialEndsAt` tombe dans cette fenêtre reçoit **un seul email** (le lendemain, quand le job tourne à nouveau, la fenêtre a avancé et il n'est plus dedans). Aucun champ supplémentaire dans le schéma requis.

---

### Pièges à Éviter

1. **`SubscriptionsController` dans `TenantMiddleware.forRoutes()`** — sans ça, `@CurrentTenant()` retourne `undefined`. Bug systématique depuis Story 2.2.

2. **`TrialExpiryProcessor` a besoin de `SubscriptionsService`** → `QueuesModule` doit importer `SubscriptionsModule`. Ne pas tenter d'injecter `SubscriptionsRepository` directement dans le processor.

3. **`ResponseWrapperInterceptor` global** — le controller retourne l'objet directement ; l'enveloppe `{ data: ... }` est ajoutée automatiquement.

4. **`MailService.sendTrialExpiringWarning` ne propage PAS d'exception** — elle loggue et continue. Ne pas essayer de catch en amont.

5. **`downgradeExpiredTrials` est idempotent** — après la mise à jour `tier=FREE`, la prochaine exécution du job ne trouve plus ces subscriptions dans la query (`tier=PRO` seulement). Safe à rejouer.

6. **`upsertJobScheduler` est idempotent** — l'appeler à chaque `onModuleInit` ne crée pas de duplicats. BullMQ identifie le scheduler par son ID `'daily-trial-check'`.

7. **Pas de migration Prisma** — aucun nouveau champ sur le schéma. `trialEndsAt` existe déjà. Ne pas modifier `schema.prisma`.

8. **`Role.OWNER` dans la query Prisma** — importer `Role` depuis `'../../../generated/prisma/client'`, pas depuis `@whatsell/shared`.

---

### Fichiers à Créer / Modifier

```
NOUVEAUX :
apps/api/src/common/services/mail.service.ts
apps/api/src/modules/subscriptions/subscriptions.module.ts
apps/api/src/modules/subscriptions/subscriptions.controller.ts
apps/api/src/modules/subscriptions/subscriptions.service.ts
apps/api/src/modules/subscriptions/subscriptions.repository.ts
apps/api/src/modules/subscriptions/subscriptions.service.spec.ts
apps/web/src/components/shared/TrialExpiryBanner.tsx

MODIFIÉS :
apps/api/src/queues/processors/trial-expiry.processor.ts  (remplacer stub)
apps/api/src/queues/queues.module.ts                      (import SubscriptionsModule)
apps/api/src/queues/queues.service.ts                     (OnModuleInit + upsertJobScheduler)
apps/api/src/common/common.module.ts                      (add MailService)
apps/api/src/config/configuration.ts                      (add mail section)
apps/api/src/config/env.validation.ts                     (add RESEND_API_KEY, MAIL_FROM)
apps/api/src/app.module.ts                                (SubscriptionsModule + forRoutes)
apps/web/src/app/page.tsx                                 (add TrialExpiryBanner)
apps/web/src/app/settings/page.tsx                        (add TrialExpiryBanner)

INCHANGÉS :
apps/api/prisma/schema.prisma              (aucune migration — NE PAS TOUCHER)
apps/api/prisma/migrations/               (aucune migration)
apps/api/src/modules/auth/               (aucune modification)
packages/shared/                          (aucun nouveau schéma)
```

---

### Références

- Stub du processor : [trial-expiry.processor.ts](../../../apps/api/src/queues/processors/trial-expiry.processor.ts)
- QueuesModule actuel : [queues.module.ts](../../../apps/api/src/queues/queues.module.ts)
- QueuesService : [queues.service.ts](../../../apps/api/src/queues/queues.service.ts)
- SettingsModule (pattern module complet story 2.7) : [settings.module.ts](../../../apps/api/src/modules/settings/settings.module.ts)
- SettingsService (pattern ZodError + services globaux) : [settings.service.ts](../../../apps/api/src/modules/settings/settings.service.ts)
- AppModule (pattern TenantMiddleware.forRoutes) : [app.module.ts](../../../apps/api/src/app.module.ts)
- Auth repository (init trial subscription) : [auth.repository.ts](../../../apps/api/src/modules/auth/auth.repository.ts)
- CommonModule (pattern @Global + providers/exports) : [common.module.ts](../../../apps/api/src/common/common.module.ts)
- Configuration (pattern ConfigService) : [configuration.ts](../../../apps/api/src/config/configuration.ts)
- SettingsPage (pattern skeleton + apiGet + TrialExpiryBanner target) : [settings/page.tsx](../../../apps/web/src/app/settings/page.tsx)
- API client helpers : [api.ts](../../../apps/web/src/lib/api.ts)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Review Findings

#### Decision-Needed

- [x] [Review][Decision] **D1 — Idempotency des emails J-2** → Décision : A — ajouter `warningSentAt DateTime?` sur `Subscription` + migration Prisma + garde dans `processTrialWarnings`
- [x] [Review][Decision] **D2 — isTrialExpired faux-négatif entre expiry et cron** → Décision : A — enrichir la logique : `isTrialExpired = (tier===FREE && trialEndsAt < now) || (tier===PRO && trialEndsAt < now)`
- [x] [Review][Decision] **D3 — ordersLimit default Prisma=50 vs FREE=20** → Décision : A — migration Prisma pour aligner le default sur `20`

#### Patch

- [x] [Review][Patch] **D1-P — Ajouter `warningSentAt DateTime?` sur `Subscription` + migration + garde `processTrialWarnings`** [`prisma/schema.prisma`, `subscriptions.repository.ts`, `subscriptions.service.ts`]
- [x] [Review][Patch] **D2-P — Enrichir `isTrialExpired` : vrai aussi pour tier=PRO avec trialEndsAt < now** [`subscriptions.service.ts`]
- [x] [Review][Patch] **D3-P — Migration Prisma : `ordersLimit @default(20)` à la place de `@default(50)`** [`prisma/schema.prisma`]
- [x] [Review][Patch] **P1 — XSS : `shopName` non échappé dans le template HTML de l'email** [`apps/api/src/common/services/mail.service.ts`]
- [x] [Review][Patch] **P2 — `downgradeExpiredTrials` ne remet pas `ordersUsed` à zéro** [`apps/api/src/modules/subscriptions/subscriptions.repository.ts`]
- [x] [Review][Patch] **P3 — `toLocaleDateString` sans timezone — date incorrecte en UTC+x** [`apps/api/src/common/services/mail.service.ts`]
- [x] [Review][Patch] **P4 — `findSubscriptionsExpiringSoon` manque `orderBy` → sélection OWNER non déterministe** [`apps/api/src/modules/subscriptions/subscriptions.repository.ts`]
- [x] [Review][Patch] **P5 — Boucle `processTrialWarnings` sans try/catch — un échec coupe les emails restants** [`apps/api/src/modules/subscriptions/subscriptions.service.ts`]
- [x] [Review][Patch] **P6 — `SubscriptionStatusResponse` frontend ne déclare pas `trialEndsAt` (AC5)** [`apps/web/src/components/shared/TrialExpiryBanner.tsx`]
- [x] [Review][Patch] **P7 — `TrialExpiryBanner` sans cleanup AbortController — setState après unmount** [`apps/web/src/components/shared/TrialExpiryBanner.tsx`]
- [x] [Review][Patch] **P8 — `upsertJobScheduler` dans `onModuleInit` sans try/catch — crash au démarrage si Redis indisponible** [`apps/api/src/queues/queues.service.ts`]
- [x] [Review][Patch] **P9 — `queues.service.spec.ts` ne mocke pas `upsertJobScheduler` — `onModuleInit` non testé** [`apps/api/src/queues/queues.service.ts`]

#### Defer

- [x] [Review][Defer] **W1 — `TrialExpiryBanner` déclenche un appel API non authentifié sur la homepage publique** — différé, problème d'architecture de la page d'accueil
- [x] [Review][Defer] **W2 — `TrialExpiryBanner` sans état de chargement (flash d'absence de bandeau sur réseau lent)** — différé, amélioration UX future
- [x] [Review][Defer] **W3 — `onFailed` dead-letter : `job.opts.attempts` peut être undefined sur les jobs créés par le scheduler** — différé, comportement BullMQ incertain
- [x] [Review][Defer] **W4 — `RESEND_API_KEY` accepte une chaîne vide (pas de validation min-length)** — différé, amélioration mineure

### Completion Notes List

- Package `resend` installé dans `apps/api` via pnpm.
- `MailService` créé dans `common/services/` et exporté par le `@Global()` CommonModule — injectable partout sans re-import.
- Fenêtre J-2 implémentée avec `[now+1.5j, now+2.5j]` : idempotente, aucun champ DB supplémentaire requis.
- `upsertJobScheduler` BullMQ v5 utilisé dans `onModuleInit` — idempotent au redémarrage, cron `0 6 * * *` UTC.
- `TrialExpiryProcessor` injecte `SubscriptionsService` via `QueuesModule → SubscriptionsModule` (export explicite).
- `SubscriptionsController` ajouté à `TenantMiddleware.forRoutes()` — CRITIQUE pour `@CurrentTenant()`.
- `TrialExpiryBanner` côté front : `'use client'`, dégradation silencieuse en cas d'erreur réseau, CTA via `next/link`.
- Test spec corrigé : apostrophes curly (`'`) dans les chaînes JS remplacées par guillemets doubles.
- 9/9 tests subscriptions passent. Les 2 échecs `storage.service.spec.ts` sont pré-existants et non liés à cette story.

### File List

NOUVEAUX :
- apps/api/src/common/services/mail.service.ts
- apps/api/src/modules/subscriptions/subscriptions.module.ts
- apps/api/src/modules/subscriptions/subscriptions.controller.ts
- apps/api/src/modules/subscriptions/subscriptions.service.ts
- apps/api/src/modules/subscriptions/subscriptions.repository.ts
- apps/api/src/modules/subscriptions/subscriptions.service.spec.ts
- apps/web/src/components/shared/TrialExpiryBanner.tsx

MODIFIÉS :
- apps/api/src/queues/processors/trial-expiry.processor.ts
- apps/api/src/queues/queues.module.ts
- apps/api/src/queues/queues.service.ts
- apps/api/src/common/common.module.ts
- apps/api/src/config/configuration.ts
- apps/api/src/config/env.validation.ts
- apps/api/src/app.module.ts
- apps/web/src/app/page.tsx
- apps/web/src/app/settings/page.tsx
- apps/web/src/components/shared/index.ts
