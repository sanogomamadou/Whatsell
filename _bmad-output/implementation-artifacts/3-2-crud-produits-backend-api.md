# Story 3.2 : CRUD Produits — Backend API

Status: done

## Story

En tant que **développeur**,
je veux les endpoints REST pour lire, mettre à jour, supprimer et activer/désactiver des produits,
afin que le frontend et l'agent IA puissent gérer le catalogue complet via l'API.

## Acceptance Criteria

1. Étant donné que `GET /api/v1/products` est appelé, Quand la requête est traitée, Alors **tous** les produits du tenant courant (actifs ET inactifs) sont retournés, paginés `{ data: Product[], meta: { total, page, limit } }` — changement comportemental vs Story 2.4 qui filtrait `isActive: true`

2. Étant donné que `GET /api/v1/products/:id` est appelé avec un `id` valide du tenant courant, Quand la requête est traitée, Alors la réponse est `{ data: ProductDetail }` incluant les `stockLevels` (variantKey, quantity, alertThreshold)

3. Étant donné que `PATCH /api/v1/products/:id` est appelé avec un payload partiel valide, Quand la requête est traitée, Alors le produit est mis à jour (seuls les champs fournis changent) et la réponse est `{ data: Product }` (FR22)

4. Étant donné que `DELETE /api/v1/products/:id` est appelé, Quand la requête est traitée, Alors le produit et ses `StockLevel` (cascade Prisma) sont supprimés et la réponse est HTTP 200 `{ data: { id: string } }` — **pas de 204** : `ResponseWrapperInterceptor` global ne gère pas HTTP 204 correctement (Story 1.5 D-02)

5. Étant donné que `PATCH /api/v1/products/:id/toggle` est appelé, Quand la requête est traitée, Alors `isActive` est inversé (`true↔false`) et la réponse est `{ data: Product }` avec le nouvel état (FR25)

6. Étant donné qu'un `:id` n'appartient pas au tenant courant ou n'existe pas, Quand n'importe lequel des endpoints `:id` est appelé, Alors la réponse est HTTP 404 `NotFoundException` — **pas de 403** : ne pas exposer l'existence d'un produit cross-tenant (NFR8)

7. `POST /api/v1/products` (création) — **déjà implémenté en Story 2.4**, ne pas modifier sauf pour le correctif D-03 (ajout `.max()` sur `quantity`)

8. Toutes les routes requièrent le rôle `OWNER` ou `CO_MANAGER` — garanti par `@Roles(Role.OWNER, Role.CO_MANAGER)` au niveau classe sur le controller (déjà en place)

## Tasks / Subtasks

- [x] Tâche 1 : Corriger les items différés de Story 3.1 (AC: 7, D-03, D-04)
  - [x] Dans `packages/shared/src/schemas/product.schema.ts`, ajouter `.max(2_147_483_647, 'Quantité trop élevée')` sur le champ `quantity` dans `createStockLevelSchema` ET `updateStockLevelSchema` — évite l'overflow Postgres `Int` (2^31 - 1)
  - [x] Dans `apps/api/src/modules/products/products.repository.ts`, ajouter `page = Math.max(1, page)` en tête de `findByTenantId` pour éviter un `skip` négatif si `page=0`

- [x] Tâche 2 : Ajouter `updateProductSchema` dans les schémas partagés (AC: 3)
  - [x] Dans `packages/shared/src/schemas/product.schema.ts`, ajouter après `createProductSchema` :
    ```typescript
    export const updateProductSchema = z.object({
      name: z.string().trim().min(1, 'Le nom ne peut pas être vide').max(100).optional(),
      basePrice: z.coerce.number().int('Le prix doit être un entier en FCFA').positive('Le prix doit être supérieur à 0').max(100_000_000).optional(),
      description: z.string().trim().max(500).nullable().optional(),
    });
    export type UpdateProductDto = z.infer<typeof updateProductSchema>;
    ```
  - [x] Exporter `updateProductSchema` et `UpdateProductDto` depuis `packages/shared/src/schemas/index.ts` (ou directement depuis `src/index.ts` selon le barrel existant)

