# Story 2.2 : Wizard Étape 1 — Profil Boutique

Status: done

## Story

En tant que **vendeur en cours d'onboarding**,
je veux configurer le nom et le logo de ma boutique,
afin que mon agent IA puisse se présenter avec mon identité de marque lors des conversations.

## Acceptance Criteria

1. `PATCH /api/v1/onboarding/profile` avec `name` valide → `Tenant.name` mis à jour, réponse `{ data: { name: string, logoUrl: string | null } }`
2. `PATCH /api/v1/onboarding/profile` avec fichier `logo` (image JPEG/PNG/WebP, ≤ 5 MB) → fichier uploadé sur Cloudflare R2 sous `{tenantId}/logos/{uuid}`, `Tenant.logoUrl` mis à jour avec la clé R2
3. `PATCH /api/v1/onboarding/profile` sans `name` ou `name` vide → `400 Bad Request`, message humain
4. `PATCH /api/v1/onboarding/profile` avec fichier > 5 MB → `413 Payload Too Large`, message humain
5. `PATCH /api/v1/onboarding/profile` avec MIME type non-image → `415 Unsupported Media Type`, message humain
6. La page `/onboarding` affiche `<OnboardingStep stepNumber={1} total={5} title="Profil boutique" status="active" />` visible en permanence (UX-DR18)
7. Le formulaire contient : champ "Nom de votre boutique" (obligatoire) + bouton upload logo "Ajouter un logo (optionnel)" avec prévisualisation de l'image sélectionnée
8. Soumission avec nom valide → appel `PATCH /api/v1/onboarding/profile`, succès → redirection vers `/onboarding/whatsapp` (étape 2)
9. Champ nom vide → message "Le nom de la boutique est obligatoire" affiché immédiatement (validation côté client)
10. Bouton "Continuer" désactivé pendant la soumission (`isSubmitting`)

## Tasks / Subtasks

- [x] Tâche 1 : Schéma Zod partagé `onboarding.schema.ts` (AC: 1, 3, 9)
  - [x] Créer `packages/shared/src/schemas/onboarding.schema.ts`
  - [x] Exporter `updateProfileSchema = z.object({ name: z.string().trim().min(1, ...).max(100) })` (trim avant min pour valider les espaces seuls)
  - [x] Exporter `type UpdateProfileDto = z.infer<typeof updateProfileSchema>`
  - [x] Ajouter `export * from './onboarding.schema'` dans `packages/shared/src/schemas/index.ts`

- [x] Tâche 2 : Installer `@types/multer` (AC: 2, 4, 5)
  - [x] `pnpm add --filter @whatsell/api -D @types/multer`
  - [x] Vérifier que `Express.Multer.File` est résolu en TypeScript dans le controller

- [x] Tâche 3 : `OnboardingRepository` — accès Prisma (AC: 1, 2)
  - [x] Créer `apps/api/src/modules/onboarding/onboarding.repository.ts`
  - [x] Injecter `PrismaService` (global via `PrismaModule`)
  - [x] Méthode `updateProfile(tenantId: string, data: { name: string; logoUrl?: string })` :
    `prisma.tenant.update({ where: { id: tenantId }, data: { name, ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }) } })`
  - [x] Retourner `{ name: string, logoUrl: string | null }`

