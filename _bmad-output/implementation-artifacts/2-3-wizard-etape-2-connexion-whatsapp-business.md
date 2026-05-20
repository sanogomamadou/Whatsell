# Story 2.3 : Wizard Étape 2 — Connexion WhatsApp Business

Status: done

## Story

En tant que **vendeur en cours d'onboarding**,
je veux connecter mon numéro WhatsApp Business à Whatsell via un guide étape par étape,
afin que mon agent IA puisse recevoir et répondre aux messages de mes clients.

## Acceptance Criteria

1. `POST /api/v1/onboarding/whatsapp-connect` avec `whatsappBusinessAccountId` et `whatsappToken` valides → `Tenant.whatsappBusinessAccountId` mis à jour, `Tenant.whatsappToken` stocké **chiffré AES-256-GCM**, réponse `{ data: { whatsappBusinessAccountId: string } }`
2. `POST /api/v1/onboarding/whatsapp-connect` avec `whatsappBusinessAccountId` vide → `400 Bad Request`, message humain
3. `POST /api/v1/onboarding/whatsapp-connect` avec `whatsappToken` vide → `400 Bad Request`, message humain
4. La page `/onboarding/whatsapp` affiche `<OnboardingStep stepNumber={2} total={5} title="Connexion WhatsApp Business" status="active" />` visible en permanence (UX-DR18)
5. Un tutoriel vidéo intégré (iframe YouTube) expliquant la configuration Meta Business Manager est affiché sur la page (UX-DR18)
6. Un bouton "SOS — Contacter le support" est visible en permanence sur la page, y compris après une erreur (UX-DR18)
7. Le formulaire contient : champ "WhatsApp Business Account ID" + champ "Token d'accès" (type `password` pour masquer la valeur)
8. Soumission avec données valides → appel `POST /api/v1/onboarding/whatsapp-connect`, succès → badge "✓ Connecté" affiché + redirection vers `/onboarding/catalogue` (placeholder Story 2.4)
9. En cas d'erreur API → message humain affiché avec action proposée (UX-DR22), bouton SOS reste visible
10. Bouton "Connecter" désactivé pendant la soumission (`isSubmitting`)

## Tasks / Subtasks

