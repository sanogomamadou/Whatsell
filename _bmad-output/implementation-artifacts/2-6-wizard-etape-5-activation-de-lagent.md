# Story 2.6 : Wizard Étape 5 — Activation de l'Agent

Status: done

## Story

En tant que **vendeur en cours d'onboarding**,
je veux voir un récapitulatif de ma configuration et activer mon agent IA,
afin de démarrer officiellement la réception automatique de commandes.

## Acceptance Criteria

1. `GET /api/v1/onboarding/summary` retourne `{ data: { shopName, whatsappNumber, productCount, advancePercentage, acceptedPaymentModes } }` — données tirées du `Tenant` courant et du count de ses `Product`s
2. `POST /api/v1/onboarding/activate` met à jour `Tenant.onboardingCompletedAt = now()` → réponse `{ data: { activatedAt: string } }` (ISO 8601 UTC)
3. `POST /api/v1/onboarding/activate` est idempotent — un appel sur un tenant déjà activé réussit sans erreur (overwrite silencieux de `onboardingCompletedAt`)
4. L'activation réussie est consignée dans `audit_logs` : `action="agent.activated"`, `tenantId`, `userId`, `createdAt` horodaté (NFR9)
5. La page `/onboarding/activate` affiche `<OnboardingStep stepNumber={5} total={5} title="Activation de l'agent" status="active" />` visible en permanence (UX-DR18)
6. La page affiche un récapitulatif visuel : nom boutique, numéro WhatsApp connecté (badge "✓ Connecté" ou "Non connecté"), nombre de produits, pourcentage d'avance + modes de paiement acceptés en clair
7. La page affiche un CTA principal "Activer mon agent" (`h-12 w-full`)
8. Au clic "Activer mon agent" → `POST /api/v1/onboarding/activate`, succès → écran de célébration dédié affichant "Votre agent est actif et prêt à vendre pour vous !" (UX-DR19), `<CelebrationToast />` déclenché via `useToast()`, redirection automatique vers `/` après 3 secondes
9. En cas d'erreur API sur l'activation → message humain affiché avec action proposée (UX-DR22), bouton "Activer mon agent" reste accessible
10. Si `GET /summary` échoue → message d'erreur humain avec bouton "Réessayer" (UX-DR22)

## Tasks / Subtasks

- [x] Tâche 1 : `OnboardingRepository.getOnboardingSummary()` (AC: 1)
  - [x] Ajouter dans `onboarding.repository.ts` l'interface `OnboardingSummary` (voir Dev Notes)
  - [x] Ajouter méthode `getOnboardingSummary(tenantId)` : `prisma.tenant.findUniqueOrThrow` avec `_count: { select: { products: true } }` et select des champs requis
  - [x] Wrapper erreur `P2025` → `NotFoundException`
  - [x] Mapper le résultat vers `OnboardingSummary`

- [x] Tâche 2 : `OnboardingRepository.activateAgent()` (AC: 2, 3)
  - [x] Ajouter méthode `activateAgent(tenantId)` : `prisma.tenant.update` avec `data: { onboardingCompletedAt: new Date() }`, `select: { onboardingCompletedAt: true }`
  - [x] Wrapper erreur `P2025` → `NotFoundException`
  - [x] Retourner `{ activatedAt: Date }`

- [x] Tâche 3 : `OnboardingService.getOnboardingSummary()` (AC: 1)
  - [x] Ajouter méthode dans `onboarding.service.ts` — simple délégation au repo

- [x] Tâche 4 : `OnboardingService.activateAgent()` (AC: 2, 3, 4)
  - [x] Ajouter méthode dans `onboarding.service.ts` : appel repo → appel audit → retour `{ activatedAt: string }` (ISO 8601)
  - [x] `AuditService` est déjà injecté dans le constructor depuis Story 2.5 — ne pas l'ajouter à nouveau
  - [x] Action audit : `action="agent.activated"`, `resource="tenant"`, `resourceId=tenantId`

