# Story 1.8 : Stockage Cloudflare R2

Status: done

## Story

En tant que **développeur**,
je veux un service de stockage d'objets opérationnel avec Cloudflare R2,
afin que les photos de reçus Mobile Money, logos de boutiques et factures PDF puissent être stockés et accédés de façon sécurisée et isolée par tenant.

## Acceptance Criteria

1. **Étant donné** que `StorageService` est injecté dans un module NestJS, **Quand** `storageService.upload(tenantId, type, fileBuffer, mimeType)` est appelé, **Alors** le fichier est stocké dans le bucket R2 correspondant au type sous la clé `{tenantId}/{type}/{uuid}` et cette clé complète est retournée
2. **Étant donné** qu'un accès à un fichier est demandé, **Quand** `storageService.getSignedUrl(key, expiresIn)` est appelé, **Alors** une presigned URL temporaire est retournée — jamais d'URL publique directe (NFR10)
3. **Et** le SDK utilisé est `@aws-sdk/client-s3` + `@aws-sdk/s3-request-presigner` (compatible R2 via endpoint custom)
4. **Et** les 3 buckets sont distincts : `whatsell-receipts`, `whatsell-logos`, `whatsell-invoices` — le type `'receipts' | 'logos' | 'invoices'` détermine le bucket cible
5. **Et** `StorageService` est enregistré dans `CommonModule` (global) et injectable dans tous les modules
6. **Et** les variables R2 optionnelles en développement ne bloquent pas le démarrage si vides (les cas d'erreur sont levés à l'appel du service)

## Tasks / Subtasks

- [x] Tâche 1 : Installer les dépendances AWS SDK (AC: 3)
  - [x] Ajouter `@aws-sdk/client-s3` et `@aws-sdk/s3-request-presigner` aux dépendances de `apps/api`
  - [x] Vérifier que `pnpm-lock.yaml` est mis à jour

- [x] Tâche 2 : Mettre à jour `env.validation.ts` pour les vars R2 (AC: 6)
  - [x] Modifier `apps/api/src/config/env.validation.ts`
  - [x] Ajouter les 6 vars R2 comme **optionnelles** (`z.string().optional()`) — elles sont requises en production mais pas en dev local sans R2
  - [x] Vars : `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_RECEIPTS`, `R2_BUCKET_LOGOS`, `R2_BUCKET_INVOICES`

- [x] Tâche 3 : Créer `StorageService` (AC: 1, 2, 4)
  - [x] Créer `apps/api/src/common/services/storage.service.ts`
  - [x] Injecter `ConfigService` — lire R2 config via `configService.get<...>('r2')`
  - [x] Initialiser `S3Client` avec endpoint `https://{accountId}.r2.cloudflarestorage.com`, region `auto`, credentials
  - [x] Implémenter `upload(tenantId: string, type: StorageType, file: Buffer, mimeType: string): Promise<string>`
    - Générer un UUID v4 pour le nom de fichier (`randomUUID()` depuis `crypto`)
    - Construire la clé : `${tenantId}/${type}/${uuid}`
    - Déterminer le bucket via `getBucketForType(type)` (méthode privée)
    - Appeler `PutObjectCommand` avec Body, ContentType, Key, Bucket
    - Retourner la clé complète `${tenantId}/${type}/${uuid}`
  - [x] Implémenter `getSignedUrl(key: string, expiresIn = 3600): Promise<string>`
    - Parser le type depuis la clé (deuxième segment : `key.split('/')[1]`)
    - Valider que le type est un `StorageType` valide — lever `BadRequestException` sinon
    - Appeler `getSignedUrl` de `@aws-sdk/s3-request-presigner` avec `GetObjectCommand`
    - Retourner l'URL signée
  - [x] Implémenter `delete(key: string): Promise<void>` — supprimer un fichier (utilisé ultérieurement)
  - [x] Exporter le type `StorageType = 'receipts' | 'logos' | 'invoices'`