- [x] Tâche 1 : Schéma Zod `connectWhatsappSchema` dans `packages/shared` (AC: 1, 2, 3)
  - [x] Modifier `packages/shared/src/schemas/onboarding.schema.ts`
  - [x] Ajouter `connectWhatsappSchema = z.object({ whatsappBusinessAccountId: z.string().trim().min(1, ...), whatsappToken: z.string().trim().min(1, ...) })`
  - [x] Exporter `type ConnectWhatsappDto = z.infer<typeof connectWhatsappSchema>`
  - [x] Vérifier que `export * from './onboarding.schema'` est déjà dans `packages/shared/src/schemas/index.ts` (c'est le cas — ne pas dupliquer)
  - [x] Rebuild `@whatsell/shared` : `pnpm --filter @whatsell/shared build`

- [x] Tâche 2 : `OnboardingRepository.connectWhatsapp()` (AC: 1)
  - [x] Modifier `apps/api/src/modules/onboarding/onboarding.repository.ts`
  - [x] Ajouter `connectWhatsapp(tenantId: string, data: { whatsappBusinessAccountId: string; encryptedToken: string }): Promise<{ whatsappBusinessAccountId: string }>`
  - [x] Implémentation : `prisma.tenant.update({ where: { id: tenantId }, data: { whatsappBusinessAccountId: data.whatsappBusinessAccountId, whatsappToken: data.encryptedToken }, select: { whatsappBusinessAccountId: true } })`

- [x] Tâche 3 : `OnboardingService.connectWhatsapp()` — injection `EncryptionService` (AC: 1, 2, 3)
  - [x] Modifier `apps/api/src/modules/onboarding/onboarding.service.ts`
  - [x] Ajouter `EncryptionService` dans le constructeur (global via `CommonModule` — **pas d'import dans `OnboardingModule`**)
  - [x] Import : `import { EncryptionService } from '../../common/services/encryption.service'`
  - [x] Méthode `connectWhatsapp(tenantId: string, dto: ConnectWhatsappDto): Promise<{ whatsappBusinessAccountId: string }>` :
    1. `const validated = connectWhatsappSchema.parse(dto)` → lève `BadRequestException` via catch ZodError
    2. `const encryptedToken = this.encryptionService.encrypt(validated.whatsappToken)`
    3. `return this.onboardingRepository.connectWhatsapp(tenantId, { whatsappBusinessAccountId: validated.whatsappBusinessAccountId, encryptedToken })`

- [x] Tâche 4 : `OnboardingController` — endpoint `POST /whatsapp-connect` (AC: 1, 2, 3)
  - [x] Modifier `apps/api/src/modules/onboarding/onboarding.controller.ts`
  - [x] Ajouter `import { Post, Body } from '@nestjs/common'` (si non déjà importé)
  - [x] Ajouter import `ConnectWhatsappDto` depuis `@whatsell/shared`
  - [x] Endpoint : `@Post('whatsapp-connect')` + `@Body() body: ConnectWhatsappDto` + `@CurrentTenant() tenantId: string`
  - [x] Appeler `return this.onboardingService.connectWhatsapp(tenantId, body)`
  - [x] **Pas de `@UseGuards`** — `JwtAuthGuard` + `RolesGuard` sont globaux

- [x] Tâche 5 : Tests unitaires `onboarding.service.spec.ts` (AC: 1, 2, 3)
  - [x] Modifier `apps/api/src/modules/onboarding/onboarding.service.spec.ts`
  - [x] Ajouter mock `EncryptionService` : `{ encrypt: jest.fn() }`
  - [x] Ajouter `{ provide: EncryptionService, useValue: mockEncryptionService }` dans le module de test
  - [x] Test : WABA ID + token valides → `encrypt()` appelé avec token en clair, `connectWhatsapp()` appelé avec token chiffré, retourne `{ whatsappBusinessAccountId }`
  - [x] Test : WABA ID vide → `BadRequestException`, `encrypt()` non appelé
  - [x] Test : token vide → `BadRequestException`, `encrypt()` non appelé

- [x] Tâche 6 : Frontend — Page `/onboarding/whatsapp/page.tsx` (AC: 4–10)
  - [x] Créer `apps/web/src/app/onboarding/whatsapp/page.tsx` (`'use client'`)
  - [x] Afficher `<OnboardingStep stepNumber={2} total={5} title="Connexion WhatsApp Business" status="active" />`
  - [x] Section tutoriel vidéo : `<iframe>` YouTube embed dans une `<Card>` (voir Dev Notes pour URL placeholder)
  - [x] Bouton SOS permanent : `<a href="mailto:support@whatsell.io">` stylé en bouton outline, visible en permanence y compris après erreur
  - [x] React Hook Form + `zodResolver(connectWhatsappSchema)` pour les deux champs
  - [x] Champ WABA ID : `<Input>` de `@/components/ui/input`, `autoComplete="off"`, `h-12`
  - [x] Champ token : `<Input type="password">`, `autoComplete="new-password"`, `h-12`
  - [x] Soumission : `apiPost<{ data: { whatsappBusinessAccountId: string } }>('/api/v1/onboarding/whatsapp-connect', data)` (JSON standard — **utiliser `apiPost` pas `apiFormData`**)
  - [x] Succès → afficher badge "✓ Connecté" pendant 1.5s puis `router.push('/onboarding/catalogue')`
  - [x] Erreur → `setError('root', { message: '...' })` — message humain (UX-DR22)
  - [x] Bouton "Connecter" : `w-full h-12`, `disabled={isSubmitting}`
  - [x] Contraintes mobile-first 360px (voir Dev Notes)

## Dev Notes

### Schéma Prisma — AUCUNE MIGRATION REQUISE

Le modèle `Tenant` (`apps/api/prisma/schema.prisma`) contient **déjà** les deux champs :
```prisma
model Tenant {
  whatsappBusinessAccountId String?  // ← non chiffré, ID du compte WABA
  whatsappToken             String?  // ← chiffré AES-256-GCM avant stockage
  ...
}
```
Ne pas créer de migration. Ne pas modifier `schema.prisma`.

### EncryptionService — Architecture Existante

`EncryptionService` est `@Global()` dans `CommonModule`. Il est déjà exporté et injectable dans `OnboardingService` **sans aucune modification de `OnboardingModule`**.

```typescript
// Import dans onboarding.service.ts
import { EncryptionService } from '../../common/services/encryption.service';

// Signature (apps/api/src/common/services/encryption.service.ts)
encrypt(plaintext: string): string
// Format retourné : "iv_base64:tag_base64:ciphertext_base64"
// Exemple : "abc123=:def456=:ghi789="

decrypt(encoded: string): string
// Usage : decrypt(storedToken) → token en clair
```

**Seul le `whatsappToken` est chiffré.** Le `whatsappBusinessAccountId` est stocké en clair.

### Structure Cible Backend (modifications de fichiers existants)

```
apps/api/src/modules/onboarding/
├── onboarding.module.ts         ← INCHANGÉ
├── onboarding.controller.ts     ← MODIFIÉ — ajouter POST /whatsapp-connect
├── onboarding.service.ts        ← MODIFIÉ — ajouter connectWhatsapp() + injecter EncryptionService
├── onboarding.repository.ts     ← MODIFIÉ — ajouter connectWhatsapp()
└── onboarding.service.spec.ts   ← MODIFIÉ — ajouter describe('connectWhatsapp')
```

**Aucun fichier nouveau côté backend.** Tout s'ajoute dans les fichiers existants.

### Schéma Zod à Ajouter dans `packages/shared`

```typescript
// packages/shared/src/schemas/onboarding.schema.ts — AJOUTER à la fin
export const connectWhatsappSchema = z.object({
  whatsappBusinessAccountId: z
    .string()
    .trim()
    .min(1, "L'identifiant du compte WhatsApp Business est obligatoire"),
  whatsappToken: z
    .string()
    .trim()
    .min(1, 'Le token d\'accès WhatsApp Business est obligatoire'),
});

export type ConnectWhatsappDto = z.infer<typeof connectWhatsappSchema>;
```

Ne pas oublier : `pnpm --filter @whatsell/shared build` après modification. L'export `export * from './onboarding.schema'` est **déjà présent** dans `packages/shared/src/schemas/index.ts` — ne pas le dupliquer.

### Implémentation Complète du Service

```typescript
// onboarding.service.ts — Ajouter EncryptionService au constructeur et la méthode
import { EncryptionService } from '../../common/services/encryption.service';
import { connectWhatsappSchema, type ConnectWhatsappDto } from '@whatsell/shared';

constructor(
  private readonly onboardingRepository: OnboardingRepository,
  private readonly storageService: StorageService,
  private readonly encryptionService: EncryptionService, // ← AJOUTER
) {}

async connectWhatsapp(
  tenantId: string,
  dto: ConnectWhatsappDto,
): Promise<{ whatsappBusinessAccountId: string }> {
  let validated: ConnectWhatsappDto;
  try {
    validated = connectWhatsappSchema.parse(dto);
  } catch (err) {
    if (err instanceof ZodError) {
      throw new BadRequestException(err.errors[0]?.message ?? 'Données invalides');
    }
    throw err;
  }

  const encryptedToken = this.encryptionService.encrypt(validated.whatsappToken);
  return this.onboardingRepository.connectWhatsapp(tenantId, {
    whatsappBusinessAccountId: validated.whatsappBusinessAccountId,
    encryptedToken,
  });
}
```

### Implémentation Complète du Repository

```typescript
// onboarding.repository.ts — Ajouter la méthode
async connectWhatsapp(
  tenantId: string,
  data: { whatsappBusinessAccountId: string; encryptedToken: string },
): Promise<{ whatsappBusinessAccountId: string }> {
  const tenant = await this.prisma.tenant.update({
    where: { id: tenantId },
    data: {
      whatsappBusinessAccountId: data.whatsappBusinessAccountId,
      whatsappToken: data.encryptedToken,
    },
    select: { whatsappBusinessAccountId: true },
  });
  // prisma.tenant.update retourne whatsappBusinessAccountId: string | null
  // mais après update avec une valeur, ce sera toujours string
  return { whatsappBusinessAccountId: tenant.whatsappBusinessAccountId! };
}
```

### Pattern API Frontend — Utiliser `apiPost` (JSON standard)

Cette story envoie du **JSON**, pas du multipart. Utiliser `apiPost` (déjà existant dans `apps/web/src/lib/api.ts`) — contrairement à Story 2.2 qui utilisait `apiFormData`.

```typescript
import { apiPost } from '@/lib/api';

const result = await apiPost<{ data: { whatsappBusinessAccountId: string } }>(
  '/api/v1/onboarding/whatsapp-connect',
  { whatsappBusinessAccountId, whatsappToken },
);
```

### Frontend — Structure de la Page

```typescript
// apps/web/src/app/onboarding/whatsapp/page.tsx

'use client';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { connectWhatsappSchema, type ConnectWhatsappDto } from '@whatsell/shared';
import { apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { OnboardingStep } from '@/components/shared/OnboardingStep';

// Badge succès affiché 1.5s avant redirection
// SOS button toujours visible, même en cas d'erreur
// Tutoriel vidéo : iframe YouTube embed
```

**Tutoriel vidéo** : utiliser un iframe YouTube avec l'URL placeholder suivante (à remplacer par la vraie URL quand disponible) :
```tsx
<div className="relative w-full aspect-video rounded-lg overflow-hidden bg-neutral-100">
  <iframe
    src="https://www.youtube.com/embed/dQw4w9WgXcQ"  // ← URL placeholder
    title="Guide de connexion WhatsApp Business"
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
    allowFullScreen
    className="absolute inset-0 w-full h-full"
  />
</div>
```

**Badge succès** :
```tsx
{connected && (
  <Badge variant="success" className="text-sm py-1.5 px-3">
    ✓ WhatsApp connecté
  </Badge>
)}
```
Note : si `Badge` n'a pas de variant `success`, utiliser `className="bg-success/10 text-success border-success"`.

**Bouton SOS** :
```tsx
<a
  href="mailto:support@whatsell.io"
  className="inline-flex items-center gap-2 text-sm font-medium text-destructive border border-destructive rounded-lg px-4 py-2.5 hover:bg-destructive/5 transition-colors min-h-[44px]"
>
  SOS — Contacter le support
</a>
```

### Contraintes Mobile-First 360px

- Même layout que Story 2.2 : `max-w-sm mx-auto px-4`
- Inputs : `h-12` (48px — touch target)
- Bouton submit : `w-full h-12`, `rounded-lg`
- Bouton SOS : `min-h-[44px]`, visible **en permanence** (pas conditionnel)
- iframe vidéo : `aspect-video` pour ratio 16:9 responsive
- Messages d'erreur : apparaissent après soumission, jamais en temps réel

### Learnings de la Story 2.2 — Patterns Établis

- `OnboardingStep` : props `{ stepNumber, total, title, status, onClick? }` — import depuis `@/components/shared/OnboardingStep`
- `@hookform/resolvers` + `zodResolver` installés dans `apps/web`
- Pattern erreur globale : `setError('root', { message: '...' })` → afficher via `{errors.root && <p role="alert">...`
- `apiPost` lève `Error` avec message `"POST /path échoué : 400"` — parser via `err.message.includes('400')`
- `ResponseWrapperInterceptor` global : **ne jamais envelopper manuellement** `{ data: ... }` dans les services/controllers
- NestJS ZodError → `BadRequestException` : même pattern qu'en Story 2.2 dans le service
- 4 test failures pré-existantes dans `encryption.service.spec.ts` + `storage.service.spec.ts` — **non liées à cette story**, ne pas les corriger

### Routing Frontend — Décision Architecture

- Étape 1 : `/onboarding` (Story 2.2) ✓ FAIT
- Étape 2 : `/onboarding/whatsapp` (cette story)
- Étape 3 : `/onboarding/catalogue` (Story 2.4 — placeholder à créer)
- Étape 4 : `/onboarding/payment` (Story 2.5)
- Étape 5 : `/onboarding/activate` (Story 2.6)

La page `apps/web/src/app/onboarding/page.tsx` (Story 2.2) redirige déjà vers `/onboarding/whatsapp` après succès — cette story crée cette page.

### Fichiers à Créer / Modifier

```
NOUVEAU :
apps/web/src/app/onboarding/whatsapp/page.tsx

MODIFIÉ :
packages/shared/src/schemas/onboarding.schema.ts  (ajouter connectWhatsappSchema)
apps/api/src/modules/onboarding/onboarding.repository.ts  (ajouter connectWhatsapp)
apps/api/src/modules/onboarding/onboarding.service.ts  (ajouter method + EncryptionService)
apps/api/src/modules/onboarding/onboarding.controller.ts  (ajouter POST route)
apps/api/src/modules/onboarding/onboarding.service.spec.ts  (ajouter tests connectWhatsapp)

INCHANGÉ :
apps/api/src/modules/onboarding/onboarding.module.ts  (pas de nouveau provider ni import)
apps/api/prisma/schema.prisma  (champs déjà présents)
packages/shared/src/schemas/index.ts  (export déjà présent)
```

### Pièges à Éviter

1. **Ne pas modifier `onboarding.module.ts`** — `EncryptionService` est global, aucun `imports` à ajouter.
2. **Ne pas créer de migration Prisma** — `whatsappBusinessAccountId` et `whatsappToken` existent déjà.
3. **Ne pas dupliquer `export * from './onboarding.schema'`** dans `schemas/index.ts` — déjà présent.
4. **Ne pas utiliser `apiFormData`** pour cette story — payload JSON standard, utiliser `apiPost`.
5. **Chiffrer uniquement `whatsappToken`**, pas `whatsappBusinessAccountId`.
6. **`prisma.tenant.update` retourne `whatsappBusinessAccountId: string | null`** — après update avec une valeur, utiliser l'opérateur `!` ou convertir avec `?? ''`.

### References

- `EncryptionService` : [encryption.service.ts](../../../apps/api/src/common/services/encryption.service.ts) — `encrypt()` retourne format `"iv:tag:cipher"` en base64
- `CommonModule` (`@Global`) : [common.module.ts](../../../apps/api/src/common/common.module.ts) — `EncryptionService` globalement disponible
- `OnboardingService` existant : [onboarding.service.ts](../../../apps/api/src/modules/onboarding/onboarding.service.ts) — ajouter `EncryptionService` au constructeur
- `OnboardingRepository` existant : [onboarding.repository.ts](../../../apps/api/src/modules/onboarding/onboarding.repository.ts) — ajouter `connectWhatsapp()`
- `OnboardingController` existant : [onboarding.controller.ts](../../../apps/api/src/modules/onboarding/onboarding.controller.ts) — ajouter `POST /whatsapp-connect`
- Schema Prisma : [schema.prisma](../../../apps/api/prisma/schema.prisma) — `Tenant.whatsappBusinessAccountId` et `Tenant.whatsappToken` existent
- `OnboardingStep` composant : [OnboardingStep.tsx](../../../apps/web/src/components/shared/OnboardingStep.tsx)
- Page étape 1 (patterns) : [onboarding/page.tsx](../../../apps/web/src/app/onboarding/page.tsx)
- `apiPost` : [api.ts](../../../apps/web/src/lib/api.ts)
- Schéma partagé : [onboarding.schema.ts](../../../packages/shared/src/schemas/onboarding.schema.ts)
- Story précédente (patterns) : [2-2-wizard-etape-1-profil-boutique.md](./2-2-wizard-etape-1-profil-boutique.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Build frontend échoue sur `next build` (erreur Turbopack/webpack pré-existante depuis Next.js 16) — non liée à cette story. TypeScript check `tsc --noEmit` passe sans erreur.
- 4 test failures pré-existantes confirmées : `encryption.service.spec.ts` (1) et `storage.service.spec.ts` (3) — identiques aux failures documentées en Story 2.2.
- `EncryptionService` injecté dans `OnboardingService` sans modification de `OnboardingModule` — global via `CommonModule`.

### Completion Notes List

- **Tâche 1** : `connectWhatsappSchema` + `ConnectWhatsappDto` ajoutés dans `packages/shared/src/schemas/onboarding.schema.ts`. Build shared réussi.
- **Tâche 2** : `OnboardingRepository.connectWhatsapp()` ajouté — `prisma.tenant.update` avec `select: { whatsappBusinessAccountId: true }`, opérateur `!` pour convertir `string | null` → `string`.
- **Tâche 3** : `OnboardingService.connectWhatsapp()` ajouté — validation Zod → `BadRequestException`, chiffrement `encryptionService.encrypt()`, délégation au repository.
- **Tâche 4** : `POST /api/v1/onboarding/whatsapp-connect` ajouté dans `OnboardingController` — `@Body() body: ConnectWhatsappDto`, sans `@UseGuards` (globaux).
- **Tâche 5** : 4 tests `connectWhatsapp` ajoutés (valid, WABA vide, token vide, WABA espaces seuls) — 8/8 tests PASS. Mock `EncryptionService` ajouté au module de test.
- **Tâche 6** : Page `apps/web/src/app/onboarding/whatsapp/page.tsx` créée — `OnboardingStep(2/5)`, iframe YouTube placeholder, formulaire RHF + Zod, badge succès 1.5s + redirect, bouton SOS permanent `mailto:support@whatsell.io`.
- **Régressions** : 0 nouvelles failures. 4 failures pré-existantes confirmées.

### File List

packages/shared/src/schemas/onboarding.schema.ts (modifié — ajout connectWhatsappSchema + ConnectWhatsappDto)
apps/api/src/modules/onboarding/onboarding.repository.ts (modifié — ajout connectWhatsapp())
apps/api/src/modules/onboarding/onboarding.service.ts (modifié — ajout connectWhatsapp() + EncryptionService)
apps/api/src/modules/onboarding/onboarding.controller.ts (modifié — ajout POST /whatsapp-connect)
apps/api/src/modules/onboarding/onboarding.service.spec.ts (modifié — ajout describe('connectWhatsapp') 4 tests)
apps/web/src/app/onboarding/whatsapp/page.tsx (nouveau)

### Review Findings

- [x] [Review][Decision] Vidéo tutoriel YouTube — URL remplacée par https://youtu.be/JY9SDMwbuyc (embed: JY9SDMwbuyc) — résolu
- [x] [Review][Patch] EncryptionService.encrypt() erreur non catchée hors ZodError → 500 brut avec message interne exposé au client [apps/api/src/modules/onboarding/onboarding.service.ts] — corrigé
- [x] [Review][Patch] Prisma P2025 (tenant not found) non catchée dans le repository → 500 brut au lieu de NotFoundException [apps/api/src/modules/onboarding/onboarding.repository.ts] — corrigé
- [x] [Review][Patch] Badge text "✓ WhatsApp connecté" ≠ spec "✓ Connecté" (AC 8) [apps/web/src/app/onboarding/whatsapp/page.tsx] — corrigé
- [x] [Review][Patch] setTimeout sans clearTimeout via useEffect → navigation sur composant démonté [apps/web/src/app/onboarding/whatsapp/page.tsx] — corrigé
- [x] [Review][Patch] Champs Input non désactivés pendant isSubmitting — double-submit possible [apps/web/src/app/onboarding/whatsapp/page.tsx] — corrigé
- [x] [Review][Defer] Rotation/révocation du token WhatsApp — aucun TTL ni mécanisme de renouvellement — hors scope story 2.3
- [x] [Review][Defer] WABA ID non-unique entre tenants (pas de @unique en DB) — contrainte schéma, hors scope story 2.3
- [x] [Review][Defer] Pattern message.includes('400') fragile — pattern établi en Story 2.1/2.2, refactor global api.ts requis
- [x] [Review][Defer] Protection CSRF absente sur l'endpoint — concern global mitigé par SameSite=Strict, pre-existing
- [x] [Review][Defer] OnboardingStep hardcode total={5} — pattern partagé avec toutes les étapes, refactor transversal
- [x] [Review][Defer] iframe YouTube sans attribut sandbox — concern CSP valide, non bloquant MVP
- [x] [Review][Defer] ENCRYPTION_KEY validation chars vs bytes — infrastructure pre-existante, hors scope

### Change Log

- 2026-05-20 : Story 2.3 créée — connexion WhatsApp Business, chiffrement AES-256-GCM token, tutoriel vidéo + bouton SOS
- 2026-05-20 : Story 2.3 implémentée — endpoint POST /whatsapp-connect backend, schéma Zod partagé, page wizard étape 2 frontend
- 2026-05-20 : Story 2.3 code review — 1 decision-needed, 5 patches, 7 deferred, 14 dismissed