- [x] Tâche 5 : `OnboardingController` — endpoints `GET summary` et `POST activate` (AC: 1, 2)
  - [x] Ajouter `Get` aux imports `@nestjs/common` existants
  - [x] Ajouter `@Get('summary')` avec `@CurrentTenant()` → `onboardingService.getOnboardingSummary(tenantId)`
  - [x] Ajouter `@Post('activate')` avec `@CurrentTenant()`, `@CurrentUser()`, `@Roles(Role.OWNER)` → `onboardingService.activateAgent(tenantId, user.id)`

- [x] Tâche 6 : Tests unitaires (AC: 1, 2, 4)
  - [x] Ajouter `getOnboardingSummary: jest.fn()` et `activateAgent: jest.fn()` dans `mockOnboardingRepository` (voir Dev Notes)
  - [x] Test `getOnboardingSummary` : délègue au repo et retourne le résumé intact
  - [x] Test `activateAgent` succès : repo appelé + audit logué avec `action="agent.activated"`
  - [x] Test `activateAgent` : audit échoue silencieusement → opération principale réussit

- [x] Tâche 7 : Frontend — Page `/onboarding/activate/page.tsx` (AC: 5–10)
  - [x] Créer `apps/web/src/app/onboarding/activate/page.tsx` (`'use client'`)
  - [x] Afficher `<OnboardingStep stepNumber={5} total={5} title="Activation de l'agent" status="active" />`
  - [x] Charger résumé au mount : `apiGet<OnboardingSummaryResponse>('/api/v1/onboarding/summary')`
  - [x] Afficher état de chargement skeleton (`animate-pulse`) pendant le fetch
  - [x] Afficher état d'erreur de chargement avec bouton "Réessayer"
  - [x] Afficher récapitulatif : shopName, whatsappNumber (badge coloré), productCount, advancePercentage, acceptedPaymentModes (libellés en clair)
  - [x] Bouton "Activer mon agent" → `apiPost<ActivateResponse>('/api/v1/onboarding/activate', {})`
  - [x] Succès → `setActivated(true)` → afficher écran de célébration + `toast({ description: <CelebrationToast … /> })`
  - [x] `useEffect` sur `activated` → `router.push('/')` après 3000ms (pas 1500ms)
  - [x] Erreur activation → message humain via `setActivateError` (UX-DR22)
  - [x] Mobile-first 360px (voir Dev Notes)

## Dev Notes

### Contexte Routing Wizard — Vue d'Ensemble

- Étape 1 : `/onboarding` (Story 2.2) ✓ FAIT
- Étape 2 : `/onboarding/whatsapp` (Story 2.3) ✓ FAIT
- Étape 3 : `/onboarding/catalogue` (Story 2.4) ✓ FAIT
- Étape 4 : `/onboarding/payment` (Story 2.5) ✓ FAIT → redirige vers `/onboarding/activate` avec délai 1500ms
- Étape 5 : `/onboarding/activate` ← **CETTE STORY** → redirige vers `/` (dashboard) après 3 secondes

La page `payment/page.tsx` fait déjà `router.push('/onboarding/activate')` — cette story crée la destination finale.

---

### Zéro Migration Prisma — `onboardingCompletedAt` Existe Déjà

```prisma
// apps/api/prisma/schema.prisma — déjà présent, NE PAS MODIFIER
model Tenant {
  ...
  onboardingCompletedAt DateTime?   // ← EXISTE DÉJÀ depuis Story 1.2
  ...
}
```

**Ne créer aucune migration.** `prisma.tenant.update({ data: { onboardingCompletedAt: new Date() } })` fonctionne immédiatement.

---

### Implémentation Repository — getOnboardingSummary