- [x] Tâche 3 : Étendre `ProductsRepository` (AC: 1, 2, 3, 4, 5, 6)
  - [x] Retirer le filtre `isActive: true` de `findByTenantId` : `where: { tenantId }` (sans `isActive`) — la liste de gestion retourne tous les produits
  - [x] Ajouter `findByIdAndTenant(id, tenantId)` → retourne le produit avec ses `stockLevels` ou `null` si absent/non-propriétaire (jamais lever d'exception ici — la logique 404 appartient au service)
  - [x] Ajouter `updateById(id, tenantId, data)` → met à jour uniquement les champs fournis (`name`, `basePrice`, `description`, `imageUrl`), retourne le produit mis à jour
  - [x] Ajouter `deleteById(id, tenantId)` → `prisma.product.delete({ where: { id, tenantId } })` — Prisma cascade supprime les `StockLevel` automatiquement ; retourne `{ id }`
  - [x] Ajouter `toggleActive(id, tenantId)` → lit `isActive` courant puis fait `update({ where: { id, tenantId }, data: { isActive: !current } })` — **ne PAS utiliser `$transaction` pour l'atomicité ici** : risque de race condition est acceptable pour un toggle UI, pas pour du stock financier

- [x] Tâche 4 : Étendre `ProductsService` (AC: 2, 3, 4, 5, 6)
  - [x] Ajouter `getProductById(tenantId, id)` → appelle `findByIdAndTenant`, lance `NotFoundException` si `null`
  - [x] Ajouter `updateProduct(tenantId, id, dto, image?)` :
    - Valide `dto` avec `updateProductSchema.parse(dto)` (lève `BadRequestException` sur `ZodError`)
    - Si `image` fourni : `storageService.upload(tenantId, 'products', image.buffer, image.mimetype)` — même pattern silencieux que `createProduct` si R2 non configuré
    - Vérifie l'existence via `findByIdAndTenant` → `NotFoundException` si absent
    - Appelle `updateById`
  - [x] Ajouter `deleteProduct(tenantId, id)` :
    - Vérifie l'existence via `findByIdAndTenant` → `NotFoundException` si absent
    - Appelle `deleteById` → retourne `{ id }`
  - [x] Ajouter `toggleProduct(tenantId, id)` :
    - Appelle `toggleActive` → si Prisma retourne `null` (Prisma `update` sur un where non-trouvé lance `P2025`), intercepter et lancer `NotFoundException`
    - Pattern : utiliser `findByIdAndTenant` avant le toggle pour vérifier existence et appartenance

- [x] Tâche 5 : Étendre `ProductsController` (AC: 1, 2, 3, 4, 5)
  - [x] Ajouter `GET /:id` → appelle `getProductById`, retour auto-wrappé par interceptor
  - [x] Ajouter `PATCH /:id` avec `FileInterceptor('image', ...)` identique au POST — le controller extrait les champs body et le fichier optionnel, passe au service
  - [x] Ajouter `DELETE /:id` → appelle `deleteProduct`, retour `{ id }` wrappé par interceptor
  - [x] Ajouter `PATCH /:id/toggle` → appelle `toggleProduct`
  - [x] Importer `Param`, `Delete`, `HttpCode`, `HttpStatus`, `Patch` depuis `@nestjs/common`
  - [x] Ne PAS dupliquer la logique `imageFilter` et `ALLOWED_MIME` — elles sont déjà définies au niveau module dans le fichier controller

- [x] Tâche 6 : Tests unitaires du service (AC: 3, 4, 5, 6)
  - [x] Dans `products.service.spec.ts`, ajouter les mocks `findByIdAndTenant`, `updateById`, `deleteById`, `toggleActive` sur `mockProductsRepository`
  - [x] Tester `getProductById` : produit trouvé → retourne le produit ; produit absent → `NotFoundException`
  - [x] Tester `updateProduct` : données valides → update appelé ; `basePrice=0` → `BadRequestException` ; produit absent → `NotFoundException`
  - [x] Tester `deleteProduct` : succès → retourne `{ id }` ; produit absent → `NotFoundException`
  - [x] Tester `toggleProduct` : succès → retourne le produit avec `isActive` inversé ; produit absent → `NotFoundException`

### Review Findings

- [x] [Review][Decision] PATCH body vide `{}` accepté → RÉSOLU : `.refine()` ajouté dans `updateProductSchema`, test mis à jour [packages/shared/src/schemas/product.schema.ts:updateProductSchema]
- [x] [Review][Patch] TOCTOU : `PrismaClientKnownRequestError P2025` non catchée → RÉSOLU : helper `isPrismaP2025()` ajouté, `updateProduct`/`deleteProduct`/`toggleProduct` catchent P2025 et lèvent `NotFoundException`. [apps/api/src/modules/products/products.service.ts]
- [x] [Review][Patch] `toggleActive` retourne `null as unknown as ProductResult` → RÉSOLU : type corrigé en `Promise<ProductResult | null>`, retour `null` propre, `toggleProduct` dans le service gère le null avec `NotFoundException`. Test TOCTOU ajouté. [apps/api/src/modules/products/products.repository.ts:toggleActive]
- [x] [Review][Defer] Double-fetch dans `deleteProduct`/`toggleProduct` — 2 appels DB (find puis delete/toggle) là où catcher P2025 suffirait — pattern architectural pre-existant, acceptable en V1 [apps/api/src/modules/products/products.service.ts]
- [x] [Review][Defer] Pas de moyen d'effacer `imageUrl` existante via PATCH — le schéma n'expose pas de champ nullable pour forcer `imageUrl: null`, limitation design produit hors scope story [apps/api/src/modules/products/products.service.ts:updateProduct]
- [x] [Review][Defer] `deleteById` retourne `{ id }` depuis le paramètre d'entrée et non depuis le retour Prisma — Prisma lève toujours une exception en cas d'échec réel, donc correct en pratique, mais la valeur DB n'est pas vérifiée [apps/api/src/modules/products/products.repository.ts:deleteById]

## Dev Notes

### État Actuel du Module Products (avant cette Story)

```
apps/api/src/modules/products/
├── products.module.ts         ✅ existant
├── products.controller.ts     ✅ existant — POST /products + GET /products
├── products.service.ts        ✅ existant — createProduct() + getProducts()
├── products.repository.ts     ✅ existant — createProductWithDefaultVariant() + findByTenantId()
├── products.service.spec.ts   ✅ existant — 6 tests unitaires
└── products.repository.spec.ts ✅ existant (Story 3.1) — 10 tests isolation multi-tenant
```

**Pas de dossier `dto/`** — le module n'utilise pas `class-validator`. Les types sont inférés des schémas Zod depuis `@whatsell/shared`. **Ne PAS créer de fichiers `dto/` class-validator.** Continuer le pattern existant : Zod `.parse()` dans le service, types TypeScript inférés via `z.infer<>`.

### Invariants Critiques — NE PAS TOUCHER

1. **`@@unique([productId, variantKey])`** dans `StockLevel` — contrainte unique fondamentale pour Story 3.3 et 3.4, NE PAS supprimer
2. **`Product.stockAlertThreshold`** — seuil legacy au niveau produit, NE PAS supprimer (casse Story 2.4)
3. **`StockLevel.alertThreshold`** — seuil par variante ajouté en Story 3.1, NE PAS supprimer
4. **Pas de table `product_variants`** — les variantes sont des entrées `StockLevel` avec `variantKey` composite

### Changement Comportemental Intentionnel — GET /products

**Avant (Story 2.4)** : `findByTenantId` filtre `where: { tenantId, isActive: true }` — retournait seulement les produits actifs
**Après (cette Story)** : `where: { tenantId }` sans filtre `isActive` — retourne TOUS les produits

**Raison** : L'interface de gestion catalogue (Story 3.6) doit afficher les produits désactivés pour permettre leur réactivation. L'agent IA (Epic 4) utilisera ses propres requêtes filtrées `isActive: true`.

**Impact sur les tests existants** : le mock `findByTenantId` dans `products.service.spec.ts` retourne déjà un objet `{ items: [PRODUCT_RESULT], total: 1 }` — aucun changement à apporter à ces tests existants.

### Pattern Repository — Propriété du Tenant

Pour les opérations `/:id`, la vérification de propriété se fait via `where: { id, tenantId }` directement dans Prisma. Si le produit existe mais appartient à un autre tenant, Prisma retourne `null` (findFirst) ou lance `P2025` (update/delete sur where qui ne trouve rien). **Les deux cas doivent aboutir à une `NotFoundException`** — jamais une `ForbiddenException`.

```typescript
// Dans le repository — pattern findFirst avec tenantId
async findByIdAndTenant(id: string, tenantId: string): Promise<ProductDetail | null> {
  return this.prisma.product.findFirst({
    where: { id, tenantId },
    select: {
      id: true, name: true, basePrice: true, description: true,
      imageUrl: true, isActive: true, createdAt: true, updatedAt: true,
      stockLevels: {
        select: { id: true, variantKey: true, quantity: true, alertThreshold: true },
        orderBy: { variantKey: 'asc' },
      },
    },
  });
}

// delete — utilise deleteMany pour éviter P2025 (gère null silencieusement avant le delete)
async deleteById(id: string, tenantId: string): Promise<{ id: string }> {
  await this.prisma.product.delete({ where: { id, tenantId } });
  // Note: si not found, Prisma lève P2025 — intercepté par le service via findByIdAndTenant préalable
  return { id };
}
```

### Pattern Service — Vérification Existence Avant Mutation

```typescript
// Pattern uniforme pour toutes les mutations
async updateProduct(tenantId: string, id: string, dto: unknown, image?: Express.Multer.File) {
  let validated: UpdateProductDto;
  try {
    validated = updateProductSchema.parse(dto);
  } catch (err) {
    if (err instanceof ZodError) throw new BadRequestException(err.errors[0]?.message ?? 'Données invalides');
    throw err;
  }

  const existing = await this.productsRepository.findByIdAndTenant(id, tenantId);
  if (!existing) throw new NotFoundException(`Produit #${id} introuvable`);

  let imageUrl: string | undefined;
  if (image && image.buffer.length > 0) {
    try {
      imageUrl = await this.storageService.upload(tenantId, 'products', image.buffer, image.mimetype);
    } catch {
      imageUrl = undefined; // R2 non configuré en dev — image ignorée silencieusement
    }
  }

  return this.productsRepository.updateById(id, tenantId, { ...validated, imageUrl });
}
```

### Pattern Controller — Endpoints avec Param

```typescript
import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UnsupportedMediaTypeException, UploadedFile, UseInterceptors } from '@nestjs/common';