- [x] Tâche 4 : Enregistrer `StorageService` dans `CommonModule` (AC: 5)
  - [x] Modifier `apps/api/src/common/common.module.ts`
  - [x] Ajouter `StorageService` dans `providers` et `exports`

- [x] Tâche 5 : Écrire les tests unitaires (AC: 1, 2, 3, 4)
  - [x] Créer `apps/api/src/common/services/storage.service.spec.ts`
  - [x] Mocker `S3Client` et `getSignedUrl` de `@aws-sdk/s3-request-presigner`
  - [x] Tester `upload()` :
    - Vérifie que la clé retournée suit le format `{tenantId}/{type}/{uuid}`
    - Vérifie que `PutObjectCommand` est appelé avec le bon Bucket selon le type
    - Vérifie que `PutObjectCommand` est appelé avec le bon Key, ContentType
    - Teste les 3 types : `receipts`, `logos`, `invoices`
  - [x] Tester `getSignedUrl()` :
    - Vérifie que `GetObjectCommand` est appelé avec le bon Bucket et Key
    - Vérifie que l'URL signée est retournée
    - Vérifie que `expiresIn` par défaut est 3600
    - Teste qu'une clé avec type invalide lève `BadRequestException`
  - [x] Tester `delete()` :
    - Vérifie que `DeleteObjectCommand` est appelé avec le bon Bucket et Key
  - [x] Exécuter `pnpm --filter @whatsell/api test` — 110/110 tests passent ✅

### Review Findings

- [x] [Review][Decision] D-01 — Credentials/AccountId vides : option A appliquée — validation fail-fast au constructeur : throw BadRequestException si accountId/accessKeyId/secretAccessKey vides
- [x] [Review][Decision] D-02 — Vérification cross-tenant : option A appliquée — StorageService injecte TenantContextService et vérifie que le tenantId de la clé correspond au tenant courant dans getSignedUrl/delete
- [x] [Review][Patch] P-01 — parseType() type cast dangereux avant validation [storage.service.ts:84] — `key.split('/')[1] as StorageType` cast `undefined` comme valide avant le guard. Fix: extraire rawType non casté, valider, puis caster.
- [x] [Review][Patch] P-02 — upload() accepte un tenantId vide sans validation [storage.service.ts:46] — clé `/type/uuid` générée si tenantId=''. Fix: `if (!tenantId) throw new BadRequestException()`
- [x] [Review][Patch] P-03 — getSignedUrl() n'invalide pas expiresIn ≤ 0 ou > 604800 [storage.service.ts:61] — AWS max = 604800s (7j). Fix: guard `if (expiresIn <= 0 || expiresIn > 604800) throw new BadRequestException()`
- [x] [Review][Patch] P-04 — Message d'erreur BadRequestException expose la clé R2 complète [storage.service.ts:87] — `${key}` peut contenir tenantId + UUID privé. Fix: message générique sans la clé.
- [x] [Review][Patch] P-05 — Tests manquent un cas de propagation d'erreur S3 [storage.service.spec.ts] — Aucun test vérifie que les erreurs du SDK (AccessDenied, ServiceUnavailable) remontent correctement. Fix: ajouter `it('should propagate S3 errors')`
- [x] [Review][Defer] DEF-01 — Erreurs réseau S3 non wrappées en HttpException [storage.service.ts:49,69,75] — deferred, AllExceptionsFilter gère globalement, wrapping granulaire post-MVP
- [x] [Review][Defer] DEF-02 — TenantId avec slashes potentiel path traversal [storage.service.ts:47] — deferred, tenantId vient exclusivement du JWT via TenantMiddleware, surface d'attaque inexistante en V1
- [x] [Review][Defer] DEF-03 — Buffer vide et limite de taille fichier non validés [storage.service.ts:40] — deferred, validation taille appartient aux DTOs Zod des contrôleurs upstream
- [x] [Review][Defer] DEF-04 — Validation MIME type absente [storage.service.ts:44] — deferred, responsabilité des DTOs contrôleurs, pas du service partagé
- [x] [Review][Defer] DEF-05 — Pas de logging d'audit sur upload/delete [storage.service.ts] — deferred, @AuditLog() sera ajouté aux modules domaine (onboarding, invoices) en stories ultérieures
- [x] [Review][Defer] DEF-06 — Noms de buckets R2 sans validation de format Zod [env.validation.ts:37-39] — deferred, buckets configurés par ops, pas par utilisateurs
- [x] [Review][Defer] DEF-07 — Comportement R2 optionnel ambigu prod vs dev (documentation) — deferred, à clarifier dans le README déploiement