```typescript
// apps/api/src/modules/onboarding/onboarding.repository.ts

// Déclarer l'interface en haut du fichier (après les imports)
export interface OnboardingSummary {
  shopName: string;
  whatsappNumber: string | null;
  productCount: number;
  advancePercentage: number;
  acceptedPaymentModes: string[];
}

// Nouvelle méthode
async getOnboardingSummary(tenantId: string): Promise<OnboardingSummary> {
  try {
    const tenant = await this.prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: {
        name: true,
        whatsappBusinessAccountId: true,
        advancePercentage: true,
        acceptedPaymentModes: true,
        _count: { select: { products: true } },
      },
    });
    return {
      shopName: tenant.name,
      whatsappNumber: tenant.whatsappBusinessAccountId,
      productCount: tenant._count.products,
      advancePercentage: tenant.advancePercentage,
      acceptedPaymentModes: tenant.acceptedPaymentModes,
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new NotFoundException('Compte introuvable');
    }
    throw err;
  }
}
```

**Note** : `_count: { select: { products: true } }` utilise la relation `products Product[]` qui existe déjà sur le modèle `Tenant`. Cette syntaxe Prisma est disponible depuis Prisma 3.0+ — pas de `raw` SQL requis.

---

### Implémentation Repository — activateAgent

```typescript
// Nouvelle méthode dans onboarding.repository.ts
async activateAgent(tenantId: string): Promise<{ activatedAt: Date }> {
  try {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: { onboardingCompletedAt: new Date() },
      select: { onboardingCompletedAt: true },
    });
    return { activatedAt: tenant.onboardingCompletedAt! };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      throw new NotFoundException('Compte introuvable');
    }
    throw err;
  }
}
```

**Idempotence** : `prisma.tenant.update` écrase `onboardingCompletedAt` à chaque appel sans erreur — comportement idempotent natif.

---

### Implémentation Service

```typescript
// apps/api/src/modules/onboarding/onboarding.service.ts

// Ajouter dans les imports du service :
import { OnboardingRepository, OnboardingSummary } from './onboarding.repository';

// AuditService est DÉJÀ injecté dans le constructor — ne pas modifier le constructor

async getOnboardingSummary(tenantId: string): Promise<OnboardingSummary> {
  return this.onboardingRepository.getOnboardingSummary(tenantId);
}

async activateAgent(
  tenantId: string,
  userId: string,
): Promise<{ activatedAt: string }> {
  const result = await this.onboardingRepository.activateAgent(tenantId);

  // NFR9 — actions sensibles consignées dans audit_logs
  await this.auditService.log({
    tenantId,
    userId,
    action: 'agent.activated',
    resource: 'tenant',
    resourceId: tenantId,
    metadata: { activatedAt: result.activatedAt.toISOString() },
  });

  return { activatedAt: result.activatedAt.toISOString() };
}
```

**Garantie AuditService** : `AuditService.log()` ne propage jamais d'exception (try/catch interne dans `audit.service.ts`). Ne pas ajouter un double try/catch dans `OnboardingService`.

---

### Implémentation Controller

```typescript
// apps/api/src/modules/onboarding/onboarding.controller.ts

// Modifier la ligne d'import existante — ajouter Get :
import {
  Body,
  Controller,
  Get,        // ← AJOUTER
  Patch,
  Post,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

// Ajouter dans les imports TypeScript :
import { OnboardingSummary } from './onboarding.repository';

// Nouveau endpoint résumé (lecture — pas de @Roles, le tenant est celui du contexte JWT)
@Get('summary')
async getOnboardingSummary(
  @CurrentTenant() tenantId: string,
): Promise<OnboardingSummary> {
  return this.onboardingService.getOnboardingSummary(tenantId);
}

// Nouveau endpoint activation (action sensible NFR9 — OWNER uniquement)
@Post('activate')
@Roles(Role.OWNER)
async activateAgent(
  @CurrentTenant() tenantId: string,
  @CurrentUser() user: AuthUser,
): Promise<{ activatedAt: string }> {
  return this.onboardingService.activateAgent(tenantId, user.id);
}
```