// GET /:id
@Get(':id')
async getProduct(
  @CurrentTenant() tenantId: string,
  @Param('id') id: string,
) {
  return this.productsService.getProductById(tenantId, id);
}

// PATCH /:id — multipart avec image optionnelle
@Patch(':id')
@UseInterceptors(FileInterceptor('image', { limits: { fileSize: 5 * 1024 * 1024 }, fileFilter: imageFilter }))
async updateProduct(
  @CurrentTenant() tenantId: string,
  @Param('id') id: string,
  @Body() body: unknown,
  @UploadedFile() image?: Express.Multer.File,
) {
  return this.productsService.updateProduct(tenantId, id, body, image);
}

// DELETE /:id
@Delete(':id')
async deleteProduct(
  @CurrentTenant() tenantId: string,
  @Param('id') id: string,
) {
  return this.productsService.deleteProduct(tenantId, id);
  // ResponseWrapperInterceptor enveloppe automatiquement : { data: { id } }
}

// PATCH /:id/toggle
@Patch(':id/toggle')
async toggleProduct(
  @CurrentTenant() tenantId: string,
  @Param('id') id: string,
) {
  return this.productsService.toggleProduct(tenantId, id);
}
```

### Formats de Réponse Attendus

```typescript
// GET /products — liste avec pagination (changement: inclut les inactifs)
{
  "data": [
    { "id": "uuid", "name": "Boubou Bazin", "basePrice": 15000, "imageUrl": null, "isActive": true },
    { "id": "uuid", "name": "Wax Désactivé", "basePrice": 8000, "imageUrl": null, "isActive": false }
  ],
  "meta": { "total": 2, "page": 1, "limit": 20 }
}