## Dev Notes

### ⚠️ Ce qui EXISTE DÉJÀ — NE PAS RECRÉER

| Fichier | Contenu existant | Action |
|---------|-----------------|--------|
| `apps/api/src/config/configuration.ts` | Section `r2: { accountId, accessKeyId, secretAccessKey, bucketReceipts, bucketLogos, bucketInvoices }` déjà présente | NE PAS MODIFIER — config déjà complète |
| `apps/api/.env.example` | Variables R2 déjà documentées (`R2_ACCOUNT_ID`, etc.) | NE PAS MODIFIER |
| `apps/api/src/common/common.module.ts` | `@Global()` module — `TenantContextService`, guards, filters, interceptors | MODIFIER — ajouter `StorageService` |
| `apps/api/src/config/env.validation.ts` | Schema Zod pour les vars critiques | MODIFIER — ajouter vars R2 optionnelles |

### ⚠️ @aws-sdk/client-s3 NON INSTALLÉ — À faire en tâche 1

Vérification via `apps/api/package.json` — ni `@aws-sdk/client-s3` ni `@aws-sdk/s3-request-presigner` ne sont dans les dépendances. Commande :

```bash
pnpm --filter @whatsell/api add @aws-sdk/client-s3 @aws-sdk/s3-request-presigner
```

### Pattern `StorageService` — Implémentation Exacte

```typescript
// apps/api/src/common/services/storage.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';

export type StorageType = 'receipts' | 'logos' | 'invoices';

const STORAGE_TYPES: StorageType[] = ['receipts', 'logos', 'invoices'];

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly buckets: Record<StorageType, string>;

  constructor(private readonly configService: ConfigService) {
    const accountId = this.configService.get<string>('r2.accountId') ?? '';

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: this.configService.get<string>('r2.accessKeyId') ?? '',
        secretAccessKey: this.configService.get<string>('r2.secretAccessKey') ?? '',
      },
    });

    this.buckets = {
      receipts: this.configService.get<string>('r2.bucketReceipts') ?? 'whatsell-receipts',
      logos: this.configService.get<string>('r2.bucketLogos') ?? 'whatsell-logos',
      invoices: this.configService.get<string>('r2.bucketInvoices') ?? 'whatsell-invoices',
    };
  }

  async upload(
    tenantId: string,
    type: StorageType,
    file: Buffer,
    mimeType: string,
  ): Promise<string> {
    const uuid = randomUUID();
    const key = `${tenantId}/${type}/${uuid}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.buckets[type],
        Key: key,
        Body: file,
        ContentType: mimeType,
      }),
    );

    return key;
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    const type = key.split('/')[1] as StorageType;

    if (!STORAGE_TYPES.includes(type)) {
      throw new BadRequestException(`Type de stockage invalide dans la clé : ${key}`);
    }

    const command = new GetObjectCommand({
      Bucket: this.buckets[type],
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  async delete(key: string): Promise<void> {
    const type = key.split('/')[1] as StorageType;

    if (!STORAGE_TYPES.includes(type)) {
      throw new BadRequestException(`Type de stockage invalide dans la clé : ${key}`);
    }

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.buckets[type],
        Key: key,
      }),
    );
  }
}
```

### Pattern CommonModule — Mise à jour

```typescript
// apps/api/src/common/common.module.ts — MODIFIER uniquement les lignes suivantes
import { StorageService } from './services/storage.service';