**`@Roles(Role.OWNER)` sur activate** : action irréversible réservée au propriétaire du compte. Pendant l'onboarding, l'utilisateur est toujours `OWNER`.

**Pas de `@UseGuards`** : `JwtAuthGuard` + `RolesGuard` + `TenantMiddleware` sont globaux (configurés depuis Epic 1 + Story 1.4).

---

### Tests Unitaires — Nouveaux cas

```typescript
// apps/api/src/modules/onboarding/onboarding.service.spec.ts

// Modifier mockOnboardingRepository — ajouter les deux nouvelles méthodes :
const mockOnboardingRepository = {
  updateProfile: jest.fn(),
  connectWhatsapp: jest.fn(),
  updatePaymentRules: jest.fn(),
  getOnboardingSummary: jest.fn(),   // ← AJOUTER
  activateAgent: jest.fn(),           // ← AJOUTER
};

// ─── Nouveaux describe ────────────────────────────────────────────────────────

describe('getOnboardingSummary', () => {
  const SUMMARY = {
    shopName: 'Ma Boutique',
    whatsappNumber: 'waba-123',
    productCount: 3,
    advancePercentage: 50,
    acceptedPaymentModes: ['orange_money'],
  };

  it('délègue au repo et retourne le résumé intact', async () => {
    mockOnboardingRepository.getOnboardingSummary.mockResolvedValue(SUMMARY);

    const result = await service.getOnboardingSummary(TENANT_ID);

    expect(mockOnboardingRepository.getOnboardingSummary).toHaveBeenCalledWith(TENANT_ID);
    expect(result).toEqual(SUMMARY);
  });
});

describe('activateAgent', () => {
  const USER_ID = 'user-uuid-1';
  const ACTIVATED_AT = new Date('2026-05-24T10:00:00Z');

  beforeEach(() => {
    mockOnboardingRepository.activateAgent.mockResolvedValue({ activatedAt: ACTIVATED_AT });
    mockAuditService.log.mockResolvedValue(undefined);
  });

  it("activation réussie → repo appelé + audit logué avec 'agent.activated'", async () => {
    const result = await service.activateAgent(TENANT_ID, USER_ID);

    expect(mockOnboardingRepository.activateAgent).toHaveBeenCalledWith(TENANT_ID);
    expect(mockAuditService.log).toHaveBeenCalledWith(
      expect.objectContaining({
        tenantId: TENANT_ID,
        userId: USER_ID,
        action: 'agent.activated',
        resource: 'tenant',
        resourceId: TENANT_ID,
      }),
    );
    expect(result).toEqual({ activatedAt: ACTIVATED_AT.toISOString() });
  });

  it('audit échoue silencieusement → opération principale réussit', async () => {
    // AuditService.log() garantit en interne de ne jamais propager d'exception.
    // Ce test vérifie que OnboardingService s'appuie sur cette garantie.
    mockAuditService.log.mockRejectedValueOnce(new Error('DB down'));

    await expect(service.activateAgent(TENANT_ID, USER_ID)).resolves.toEqual({
      activatedAt: ACTIVATED_AT.toISOString(),
    });
  });
});
```

---

### Frontend — Page `/onboarding/activate/page.tsx` — Implémentation Complète