// GET /products/:id — détail avec stockLevels
{
  "data": {
    "id": "uuid", "name": "Boubou Bazin", "basePrice": 15000,
    "description": "Bazin Riche qualité premium", "imageUrl": null, "isActive": true,
    "createdAt": "2026-05-29T...", "updatedAt": "2026-05-29T...",
    "stockLevels": [
      { "id": "uuid", "variantKey": "Standard", "quantity": 10, "alertThreshold": 5 }
    ]
  }
}

// PATCH /products/:id — produit mis à jour
{ "data": { "id": "uuid", "name": "Nouveau Nom", "basePrice": 15000, "imageUrl": null, "isActive": true } }

// DELETE /products/:id — confirmation (HTTP 200, pas 204 — voir AC 4)
{ "data": { "id": "uuid-du-produit-supprimé" } }

// PATCH /products/:id/toggle
{ "data": { "id": "uuid", "name": "...", "isActive": false } }  // isActive inversé

// Erreur 404
{ "statusCode": 404, "error": "NOT_FOUND", "message": "Produit #uuid introuvable", "timestamp": "...", "path": "..." }
```

### Règles Architecture Obligatoires

- **Import Prisma** : depuis `'../../../generated/prisma/client'` — jamais `'@prisma/client'` (monorepo custom)
- **`@CurrentTenant()`** : toujours ce décorateur pour récupérer `tenantId` — jamais en paramètre route ou query
- **HttpException** : `NotFoundException`, `BadRequestException` — jamais `throw new Error()`
- **Queries Prisma** : uniquement dans `products.repository.ts` — jamais dans service ou controller
- **Schémas Zod** : uniquement dans `packages/shared/src/schemas/` — jamais définis dans le module
- **`ResponseWrapperInterceptor`** : global, auto-wrap toutes les réponses — ne PAS retourner `{ data: ... }` manuellement dans le controller

### Deferred Items Adressés dans Cette Story

- **D-03** (Story 3.1) : Ajouter `.max(2_147_483_647)` sur `quantity` dans `createStockLevelSchema` et `updateStockLevelSchema` — overflow Postgres Int
- **D-04** (Story 3.1) : Guard `page=0`/négatif dans `ProductsRepository.findByTenantId` — `page = Math.max(1, page)` en tête de méthode

### Deferred Items Hors Scope (à ne pas adresser ici)

- D-01 (Story 2.2) : Orphelin R2 si transaction DB échoue après upload — compensation delete-on-failure post-MVP
- D-02 (Story 2.2) : Ancien `imageUrl` R2 non supprimé lors d'un re-upload PATCH — même contrainte que D-02 Story 2.7
- D-03 (Story 2.7) : Validation MIME par magic-bytes (pas Content-Type) — `file-type` package, hardening post-MVP
- Story 1.5 D-02 : `ResponseWrapperInterceptor` et HTTP 204 — raison pour laquelle DELETE retourne HTTP 200

### Commandes de Test

```bash
# Depuis le répertoire racine
pnpm --filter api test --testPathPattern="products"
# Les 10 tests du repository (3.1) + les 6+N tests du service doivent passer
```

### Structure des Fichiers — Ce Story

```
packages/shared/src/schemas/
└── product.schema.ts              ← MODIFIER (updateProductSchema, max() sur quantity)