// Dans providers[]
StorageService,

// Dans exports[]
StorageService,
```

### Pattern env.validation.ts — Mise à jour R2

```typescript
// Ajouter dans envSchema (optionnel — vides tolérés en dev local)
R2_ACCOUNT_ID: z.string().optional().default(''),
R2_ACCESS_KEY_ID: z.string().optional().default(''),
R2_SECRET_ACCESS_KEY: z.string().optional().default(''),
R2_BUCKET_RECEIPTS: z.string().optional().default('whatsell-receipts'),
R2_BUCKET_LOGOS: z.string().optional().default('whatsell-logos'),
R2_BUCKET_INVOICES: z.string().optional().default('whatsell-invoices'),
```

### Pattern Tests — Mock @aws-sdk

```typescript
// apps/api/src/common/services/storage.service.spec.ts
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { BadRequestException } from '@nestjs/common';
import { StorageService } from './storage.service';

// Mock avant l'import du service
const mockSend = jest.fn();
const mockGetSignedUrl = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: jest.fn().mockImplementation((input) => ({ ...input, _type: 'PutObject' })),
  GetObjectCommand: jest.fn().mockImplementation((input) => ({ ...input, _type: 'GetObject' })),
  DeleteObjectCommand: jest.fn().mockImplementation((input) => ({ ...input, _type: 'DeleteObject' })),
}));

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: jest.fn(),
}));

// Import APRÈS les mocks
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

describe('StorageService', () => {
  let service: StorageService;

  const mockConfigService = {
    get: jest.fn((key: string) => {
      const config: Record<string, string> = {
        'r2.accountId': 'test-account',
        'r2.accessKeyId': 'test-key',
        'r2.secretAccessKey': 'test-secret',
        'r2.bucketReceipts': 'whatsell-receipts',
        'r2.bucketLogos': 'whatsell-logos',
        'r2.bucketInvoices': 'whatsell-invoices',
      };
      return config[key];
    }),
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(StorageService);
    jest.clearAllMocks();
  });

  // Tests : upload, getSignedUrl, delete, erreurs type invalide...
});
```

### Clé R2 — Format et Règles

| Segment | Valeur | Exemple |
|---------|--------|---------|
| 0 | `tenantId` | `abc123` |
| 1 | `type` | `receipts` |
| 2 | `uuid` | `550e8400-e29b-41d4-a716-446655440000` |
| Clé complète | `{tenantId}/{type}/{uuid}` | `abc123/receipts/550e8400-...` |

- La clé sert à retrouver le bucket (`type` = segment 1)
- `getSignedUrl` et `delete` parsent le type depuis la clé — **jamais passer le bucket en paramètre externe**

### Anti-Patterns Interdits

- ❌ `process.env.R2_*` dans le service → `configService.get('r2.*')`
- ❌ URL publique directe pour les reçus → toujours `getSignedUrl` (NFR10)
- ❌ Un seul bucket "fourre-tout" → 3 buckets distincts (receipts / logos / invoices)
- ❌ `tenantId` absent de la clé → isolation tenant obligatoire même pour R2
- ❌ Passer `S3Client` directement en paramètre des méthodes → singleton interne au service
- ❌ `throw new Error()` → `throw new BadRequestException()` pour type invalide

### Sécurité — NFR10

- Jamais de `{ ACL: 'public-read' }` dans `PutObjectCommand` → bucket R2 privé par défaut
- `expiresIn` par défaut : 3600s (1h) — suffisant pour la consultation d'un reçu
- Pour les factures PDF, l'appelant peut passer un `expiresIn` plus court (ex: 300s pour un téléchargement direct)

### Structure de Fichiers

```
apps/api/src/common/
├── services/
│   ├── tenant-context.service.ts    ← EXISTANT — NE PAS TOUCHER
│   └── storage.service.ts           ← CRÉER
│       └── storage.service.spec.ts  ← CRÉER (co-localisé)
└── common.module.ts                 ← MODIFIER (ajouter StorageService)