```typescript
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OnboardingStep } from '@/components/shared/OnboardingStep';
import { CelebrationToast } from '@/components/shared/CelebrationToast';
import { useToast } from '@/components/ui/use-toast';

type Summary = {
  shopName: string;
  whatsappNumber: string | null;
  productCount: number;
  advancePercentage: number;
  acceptedPaymentModes: string[];
};

type OnboardingSummaryResponse = { data: Summary };
type ActivateResponse = { data: { activatedAt: string } };

const PAYMENT_MODE_LABELS: Record<string, string> = {
  orange_money: 'Orange Money',
  moov_money: 'Moov Money',
  cash_on_delivery: 'Espèces à la livraison',
};

export default function OnboardingActivatePage() {
  const router = useRouter();
  const { toast } = useToast();

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [isActivating, setIsActivating] = useState(false);
  const [activated, setActivated] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);

  const loadSummary = () => {
    setLoadError(false);
    apiGet<OnboardingSummaryResponse>('/api/v1/onboarding/summary')
      .then((res) => setSummary(res.data))
      .catch(() => setLoadError(true));
  };

  useEffect(() => {
    loadSummary();
  }, []);

  useEffect(() => {
    if (!activated) return;
    toast({
      description: (
        <CelebrationToast
          message="Votre agent est actif !"
          emoji="🚀"
          subMessage="Prêt à vendre pour vous 24h/24"
        />
      ),
    });
    const id = setTimeout(() => router.push('/'), 3000);
    return () => clearTimeout(id);
  }, [activated, router, toast]);

  const handleActivate = async () => {
    setIsActivating(true);
    setActivateError(null);
    try {
      await apiPost<ActivateResponse>('/api/v1/onboarding/activate', {});
      setActivated(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('401')) {
        setActivateError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setActivateError('Une erreur est survenue. Réessayez ou contactez le support.');
      }
    } finally {
      setIsActivating(false);
    }
  };

  // ── Écran de célébration post-activation ────────────────────────────────
  if (activated) {
    return (
      <div className="min-h-screen bg-primary flex flex-col items-center justify-center px-4 text-white">
        <div className="text-center space-y-4">
          <span className="text-6xl" role="img" aria-label="Fusée">🚀</span>
          <h1 className="text-2xl font-bold">Votre agent est actif !</h1>
          <p className="text-sm opacity-80">Prêt à vendre pour vous 24h/24</p>
          <p className="text-xs opacity-50 mt-8">Redirection vers votre dashboard…</p>
        </div>
      </div>
    );
  }

  // ── Erreur de chargement du résumé ─────────────────────────────────────
  if (loadError) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-8 px-4">
        <div className="w-full max-w-sm space-y-6">
          <OnboardingStep stepNumber={5} total={5} title="Activation de l'agent" status="active" />
          <Card className="p-6 text-center space-y-4">
            <p className="text-sm text-destructive">
              Impossible de charger votre résumé. Vérifiez votre connexion.
            </p>
            <Button variant="outline" className="w-full h-12" onClick={loadSummary}>
              Réessayer
            </Button>
          </Card>
        </div>
      </div>
    );
  }

  // ── Chargement initial ─────────────────────────────────────────────────
  if (!summary) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-8 px-4">
        <div className="w-full max-w-sm space-y-6">
          <OnboardingStep stepNumber={5} total={5} title="Activation de l'agent" status="active" />
          <Card className="p-6 space-y-4 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2" />
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-2/3" />
            <div className="h-4 bg-muted rounded w-1/2" />
          </Card>
        </div>
      </div>
    );
  }

  // ── Page principale ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-8 px-4">
      <div className="w-full max-w-sm space-y-6">
        <OnboardingStep stepNumber={5} total={5} title="Activation de l'agent" status="active" />

        <Card className="p-6 space-y-4">
          <h2 className="text-base font-semibold text-text-primary">
            Récapitulatif de votre configuration
          </h2>

          <div className="space-y-3 text-sm divide-y divide-border">
            <div className="flex justify-between py-2">
              <span className="text-text-muted">Boutique</span>
              <span className="font-medium text-text-primary">{summary.shopName}</span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-text-muted">WhatsApp</span>
              {summary.whatsappNumber ? (
                <span className="font-medium text-agent">✓ Connecté</span>
              ) : (
                <span className="font-medium text-warning">Non connecté</span>
              )}
            </div>

            <div className="flex justify-between py-2">
              <span className="text-text-muted">Produits</span>
              <span className="font-medium text-text-primary">
                {summary.productCount} produit{summary.productCount !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="flex justify-between py-2">
              <span className="text-text-muted">Avance requise</span>
              <span className="font-medium text-text-primary">{summary.advancePercentage}%</span>
            </div>

            <div className="flex justify-between items-start py-2">
              <span className="text-text-muted">Paiements acceptés</span>
              <div className="text-right space-y-0.5">
                {summary.acceptedPaymentModes.length > 0 ? (
                  summary.acceptedPaymentModes.map((mode) => (
                    <div key={mode} className="font-medium text-text-primary">
                      {PAYMENT_MODE_LABELS[mode] ?? mode}
                    </div>
                  ))
                ) : (
                  <span className="text-text-muted italic">Non configuré</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        {activateError && (
          <p role="alert" className="text-sm text-destructive text-center">
            {activateError}
          </p>
        )}

        <Button
          onClick={handleActivate}
          className="w-full h-12"
          disabled={isActivating}
        >
          {isActivating ? 'Activation…' : 'Activer mon agent'}
        </Button>
      </div>
    </div>
  );
}
```