apps/api/src/modules/products/
├── products.controller.ts         ← MODIFIER (ajouter GET/:id, PATCH/:id, DELETE/:id, PATCH/:id/toggle)
├── products.service.ts            ← MODIFIER (ajouter getProductById, updateProduct, deleteProduct, toggleProduct)
├── products.repository.ts         ← MODIFIER (retirer isActive:true, ajouter findByIdAndTenant, updateById, deleteById, toggleActive, fix page guard)
└── products.service.spec.ts       ← MODIFIER (étendre tests pour les 4 nouvelles méthodes)
```

**Aucun nouveau fichier ne doit être créé** sauf si un module ou un test de repository supplémentaire est explicitement requis.

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Prisma client régénéré via `npx prisma generate` (depuis `apps/api/`) — nécessaire car `alertThreshold` ajouté en Story 3.1 n'était pas dans les types générés
- Package `@whatsell/shared` recompilé via `pnpm --filter @whatsell/shared build` — pour exposer `updateProductSchema` via le barrel
- TypeScript `tsc --noEmit` : 0 erreur
- Suite de tests : 214 tests — 210 passés, 4 échoués pré-existants (`encryption.service.spec.ts`, `storage.service.spec.ts`) — aucune régression

### Completion Notes List

- **Tâche 1 (D-03)** : `.max(2_147_483_647)` ajouté sur `quantity` dans `createStockLevelSchema` et `updateStockLevelSchema` — protège contre l'overflow Postgres `Int`
- **Tâche 1 (D-04)** : `page = Math.max(1, page)` ajouté en tête de `findByTenantId` — protège contre `skip` négatif si `page=0`
- **Tâche 2** : `updateProductSchema` + `UpdateProductDto` ajoutés dans `product.schema.ts`, exportés via le barrel `schemas/index.ts → src/index.ts` (export `*` existant)
- **Tâche 3** : `findByTenantId` — filtre `isActive: true` supprimé (changement comportemental documenté) ; `findByIdAndTenant`, `updateById`, `deleteById`, `toggleActive` ajoutés
- **Tâche 4** : `getProductById`, `updateProduct`, `deleteProduct`, `toggleProduct` ajoutés dans le service avec pattern cohérent : validation Zod → vérification existence → mutation
- **Tâche 5** : 4 nouveaux endpoints dans le controller : `GET /:id`, `PATCH /:id` (multipart), `DELETE /:id`, `PATCH /:id/toggle` — pattern `imageFilter` réutilisé sans duplication
- **Tâche 6** : 27 tests unitaires (vs 6 avant) — 21 nouveaux tests couvrant `getProductById`, `updateProduct`, `deleteProduct`, `toggleProduct` avec cas happy path et NotFoundException/BadRequestException

### File List

- `packages/shared/src/schemas/product.schema.ts` — MODIFIÉ (updateProductSchema, UpdateProductDto, .max() sur quantity)
- `apps/api/src/modules/products/products.repository.ts` — MODIFIÉ (page guard, retrait isActive filter, findByIdAndTenant, updateById, deleteById, toggleActive)
- `apps/api/src/modules/products/products.service.ts` — MODIFIÉ (getProductById, updateProduct, deleteProduct, toggleProduct)
- `apps/api/src/modules/products/products.controller.ts` — MODIFIÉ (GET/:id, PATCH/:id, DELETE/:id, PATCH/:id/toggle)
- `apps/api/src/modules/products/products.service.spec.ts` — MODIFIÉ (27 tests vs 6 avant)
- `_bmad-output/implementation-artifacts/3-2-crud-produits-backend-api.md` — MODIFIÉ (story file)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIÉ (status → review)

## Change Log

- **2026-05-29** : Implémentation Story 3.2 — CRUD Produits Backend API
  - Fix D-03 (Story 3.1) : `.max(2_147_483_647)` sur `quantity` dans les schémas Zod stock
  - Fix D-04 (Story 3.1) : guard `page = Math.max(1, page)` dans `findByTenantId`
  - Nouveau schéma : `updateProductSchema` + `UpdateProductDto` dans `@whatsell/shared`
  - Repository : +4 méthodes (`findByIdAndTenant`, `updateById`, `deleteById`, `toggleActive`) + retrait filtre `isActive: true` sur la liste
  - Service : +4 méthodes (`getProductById`, `updateProduct`, `deleteProduct`, `toggleProduct`)
  - Controller : +4 endpoints (`GET/:id`, `PATCH/:id`, `DELETE/:id`, `PATCH/:id/toggle`)
  - Tests : 27 tests unitaires service (+21), Prisma client régénéré