- [x] Tâche 4 : `OnboardingService` — logique métier (AC: 1, 2, 3)
  - [x] Créer `apps/api/src/modules/onboarding/onboarding.service.ts`
  - [x] Injecter `OnboardingRepository` et `StorageService` (global via `CommonModule`, pas d'import supplémentaire)
  - [x] Méthode `updateProfile(tenantId: string, name: string, logoFile?: Express.Multer.File)` :
    1. `updateProfileSchema.parse({ name })` → lève `BadRequestException` si invalide (via `ZodError`)
    2. Si `logoFile` présent : `const logoKey = await storageService.upload(tenantId, 'logos', logoFile.buffer, logoFile.mimetype)`
    3. `return onboardingRepository.updateProfile(tenantId, { name, logoUrl: logoKey })`

- [x] Tâche 5 : `OnboardingController` — endpoint PATCH /profile (AC: 1–5)
  - [x] Créer `apps/api/src/modules/onboarding/onboarding.controller.ts`
  - [x] `@Controller('onboarding')` + `@Patch('profile')`
  - [x] `@UseInterceptors(FileInterceptor('logo', { limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter }))`
  - [x] `fileFilter` : accepter `image/jpeg`, `image/png`, `image/webp` uniquement → callback `cb(new UnsupportedMediaTypeException(...), false)` sinon
  - [x] Paramètres : `@CurrentTenant() tenantId: string`, `@Body('name') name: string`, `@UploadedFile() logoFile?: Express.Multer.File`
  - [x] Capturer `MulterError` avec code `LIMIT_FILE_SIZE` → `throw new PayloadTooLargeException('Le logo ne peut pas dépasser 5 Mo')`
  - [x] Appeler `onboardingService.updateProfile(tenantId, name, logoFile)`

- [x] Tâche 6 : `OnboardingModule` — enregistrement (AC: 1)
  - [x] Créer `apps/api/src/modules/onboarding/onboarding.module.ts`
  - [x] Importer `MulterModule.register({ limits: { fileSize: 5 * 1024 * 1024 } })`
  - [x] Déclarer `OnboardingController`, providers `[OnboardingService, OnboardingRepository]`
  - [x] Ajouter `OnboardingModule` dans `imports` de `AppModule` (`apps/api/src/app.module.ts`), après `AuthModule`

- [x] Tâche 7 : Test unitaire `onboarding.service.spec.ts` (AC: 1, 2, 3)
  - [x] Créer `apps/api/src/modules/onboarding/onboarding.service.spec.ts`
  - [x] Mock `OnboardingRepository` + `StorageService`
  - [x] Test : nom valide, pas de logo → `updateProfile` appelé avec `{ name, logoUrl: undefined }`, `storageService.upload` non appelé
  - [x] Test : nom valide + logo → `storageService.upload` appelé, `updateProfile` appelé avec la clé R2 retournée
  - [x] Test : nom vide → `BadRequestException` levée (ZodError converti dans le service)
  - [x] Test bonus : nom espaces seuls → `BadRequestException` levée après trim

- [x] Tâche 8 : Frontend — Ajouter `apiFormData` dans `api.ts` (AC: 8)
  - [x] Ouvrir `apps/web/src/lib/api.ts`
  - [x] Ajouter fonction `apiFormData<T>(method: string, endpoint: string, formData: FormData): Promise<T>` :
    - Appeler `fetch(...)` directement **sans** header `Content-Type` (le browser le set automatiquement avec le multipart boundary)
    - Inclure `credentials: 'include'`
    - Même gestion d'erreur que `apiPost`

- [x] Tâche 9 : Frontend — Page `/onboarding` (AC: 6–10)
  - [x] Créer `apps/web/src/app/onboarding/page.tsx` (`'use client'`)
  - [x] Afficher `<OnboardingStep stepNumber={1} total={5} title="Profil boutique" status="active" />`
  - [x] React Hook Form + `zodResolver(updateProfileSchema)` pour le champ `name`
  - [x] Champ `name` : `<Input>` de `@/components/ui/input` (créé en Story 2.1)
  - [x] Upload logo : `<input type="file" accept="image/jpeg,image/png,image/webp">` dans un `useState<File | null>`, prévisualisation via `URL.createObjectURL(file)` — libérer au unmount avec `useEffect` + `URL.revokeObjectURL`
  - [x] Soumission : construire `FormData`, append `name` + optionnellement `logo` → `apiFormData<{ data: { name: string; logoUrl: string | null } }>('PATCH', '/api/v1/onboarding/profile', formData)`
  - [x] Succès → `router.push('/onboarding/whatsapp')` (page créée en Story 2.3 — pour l'instant placeholder)
  - [x] Erreur → afficher message humain sous le formulaire via `setError('root', ...)`
  - [x] Bouton "Continuer" : `w-full h-12`, `disabled={isSubmitting}`

## Dev Notes

### Contexte Critique — Architecture Existante

**Ne pas recréer ni modifier :**
- `StorageService` — `@Global()` dans `CommonModule`, injectable directement dans `OnboardingService` sans import dans le module. Signature : `upload(tenantId: string, type: StorageType, file: Buffer, mimeType: string): Promise<string>` — retourne la **clé R2** (ex: `"abc-123/logos/uuid"`), pas une URL signée.
- `@CurrentTenant()` décorateur — extrait `tenantId` depuis `AsyncLocalStorage`. Import : `import { CurrentTenant } from '../../common/decorators'`
- `TenantMiddleware` déjà appliqué à `/api/v1/*` dans `AppModule` — aucune configuration additionnelle
- `JwtAuthGuard` + `RolesGuard` globaux — toutes les routes sont protégées par défaut sans `@UseGuards`

**Schema Prisma — aucune migration requise :**
Le modèle `Tenant` (`apps/api/prisma/schema.prisma`) contient déjà :
```prisma
model Tenant {
  name      String      // sera remplacé par le vrai nom de boutique
  logoUrl   String?     // null par défaut — à renseigner si logo uploadé
  ...
}
```
Le champ `name` est initialisé au slug d'email lors de l'inscription (Story 2.1) — cette story le remplace par le vrai nom de boutique.

### Structure Cible Backend

```
apps/api/src/modules/onboarding/
├── onboarding.module.ts        ← NOUVEAU
├── onboarding.controller.ts    ← NOUVEAU — PATCH /profile
├── onboarding.service.ts       ← NOUVEAU
├── onboarding.repository.ts    ← NOUVEAU
├── dto/                        ← (vide pour l'instant — validation via Zod dans service)
└── onboarding.service.spec.ts  ← NOUVEAU
```

### Pattern FileInterceptor — Code Complet

```typescript
// onboarding.controller.ts
import {
  Controller, Patch, Body, UploadedFile, UseInterceptors,
  UnsupportedMediaTypeException, PayloadTooLargeException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { MulterError } from 'multer';
import { CurrentTenant } from '../../common/decorators';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const imageFilter = (
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, accept: boolean) => void,
) => {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    cb(new UnsupportedMediaTypeException('Format non supporté. Utilisez JPEG, PNG ou WebP.'), false);
    return;
  }
  cb(null, true);
};

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Patch('profile')
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: imageFilter,
    }),
  )
  async updateProfile(
    @CurrentTenant() tenantId: string,
    @Body('name') name: string,
    @UploadedFile() logoFile?: Express.Multer.File,
  ) {
    return this.onboardingService.updateProfile(tenantId, name, logoFile);
  }
}
```

**Attention `MulterError LIMIT_FILE_SIZE`** : Multer lève une `MulterError` (pas une `HttpException`) quand le fichier dépasse la limite. `AllExceptionsFilter` global l'intercepte mais peut la transformer en 500 par défaut. Ajouter un try/catch dans le controller :

```typescript
try {
  return await this.onboardingService.updateProfile(tenantId, name, logoFile);
} catch (err) {
  if (err instanceof MulterError && err.code === 'LIMIT_FILE_SIZE') {
    throw new PayloadTooLargeException('Le logo ne peut pas dépasser 5 Mo.');
  }
  throw err;
}
```

### Pattern Upload Frontend — PROBLÈME CRITIQUE apiClient

`apiClient` dans `apps/web/src/lib/api.ts` set automatiquement `'Content-Type': 'application/json'` quand `body !== undefined`. Cela **casse le multipart/form-data** (le boundary est perdu). **Ne pas utiliser `apiPatch` ou `apiPost`** pour cet upload.

Ajouter cette fonction dans `apps/web/src/lib/api.ts` :

```typescript
// À ajouter dans api.ts — après apiDelete
export async function apiFormData<T>(
  method: string,
  endpoint: string,
  formData: FormData,
): Promise<T> {
  // Pas de Content-Type — le browser set automatiquement multipart/form-data + boundary
  const response = await fetch(`${getBaseUrl()}${endpoint}`, {
    method,
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`${method} ${endpoint} échoué : ${response.status}`);
  }
  return parseJsonSafe<T>(response, `${method} ${endpoint}`);
}
```

### Routing Frontend — Décision Architecture

L'architecture définit une seule `apps/web/src/app/onboarding/page.tsx`. Pour le wizard multi-étapes, deux approches possibles :
- **Option A** (choisie pour cette story) : page unique `/onboarding` avec state local `currentStep` — les stories 2.3–2.6 ajouteront les étapes suivantes dans ce fichier ou en sous-routes
- **Option B** : sous-routes `/onboarding/profile`, `/onboarding/whatsapp`, etc.

Pour cette story : créer `/onboarding/page.tsx` affichant uniquement l'étape 1. La redirection cible `router.push('/onboarding/whatsapp')` est un placeholder pour Story 2.3.

### Déferred Work à Adresser dans Cette Story

- **DEF-03 de Story 1.8** : "Validation de taille fichier et MIME type non implémentée dans `StorageService` — à implémenter dans les DTOs contrôleurs lors des stories 2.2 et 5.6." → **Cette story doit implémenter la validation** via Multer `limits` + `fileFilter` dans le controller.

### Learnings de la Story 2.1 — Patterns Établis

- `apps/web/src/components/ui/input.tsx` existe (créé en Story 2.1) — utiliser directement
- `@hookform/resolvers` est installé dans `apps/web` — utiliser `zodResolver`
- Le pattern `setError('root', { message: '...' })` est le pattern établi pour les erreurs serveur
- `apiPost` lève `Error` avec message `"POST /path échoué : 409"` — parser via `err.message.includes('409')`
- `ResponseWrapperInterceptor` global enveloppe **automatiquement** toutes les réponses NestJS dans `{ data: ... }` — ne jamais envelopper manuellement dans les services/controllers
- Les tests `auth.service.spec.ts` avaient 4 pre-existing failures non liés (notifications DTO, StorageService, encryption, Notification JSDOM) — ignorer ces failures si elles persistent

### Contraintes Mobile-First 360px

- Container principal : `max-w-sm mx-auto px-4` (cohérent avec layout auth)
- Input nom : `h-12` (48px — touch target)
- Bouton submit : `w-full h-12`, `rounded-lg`
- Zone upload logo : minimum 44×44px, zone de tap claire avec label descriptif
- Prévisualisation logo : `w-16 h-16 rounded-lg object-cover border border-border`
- Messages d'erreur : apparaissent au blur (jamais en temps réel pendant la saisie)

### Project Structure Notes

- `OnboardingModule` ajouté dans `app.module.ts` — après `AuthModule`, avant `QueuesModule`
- `@types/multer` à installer en devDependency dans `apps/api` — pas encore présent dans `package.json`
- Route `/onboarding` hors du groupe `(auth)` — pas de layout auth, pas de navigation dashboard non plus (vendeur en cours d'onboarding)
- `PrismaModule` est `@Global()` — `PrismaService` injectable dans `OnboardingRepository` sans import explicite dans `OnboardingModule`

### References

- Architecture onboarding : [architecture.md — Mapping FR → Structure](../../planning-artifacts/architecture.md) — FR2, FR3, FR4 mappés à `modules/onboarding/`
- UX wizard (Flux 1) : [ux-design-specification.md — Flux 1 Activation Vendeur](../../planning-artifacts/ux-design-specification.md)
- `StorageService` : [storage.service.ts](../../../apps/api/src/common/services/storage.service.ts) — `upload()` retourne clé R2, pas URL
- `CommonModule` (`@Global`) : [common.module.ts](../../../apps/api/src/common/common.module.ts) — `StorageService` globalement disponible
- `@CurrentTenant()` : [current-tenant.decorator.ts](../../../apps/api/src/common/decorators/current-tenant.decorator.ts)
- `OnboardingStep` composant : [OnboardingStep.tsx](../../../apps/web/src/components/shared/OnboardingStep.tsx) — props: `{ stepNumber, total, title, status, onClick? }`
- `apiClient` frontend : [api.ts](../../../apps/web/src/lib/api.ts) — ajouter `apiFormData` pour multipart
- Schema Prisma : [schema.prisma](../../../apps/api/prisma/schema.prisma) — `Tenant.name` et `Tenant.logoUrl` existent déjà
- Schémas partagés : [schemas/index.ts](../../../packages/shared/src/schemas/index.ts) — ajouter export `onboarding.schema.ts`
- Story précédente (patterns) : [2-1-page-inscription-et-creation-de-compte.md](./2-1-page-inscription-et-creation-de-compte.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Fix schéma Zod : ordre `.min(1).trim()` → `.trim().min(1)` pour que les espaces seuls soient refusés après trim (1 test échouait avant correction)
- `@types/multer` installé via `pnpm.cmd` (pnpm non présent dans PATH système, trouvé dans `AppData/Roaming/npm`)
- Rebuild `@whatsell/shared` requis après ajout du nouveau schéma (`pnpm --filter @whatsell/shared build`)

### Completion Notes List

- **Tâche 1** : `packages/shared/src/schemas/onboarding.schema.ts` créé avec `updateProfileSchema` (`.trim()` en premier pour valider les espaces seuls). `packages/shared/src/schemas/index.ts` mis à jour avec re-export.
- **Tâche 2** : `@types/multer` installé comme devDependency dans `apps/api`.
- **Tâche 3** : `OnboardingRepository` créé avec méthode `updateProfile` utilisant `prisma.tenant.update` + `select` sur `{ name, logoUrl }`.
- **Tâche 4** : `OnboardingService` créé, convertit `ZodError` en `BadRequestException`, appelle `storageService.upload` uniquement si logo présent.
- **Tâche 5** : `OnboardingController` créé avec `FileInterceptor`, `imageFilter` MIME type et try/catch pour `MulterError LIMIT_FILE_SIZE` → `PayloadTooLargeException`.
- **Tâche 6** : `OnboardingModule` créé et enregistré dans `AppModule` après `AuthModule`.
- **Tâche 7** : 4 tests unitaires — 3 requis + 1 bonus (espaces seuls) — tous PASS.
- **Tâche 8** : `apiFormData` ajouté dans `api.ts` sans Content-Type (multipart boundary géré par le browser).
- **Tâche 9** : Page `/onboarding/page.tsx` créée, mobile-first, avec `OnboardingStep`, React Hook Form, preview logo via `URL.createObjectURL` libéré au unmount.
- **Régression** : 0 nouvelles failures. 4 failures pré-existantes confirmées dans `encryption.service.spec.ts` et `storage.service.spec.ts` (non liées à cette story).

### File List

packages/shared/src/schemas/onboarding.schema.ts (nouveau)
packages/shared/src/schemas/index.ts (modifié — ajout export onboarding.schema)
apps/api/package.json (modifié — @types/multer devDependency)
pnpm-lock.yaml (modifié — lockfile mis à jour)
apps/api/src/modules/onboarding/onboarding.repository.ts (nouveau)
apps/api/src/modules/onboarding/onboarding.service.ts (nouveau)
apps/api/src/modules/onboarding/onboarding.controller.ts (nouveau)
apps/api/src/modules/onboarding/onboarding.module.ts (nouveau)
apps/api/src/modules/onboarding/onboarding.service.spec.ts (nouveau)
apps/api/src/app.module.ts (modifié — import + enregistrement OnboardingModule)
apps/web/src/lib/api.ts (modifié — ajout apiFormData)
apps/web/src/app/onboarding/page.tsx (nouveau)

### Change Log

- 2026-05-19 : Story 2.2 implémentée — module Onboarding backend (repository, service, controller, module), schéma Zod partagé, `apiFormData` frontend, page wizard étape 1 `/onboarding`

### Review Findings

- [x] [Review][Patch] Typo dans le chemin d'import du repository — faux positif (fichier déjà correct) [apps/api/src/modules/onboarding/onboarding.module.ts:5]
- [x] [Review][Patch] try/catch MulterError dans le controller est code mort — NestJS 11 `transformException` gère déjà LIMIT_FILE_SIZE → 413. Supprimé. [apps/api/src/modules/onboarding/onboarding.controller.ts]
- [x] [Review][Patch] `@Body('name')` absent → `required_error` ajouté au schéma Zod pour message français [packages/shared/src/schemas/onboarding.schema.ts]
- [x] [Review][Patch] Valeur retournée par `updateProfileSchema.parse()` utilisée (`validatedName`) → nom trimmé stocké en base [apps/api/src/modules/onboarding/onboarding.service.ts]
- [x] [Review][Defer] Upload R2 avant écriture DB → objet orphelin si la DB échoue après l'upload [apps/api/src/modules/onboarding/onboarding.service.ts] — deferred, pre-existing architectural pattern
- [x] [Review][Defer] Ancien logo non supprimé de R2 lors d'un re-upload [apps/api/src/modules/onboarding/onboarding.repository.ts] — deferred, hors scope des AC Story 2.2
- [x] [Review][Defer] `UnsupportedMediaTypeException` dans fileFilter — propagation 415 version-dépendante [apps/api/src/modules/onboarding/onboarding.controller.ts] — deferred, à vérifier via test d'intégration
- [x] [Review][Defer] Détection d'erreur frontend via `message.includes('413')` fragile [apps/web/src/app/onboarding/page.tsx] — deferred, pattern établi en Story 2.1
- [x] [Review][Defer] `apiFormData` ne lit pas le corps de la réponse erreur [apps/web/src/lib/api.ts] — deferred, cohérent avec le pattern existant api.ts
- [x] [Review][Defer] `StorageService` lève `Error` plain quand R2 non configuré → flood Sentry en dev [apps/api/src/common/services/storage.service.ts] — deferred, pre-existing depuis Story 1.8