---

### Contraintes Mobile-First 360px

- Layout identique aux étapes précédentes : `min-h-screen bg-background flex flex-col items-center justify-start pt-8 px-4` + `w-full max-w-sm`
- Bouton CTA : `w-full h-12` (touch target 48px)
- Écran de célébration : fond `bg-primary` (indigo `#6366F1`) — ton de lancement (UX-DR19), pas de formulaire
- Zones de tap récapitulatif : pas d'action sur les lignes du résumé — lecture seule
- Skeleton de chargement : `animate-pulse` avec `div` placeholder (pas de spinner générique, UX-DR20)
- Police Inter via `next/font` configurée globalement — aucune action requise

---

### Détail `useToast` et `CelebrationToast`

```typescript
import { useToast } from '@/components/ui/use-toast';
// Le <Toaster /> est monté dans apps/web/src/app/layout.tsx depuis Epic 1 — aucune action

const { toast } = useToast();

// Déclenché dans useEffect quand activated = true :
toast({
  description: (
    <CelebrationToast
      message="Votre agent est actif !"
      emoji="🚀"
      subMessage="Prêt à vendre pour vous 24h/24"
    />
  ),
});
```

`CelebrationToast` expose `CELEBRATION_TRIGGERS.FIRST_AGENT_ACTIVATION` comme constante de tracking — non requis dans cette story mais disponible pour une future analytics story.

---

### Fichiers à Créer / Modifier

```
NOUVEAUX :
apps/web/src/app/onboarding/activate/page.tsx

MODIFIÉS :
apps/api/src/modules/onboarding/onboarding.repository.ts   (interface OnboardingSummary + getOnboardingSummary + activateAgent)
apps/api/src/modules/onboarding/onboarding.service.ts      (getOnboardingSummary + activateAgent)
apps/api/src/modules/onboarding/onboarding.controller.ts   (import Get + GET summary + POST activate)
apps/api/src/modules/onboarding/onboarding.service.spec.ts (mock getOnboardingSummary + activateAgent + 3 nouveaux cas)

INCHANGÉS :
apps/api/src/modules/onboarding/onboarding.module.ts      (AuditModule est @Global(), rien à importer)
apps/api/src/app.module.ts                                 (aucun nouveau module global)
apps/api/prisma/schema.prisma                              (onboardingCompletedAt existe déjà)
packages/shared/src/schemas/                               (aucun schéma Zod requis — GET response + POST sans body)
apps/api/prisma/migrations/                                (aucune migration — NE PAS TOUCHER)
```

---

### Learnings des Stories Précédentes (Critiques)

**Story 2.5 (AuditService) :**
- `AuditService` est déjà injecté dans `OnboardingService.constructor()` — ne pas modifier le constructor
- `AuditService.log()` absorbe toutes les exceptions en interne — pas de double try/catch dans le service
- Mock dans les tests : `{ provide: AuditService, useValue: { log: jest.fn().mockResolvedValue(undefined) } }`
- `mockAuditService.log` est déjà déclaré dans `onboarding.service.spec.ts` — le référencer, pas le redéclarer