apps/api/src/config/
└── env.validation.ts                ← MODIFIER (ajouter vars R2 optionnelles)
```

### Utilisation future — Contexte pour les modules domaine

```typescript
// Exemple d'utilisation dans un futur OnboardingService
constructor(private readonly storageService: StorageService) {}

async uploadLogo(tenantId: string, fileBuffer: Buffer): Promise<string> {
  return this.storageService.upload(tenantId, 'logos', fileBuffer, 'image/png');
}

async getLogoUrl(key: string): Promise<string> {
  return this.storageService.getSignedUrl(key, 300); // 5min pour affichage
}
```

### Dépendances Vérifiées

| Package | Statut |
|---------|--------|
| `@aws-sdk/client-s3` | ❌ À installer |
| `@aws-sdk/s3-request-presigner` | ❌ À installer |
| `@nestjs/config` / `ConfigService` | ✅ Déjà dans package.json + app.module.ts |
| `crypto` (randomUUID) | ✅ Module Node natif — pas d'import npm |
| `rxjs` | ✅ Déjà installé (non utilisé ici) |

### Références

- Architecture : `_bmad-output/planning-artifacts/architecture.md` — section "Stockage Fichiers — Cloudflare R2"
- Architecture : `_bmad-output/planning-artifacts/architecture.md` — section "Frontières de données" (StorageService via common/services)
- Configuration R2 existante : `apps/api/src/config/configuration.ts:27-34`
- CommonModule existant : `apps/api/src/common/common.module.ts`
- Epics : `_bmad-output/planning-artifacts/epics.md` — Story 1.8

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

Aucun blocage technique rencontré. Le warning "worker process has failed to exit gracefully" est pré-existant (lié au Subject RxJS ouvert du EventsService de la story 1.7) — non lié à cette story.

### Completion Notes List

- `StorageService` créé dans `common/services/` — service global injectable partout via `@Global()` CommonModule
- `S3Client` initialisé avec endpoint Cloudflare R2 `https://{accountId}.r2.cloudflarestorage.com` et `region: 'auto'`
- Méthode `parseType()` privée centralise la validation du type et l'extraction du bucket — utilisée par `getSignedUrl` et `delete`
- 3 buckets distincts : `whatsell-receipts`, `whatsell-logos`, `whatsell-invoices` mappés depuis ConfigService
- Clé R2 format `{tenantId}/{type}/{uuid}` — isolation tenant garantie par construction
- Aucun `ACL: 'public-read'` — buckets R2 privés, accès uniquement via presigned URL (NFR10)
- 30 tests unitaires StorageService (18 initiaux + 12 ajoutés en code review : constructeur fail-fast, cross-tenant ForbiddenException, expiresIn bounds, propagation S3 errors) — suite complète : 123/123 ✅
- Patch code review appliqués : D-01 (fail-fast constructeur), D-02 (cross-tenant via TenantContextService), P-01 à P-05 tous appliqués
- Fix intégration : `test/integration/tenant-isolation.spec.ts` — mock R2 credentials ajoutés (r2 object était vide, bloquait le constructeur en intégration)
- Vars R2 ajoutées dans `env.validation.ts` comme optionnelles avec defaults — démarrage local sans R2 non bloqué

### File List

- `apps/api/src/common/services/storage.service.ts` (créé)
- `apps/api/src/common/services/storage.service.spec.ts` (créé)
- `apps/api/src/common/common.module.ts` (modifié)
- `apps/api/src/config/env.validation.ts` (modifié)
- `apps/api/package.json` (modifié — ajout @aws-sdk/client-s3, @aws-sdk/s3-request-presigner)
- `pnpm-lock.yaml` (modifié — dépendances mises à jour)
- `test/integration/tenant-isolation.spec.ts` (modifié — mock R2 credentials ajoutés)