**Story 2.4 (modules globaux) :**
- `AuditModule` est `@Global()` depuis Story 2.5 — `OnboardingModule` n'a pas besoin de l'importer
- 4 test failures pré-existantes (`encryption.service.spec.ts` × 1, `storage.service.spec.ts` × 3) — **ne pas les corriger**

**Story 2.2/2.3/2.4/2.5 (patterns frontend) :**
- Pattern erreur `message.includes('401')` fragile mais pré-existant (D-02 deferred-work.md) — acceptable
- `ResponseWrapperInterceptor` global : ne jamais envelopper dans `{ data: ... }` côté service/controller
- `apiPost` pour POST sans fichier, `apiGet` pour GET — jamais `apiFormData` ici

---

### Pièges à Éviter

1. **Zéro migration** — `onboardingCompletedAt` est dans `schema.prisma` depuis Story 1.2. Ne pas exécuter `prisma migrate dev`.
2. **Ne pas modifier le constructor de `OnboardingService`** — `AuditService` y est déjà injecté. Ajouter seulement les méthodes.
3. **`ResponseWrapperInterceptor`** global — retourner directement `OnboardingSummary` et `{ activatedAt: string }` depuis le controller. Le wrapper les enveloppe automatiquement dans `{ data: ... }`.
4. **`_count` Prisma** — `_count: { select: { products: true } }` fonctionne uniquement si la relation `products` existe sur le modèle `Tenant`. Elle existe (`products Product[]` dans `schema.prisma`).
5. **Timer 3000ms** (pas 1500ms comme en Story 2.5) — la spec AC8 dit "3 secondes".
6. **`@Roles(Role.OWNER)` sur POST activate** — importer `Role` depuis `'../../../generated/prisma/client'` (chemin identique à `onboarding.controller.ts` existant qui importe déjà `Role`).
7. **`Get` manquant dans les imports NestJS** — le controller actuel n'importe pas `Get`. L'ajouter à la ligne d'import `@nestjs/common` existante.
8. **Idempotence** — ne pas ajouter de vérification "déjà activé". `prisma.tenant.update` avec `onboardingCompletedAt: new Date()` est naturellement idempotent (overwrite silencieux).
9. **Skeleton vs spinner** — UX-DR20 interdit les spinners génériques. Utiliser des `div` avec `animate-pulse` pour le chargement du résumé.

---

### Références

- `OnboardingController` (pattern controller existant) : [onboarding.controller.ts](../../../apps/api/src/modules/onboarding/onboarding.controller.ts)
- `OnboardingService` (pattern service + AuditService injecté) : [onboarding.service.ts](../../../apps/api/src/modules/onboarding/onboarding.service.ts)
- `OnboardingRepository` (pattern repository + P2025 wrapper) : [onboarding.repository.ts](../../../apps/api/src/modules/onboarding/onboarding.repository.ts)
- `AuditService` (garantie non-propagation exception) : [audit.service.ts](../../../apps/api/src/modules/audit/audit.service.ts)
- `OnboardingService.spec.ts` (structure mocks + describe) : [onboarding.service.spec.ts](../../../apps/api/src/modules/onboarding/onboarding.service.spec.ts)
- Page étape 4 (pattern frontend wizard : skeleton, erreur, formulaire) : [onboarding/payment/page.tsx](../../../apps/web/src/app/onboarding/payment/page.tsx)
- `CelebrationToast` + `CELEBRATION_TRIGGERS` : [CelebrationToast.tsx](../../../apps/web/src/components/shared/CelebrationToast.tsx)
- `OnboardingStep` : [OnboardingStep.tsx](../../../apps/web/src/components/shared/OnboardingStep.tsx)
- `apiGet` + `apiPost` : [api.ts](../../../apps/web/src/lib/api.ts)
- Schéma Prisma — Tenant avec `onboardingCompletedAt` et `products Product[]` : [schema.prisma](../../../apps/api/prisma/schema.prisma)
- `@CurrentUser()` décorateur : [current-user.decorator.ts](../../../apps/api/src/common/decorators/current-user.decorator.ts)
- `AuthUser` interface : [jwt.strategy.ts](../../../apps/api/src/modules/auth/strategies/jwt.strategy.ts)
- Deferred work (D-02 erreurs HTTP fragiles, pre-existing) : [deferred-work.md](./deferred-work.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

### Completion Notes List

### File List

**Créés :**
- `apps/web/src/app/onboarding/activate/page.tsx`

**Modifiés :**
- `apps/api/src/modules/onboarding/onboarding.repository.ts` — interface `OnboardingSummary` + `getOnboardingSummary()` + `activateAgent()`
- `apps/api/src/modules/onboarding/onboarding.service.ts` — `getOnboardingSummary()` + `activateAgent()` (avec try/catch audit)
- `apps/api/src/modules/onboarding/onboarding.controller.ts` — `GET /summary` + `POST /activate @Roles(OWNER)`
- `apps/api/src/modules/onboarding/onboarding.service.spec.ts` — mocks `getOnboardingSummary`/`activateAgent` + 3 nouveaux cas de test

### Review Findings

- [x] [Review][Decision] Texte de l'écran de célébration dévie du copy AC 8 — résolu : aligné sur "Votre agent est actif et prêt à vendre pour vous !" en une seule phrase dans le h1.
- [x] [Review][Decision] `useCelebrationToast` au lieu de `useToast` + `<CelebrationToast />` (AC 8) — résolu : hook accepté comme abstraction équivalente.
- [x] [Review][Decision] `productCount` compte tous les produits y compris les soft-deleted — résolu : filtre `isActive: true` appliqué.
- [x] [Review][Patch] `activatedAt` assertion non-null sur un champ nullable Prisma [apps/api/src/modules/onboarding/onboarding.repository.ts] — corrigé : guard explicite avec throw si null.
- [x] [Review][Patch] Double try/catch autour de `auditService.log()` dans `activateAgent` [apps/api/src/modules/onboarding/onboarding.service.ts] — corrigé : try/catch supprimé, appel direct conforme à la spec.
- [x] [Review][Patch] Frontend affiche le WABA ID brut au lieu du texte "✓ Connecté" (AC 6) [apps/web/src/app/onboarding/activate/page.tsx] — corrigé : badge "✓ Connecté" / "Non connecté".
- [x] [Review][Defer] Re-activation génère un doublon d'audit — deferred, par design spec (AC 3 : overwrite silencieux)
- [x] [Review][Defer] Détection d'erreur HTTP fragile via `message.includes('401')` dans la page activate — deferred, pré-existant (D-02 deferred-work.md)
- [x] [Review][Defer] `triggerCelebration` sessionStorage déduplication — re-visite de la page après activation silencieuse sans toast — deferred, edge case mineur
- [x] [Review][Defer] Risque boucle de redirection vers `/` si le root guard vérifie `onboardingCompletedAt` avec délai de propagation — deferred, dépend de l'implémentation du root guard (hors scope)
- [x] [Review][Defer] État squelette permanent si l'API renvoie `{ data: null }` [apps/web/src/app/onboarding/activate/page.tsx] — deferred, cas impossible avec l'API actuelle (Prisma lève P2025 avant)

### Change Log

- 2026-05-24 : Story 2.6 créée — wizard étape 5 activation agent, récapitulatif configuration, écran célébration UX-DR19
- 2026-05-24 : Implémentation complète — backend (repo + service + controller + tests), frontend (page activation) — 19/19 tests unitaires passent, 0 régression — Status → review
- 2026-05-26 : Code review — 3 decision-needed, 3 patch, 5 defer, 5 dismissed
