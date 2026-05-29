# Story 3.3 : Gestion des Variantes Libres

Status: done

## Story

En tant que **vendeur**,
je veux définir des variantes libres sur mes produits (taille, couleur, volume, etc.),
afin que mon agent IA puisse guider les clients dans le choix de la bonne variante disponible.

## Acceptance Criteria

1. Étant donné que le vendeur ajoute une variante sur un produit existant, Quand `POST /api/v1/products/:id/variants` est appelé avec `{ variantKey, quantity }`, Alors une entrée `StockLevel` est créée avec le `variantKey` fourni, `quantity` fourni (défaut 0), `isActive: true`, et la réponse est `{ data: StockLevelSummary }` (FR23)

2. Étant donné que le vendeur tente d'ajouter une variante avec un `variantKey` qui existe déjà sur ce produit, Quand `POST /api/v1/products/:id/variants` est appelé, Alors la réponse est `409 Conflict` — contrainte `@@unique([productId, variantKey])` de `StockLevel`

3. Étant donné que `POST /api/v1/products/:id/variants` est appelé sur un produit qui n'appartient pas au tenant courant ou n'existe pas, Alors la réponse est `404 NotFoundException` — jamais `403` (NFR8)

4. Étant donné que le vendeur supprime une variante sans commandes associées, Quand `DELETE /api/v1/products/:id/variants/:variantId` est appelé, Alors la variante est supprimée définitivement et la réponse est HTTP 200 `{ data: { id: string } }` — **pas de 204** (Story 1.5 D-02 : `ResponseWrapperInterceptor` ne gère pas HTTP 204)

5. Étant donné que le vendeur tente de supprimer une variante qui a des commandes associées (OrderItem existants), Quand `DELETE /api/v1/products/:id/variants/:variantId` est appelé, Alors la variante est désactivée (`isActive: false`) plutôt que supprimée, et la réponse est HTTP 200 `{ data: StockLevelSummary }` avec `isActive: false` — pour conserver l'historique des commandes

6. Étant donné que `DELETE /api/v1/products/:id/variants/:variantId` est appelé sur une variante qui n'appartient pas au produit/tenant ou n'existe pas, Alors la réponse est `404 NotFoundException`

7. Le schéma Prisma `StockLevel` est mis à jour : ajout du champ `isActive Boolean @default(true)` via une nouvelle migration — nécessaire pour que l'agent IA (Epic 4) puisse filtrer les variantes disponibles

8. Toutes les routes requièrent le rôle `OWNER` ou `CO_MANAGER` — via `@Roles(Role.OWNER, Role.CO_MANAGER)` déjà positionné au niveau classe sur `ProductsController`

## Tasks / Subtasks

- [x] Tâche 1 : Mettre à jour le schéma Prisma (AC: 7)
  - [x] Dans `apps/api/prisma/schema.prisma`, ajouter `isActive Boolean @default(true)` au modèle `StockLevel` **après** le champ `alertThreshold` et avant `createdAt` — NE PAS toucher `@@unique([productId, variantKey])`, `alertThreshold`, ni aucun autre champ existant
  - [x] Exécuter `npx prisma migrate dev --name add-stock-level-is-active` depuis `apps/api/` pour créer la migration
  - [x] Exécuter `npx prisma generate` depuis `apps/api/` pour régénérer le client Prisma
  - [x] Dans `apps/api/src/modules/products/products.repository.ts`, mettre à jour le `select` dans `findByIdAndTenant` pour inclure `isActive: true` dans `stockLevels` (ajouter à côté de `id`, `variantKey`, `quantity`, `alertThreshold`)

- [x] Tâche 2 : Vérifier et exporter les schémas Zod existants (AC: 1, 2)
  - [x] Vérifier que `createStockLevelSchema` et `CreateStockLevelDto` sont bien exportés depuis `packages/shared/src/index.ts` — ils existent déjà dans `product.schema.ts`, il faut juste confirmer leur présence dans le barrel
  - [x] Si absent du barrel, ajouter l'export dans `packages/shared/src/schemas/index.ts` (pattern : `export * from './product.schema'`)
  - [x] Recompiler le package shared si nécessaire : `pnpm --filter @whatsell/shared build`

- [x] Tâche 3 : Étendre `ProductsRepository` (AC: 1, 2, 3, 4, 5, 6)
  - [x] Ajouter le type `VariantResult` au fichier repository :
    ```typescript
    type VariantResult = {
      id: string;
      variantKey: string;
      quantity: number;
      alertThreshold: number;
      isActive: boolean;
    };
    ```
  - [x] Ajouter `addVariantToProduct(productId, tenantId, data: { variantKey: string; quantity: number })` → `prisma.stockLevel.create({ data: { tenantId, productId, variantKey: data.variantKey, quantity: data.quantity } })` — retourne `VariantResult` — NE PAS attraper P2002 ici, laisser le service le gérer
  - [x] Ajouter `findVariantByIdAndProduct(variantId, productId, tenantId)` → `prisma.stockLevel.findFirst({ where: { id: variantId, productId, tenantId } })` — retourne `VariantResult | null`
  - [x] Ajouter `deleteVariantById(variantId, productId, tenantId)` → `prisma.stockLevel.delete({ where: { id: variantId, productId, tenantId } })` — retourne `{ id: string }` (utiliser `variantId` en retour, comme `deleteById` pour les produits)
  - [x] Ajouter `deactivateVariantById(variantId, productId, tenantId)` → `prisma.stockLevel.update({ where: { id: variantId, productId, tenantId }, data: { isActive: false } })` — retourne `VariantResult`
  - [x] Ajouter `countOrderItemsByVariantId(variantId)` → utiliser `prisma.orderItem.count({ where: { variantId } })` **si la table `OrderItem` existe**. **⚠️ IMPORTANT :** La table `OrderItem` n'existe pas encore (créée en Story 4.1). Pour Story 3.3, implémenter cette méthode en retournant toujours `0` : `return 0;` — avec un commentaire `// TODO Story 4.1: replace with real orderItem count when table exists` — NE PAS importer un modèle Prisma inexistant

- [x] Tâche 4 : Étendre `ProductsService` (AC: 1, 2, 3, 4, 5, 6)
  - [x] Importer `ConflictException` depuis `@nestjs/common` (à ajouter aux imports existants)
  - [x] Importer `createStockLevelSchema, type CreateStockLevelDto` depuis `@whatsell/shared` (à ajouter aux imports existants)
  - [x] Ajouter `addVariant(tenantId, productId, dto)` :
    - Valider `dto` avec `createStockLevelSchema.parse(dto)` — lève `BadRequestException` sur `ZodError`
    - Vérifier que le produit appartient au tenant via `findByIdAndTenant(productId, tenantId)` → `NotFoundException` si absent
    - Appeler `addVariantToProduct(productId, tenantId, { variantKey, quantity: quantity ?? 0 })`
    - Attraper Prisma P2002 (`code === 'P2002'`) → lancer `ConflictException('Une variante avec cette clé existe déjà sur ce produit')`
  - [x] Ajouter `deleteVariant(tenantId, productId, variantId)` :
    - Vérifier que le produit appartient au tenant via `findByIdAndTenant(productId, tenantId)` → `NotFoundException` si absent
    - Vérifier que la variante appartient au produit via `findVariantByIdAndProduct(variantId, productId, tenantId)` → `NotFoundException` si absent
    - Appeler `countOrderItemsByVariantId(variantId)` — si count > 0 → appeler `deactivateVariantById(variantId, productId, tenantId)` et retourner le résultat
    - Sinon → appeler `deleteVariantById(variantId, productId, tenantId)` et retourner `{ id: variantId }`
    - Attraper Prisma P2025 via `isPrismaP2025(err)` → lancer `NotFoundException`

- [x] Tâche 5 : Étendre `ProductsController` (AC: 1, 4)
  - [x] Ajouter `POST /:id/variants` :
    ```typescript
    @Post(':id/variants')
    async addVariant(
      @CurrentTenant() tenantId: string,
      @Param('id') productId: string,
      @Body() body: unknown,
    ) {
      return this.productsService.addVariant(tenantId, productId, body);
    }
    ```
  - [x] Ajouter `DELETE /:id/variants/:variantId` :
    ```typescript
    @Delete(':id/variants/:variantId')
    async deleteVariant(
      @CurrentTenant() tenantId: string,
      @Param('id') productId: string,
      @Param('variantId') variantId: string,
    ) {
      return this.productsService.deleteVariant(tenantId, productId, variantId);
    }
    ```
  - [x] **NE PAS** ajouter de `HttpCode(HttpStatus.NO_CONTENT)` — le DELETE retourne 200 (voir AC 4)
  - [x] **NE PAS** envelopper manuellement la réponse — `ResponseWrapperInterceptor` le fait automatiquement

- [x] Tâche 6 : Tests unitaires du service (AC: 1, 2, 3, 4, 5, 6)
  - [x] Dans `products.service.spec.ts`, ajouter les mocks sur `mockProductsRepository` : `addVariantToProduct`, `findVariantByIdAndProduct`, `deleteVariantById`, `deactivateVariantById`, `countOrderItemsByVariantId`
  - [x] Tester `addVariant` :
    - Données valides → `addVariantToProduct` appelé, retourne `VariantResult`
    - `variantKey` vide → `BadRequestException`
    - `quantity` négatif → `BadRequestException`
    - Produit absent → `NotFoundException`
    - P2002 (duplicate variantKey) → `ConflictException`
  - [x] Tester `deleteVariant` :
    - Succès sans commandes → `deleteVariantById` appelé, retourne `{ id }`
    - Succès avec commandes (count > 0) → `deactivateVariantById` appelé, retourne `VariantResult` avec `isActive: false`
    - Produit absent → `NotFoundException`
    - Variante absente → `NotFoundException`

### Review Findings

- [x] [Review][Patch] Migration `add_stock_level_is_active` non stagée dans git [`apps/api/prisma/migrations/20260529082551_add_stock_level_is_active/`]
- [x] [Review][Defer] `countOrderItemsByVariantId` stub → soft-delete (AC5) inatteignable en prod [`apps/api/src/modules/products/products.repository.ts`] — deferred, intentionnel per spec, Story 4.1 remplacera le stub
- [x] [Review][Defer] Race condition TOCTOU count→deleteVariantById [`apps/api/src/modules/products/products.service.ts`] — deferred, seulement pertinent après Story 4.1
- [x] [Review][Defer] Race condition P2003 FK : produit supprimé entre existence check et addVariantToProduct [`apps/api/src/modules/products/products.service.ts`] — deferred, très faible probabilité
- [x] [Review][Defer] `@Body() body: unknown` bypass ValidationPipe NestJS [`apps/api/src/modules/products/products.controller.ts`] — deferred, pattern pré-existant projet
- [x] [Review][Defer] Opérations sur variante non bloquées si produit parent inactif [`apps/api/src/modules/products/products.service.ts`] — deferred, règle métier hors spec 3.3
- [x] [Review][Defer] `StockLevelSummary` ≈ `VariantResult` — duplication de types quasi-identiques — deferred, dette technique pré-existante
- [x] [Review][Defer] IDs internes exposés dans messages d'erreur 404 [`apps/api/src/modules/products/products.service.ts`] — deferred, pattern pré-existant dans tout le service

## Dev Notes

### Rappel Architecture — Règles Absolues

- **Import Prisma** : depuis `'../../../generated/prisma/client'` — jamais `'@prisma/client'` (monorepo custom output)
- **`@CurrentTenant()`** : toujours ce décorateur pour `tenantId` — jamais paramètre route ou query
- **`NotFoundException` vs `ForbiddenException`** : toujours `NotFoundException` pour les ressources cross-tenant (NFR8) — ne jamais exposer l'existence d'une ressource
- **Queries Prisma** : uniquement dans `products.repository.ts` — jamais dans service ou controller
- **Schémas Zod** : uniquement dans `packages/shared/src/schemas/` — jamais définis dans le module
- **`ResponseWrapperInterceptor`** : global — ne PAS retourner `{ data: ... }` manuellement dans le controller
- **DELETE HTTP 200** : `ResponseWrapperInterceptor` ne gère pas HTTP 204 correctement (Story 1.5 D-02) — toujours retourner 200 pour les DELETE

### Invariants Critiques — NE PAS TOUCHER

1. **`@@unique([productId, variantKey])`** dans `StockLevel` — contrainte unique, ne jamais supprimer
2. **`Product.stockAlertThreshold`** — seuil legacy au niveau produit, ne jamais supprimer (casse Story 2.4)
3. **`StockLevel.alertThreshold`** — seuil par variante, ne jamais supprimer
4. **Pas de table `product_variants`** — les variantes SONT des entrées `StockLevel` avec `variantKey` composite — ne jamais créer de table séparée
5. **`@@unique([productId, variantKey])` sur `StockLevel`** — l'erreur Prisma correspondante est `P2002`, pas `P2025`

### Schémas Zod Existants — Réutiliser Sans Créer de Doublons

Les schémas suivants existent déjà dans `packages/shared/src/schemas/product.schema.ts` :

```typescript
export const variantKeySchema = z.string().trim().min(1).max(200);

export const createStockLevelSchema = z.object({
  variantKey: variantKeySchema,
  quantity: z.coerce.number().int().min(0).max(2_147_483_647),
});
export type CreateStockLevelDto = z.infer<typeof createStockLevelSchema>;
```

**Utiliser `createStockLevelSchema`** pour valider le body de `POST /products/:id/variants` — ne PAS créer de nouveau schéma `createVariantSchema` ou similaire.

### Pattern Repository — Gestion P2002 (Duplicate Key)

```typescript
// Dans le SERVICE — attraper P2002 après addVariantToProduct
async addVariant(tenantId: string, productId: string, dto: unknown) {
  let validated: CreateStockLevelDto;
  try {
    validated = createStockLevelSchema.parse(dto);
  } catch (err) {
    if (err instanceof ZodError) throw new BadRequestException(err.errors[0]?.message ?? 'Données invalides');
    throw err;
  }

  const product = await this.productsRepository.findByIdAndTenant(productId, tenantId);
  if (!product) throw new NotFoundException(`Produit #${productId} introuvable`);

  try {
    return await this.productsRepository.addVariantToProduct(productId, tenantId, {
      variantKey: validated.variantKey,
      quantity: validated.quantity ?? 0,
    });
  } catch (err) {
    if (isPrismaP2002(err)) {
      throw new ConflictException('Une variante avec cette clé existe déjà sur ce produit');
    }
    throw err;
  }
}
```

Ajouter la fonction helper `isPrismaP2002` dans `products.service.ts` (analogue à `isPrismaP2025` existant) :

```typescript
function isPrismaP2002(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 'P2002';
}
```

### Pattern Suppression — Logique Hard vs Soft Delete

```typescript
async deleteVariant(tenantId: string, productId: string, variantId: string) {
  // 1. Vérifier l'existence du produit
  const product = await this.productsRepository.findByIdAndTenant(productId, tenantId);
  if (!product) throw new NotFoundException(`Produit #${productId} introuvable`);

  // 2. Vérifier l'existence de la variante
  const variant = await this.productsRepository.findVariantByIdAndProduct(variantId, productId, tenantId);
  if (!variant) throw new NotFoundException(`Variante #${variantId} introuvable`);

  // 3. Vérifier les commandes associées
  const orderCount = await this.productsRepository.countOrderItemsByVariantId(variantId);

  if (orderCount > 0) {
    // Soft-delete : désactivation pour conserver l'historique
    return this.productsRepository.deactivateVariantById(variantId, productId, tenantId);
  }

  // Hard-delete
  try {
    return await this.productsRepository.deleteVariantById(variantId, productId, tenantId);
  } catch (err) {
    if (isPrismaP2025(err)) throw new NotFoundException(`Variante #${variantId} introuvable`);
    throw err;
  }
}
```

### Formats de Réponse Attendus

```typescript
// POST /products/:id/variants
// Body: { "variantKey": "Taille:L", "quantity": 10 }
{ "data": { "id": "uuid", "variantKey": "Taille:L", "quantity": 10, "alertThreshold": 5, "isActive": true } }

// POST /products/:id/variants — duplicate variantKey
{ "statusCode": 409, "error": "CONFLICT", "message": "Une variante avec cette clé existe déjà sur ce produit", "timestamp": "...", "path": "..." }

// DELETE /products/:id/variants/:variantId — hard delete (HTTP 200)
{ "data": { "id": "uuid-de-la-variante" } }

// DELETE /products/:id/variants/:variantId — soft delete (commandes existantes, HTTP 200)
{ "data": { "id": "uuid", "variantKey": "Taille:L", "quantity": 10, "alertThreshold": 5, "isActive": false } }

// GET /products/:id — réponse enrichie après migration (stockLevels inclut maintenant isActive)
{
  "data": {
    "id": "uuid", "name": "Boubou Bazin", ...
    "stockLevels": [
      { "id": "uuid", "variantKey": "Standard", "quantity": 10, "alertThreshold": 5, "isActive": true },
      { "id": "uuid", "variantKey": "Taille:L", "quantity": 0, "alertThreshold": 5, "isActive": false }
    ]
  }
}
```

### État du Module Products Avant Cette Story

```
apps/api/src/modules/products/
├── products.module.ts          ✅ existant — injecte StorageService
├── products.controller.ts      ✅ existant — 6 endpoints (POST, GET, GET/:id, PATCH/:id, DELETE/:id, PATCH/:id/toggle)
├── products.service.ts         ✅ existant — 6 méthodes (createProduct, getProducts, getProductById, updateProduct, deleteProduct, toggleProduct)
├── products.repository.ts      ✅ existant — 6 méthodes (createProductWithDefaultVariant, findByTenantId, findByIdAndTenant, updateById, deleteById, toggleActive)
├── products.service.spec.ts    ✅ existant — 27 tests unitaires
└── products.repository.spec.ts ✅ existant — 10 tests isolation multi-tenant (Story 3.1)
```

**Aucun nouveau fichier à créer.** Uniquement modifier les fichiers existants + schéma Prisma.

### Migration Prisma

```prisma
// Champ à ajouter dans le modèle StockLevel (apps/api/prisma/schema.prisma)
// Insérer APRÈS alertThreshold et AVANT createdAt
isActive Boolean @default(true)
```

Commandes depuis `apps/api/` :
```bash
npx prisma migrate dev --name add-stock-level-is-active
npx prisma generate
```

La migration crée un fichier dans `apps/api/prisma/migrations/`. Les entrées `StockLevel` existantes auront `isActive: true` automatiquement (valeur par défaut).

### Raison du Champ `isActive` sur `StockLevel`

Ce champ est requis pour deux raisons futures critiques :
1. **Epic 4 — Agent IA** : l'agent doit filtrer `isActive: true` pour ne proposer que les variantes actives lors du guidage variantes (FR7)
2. **Soft-delete sur DELETE** : préserver l'historique des commandes si une variante a des `OrderItem` associés (AC 5)

### Deferred Items

- **Story 4.1** : Quand `OrderItem` est ajouté au schéma Prisma, remplacer le stub `countOrderItemsByVariantId` (qui retourne toujours `0`) par une vraie requête `prisma.orderItem.count({ where: { variantId } })`. La logique soft-delete dans `deleteVariant` du service sera automatiquement activée.
- **Story 3.6** : L'interface frontend devra distinguer variantes `isActive: true` des variantes désactivées `isActive: false` — les variantes inactives peuvent être affichées en grisé ou masquées dans le formulaire d'édition.

### Commandes de Test

```bash
# Depuis la racine du projet
pnpm --filter api test --testPathPattern="products"
# Les 10 tests repository (3.1) + 27+N tests service doivent passer
# Suite complète (214 tests avant cette story) — vérifier 0 régression
```

### Structure des Fichiers — Cette Story

```
apps/api/prisma/schema.prisma              ← MODIFIER (isActive dans StockLevel)
apps/api/prisma/migrations/               ← NOUVEAU fichier de migration (auto-généré)

packages/shared/src/schemas/product.schema.ts  ← VÉRIFIER (exports createStockLevelSchema ok)

apps/api/src/modules/products/
├── products.controller.ts      ← MODIFIER (POST /:id/variants, DELETE /:id/variants/:variantId)
├── products.service.ts         ← MODIFIER (addVariant, deleteVariant, isPrismaP2002 helper)
├── products.repository.ts      ← MODIFIER (VariantResult type, addVariantToProduct, findVariantByIdAndProduct, deleteVariantById, deactivateVariantById, countOrderItemsByVariantId, update findByIdAndTenant select)
└── products.service.spec.ts    ← MODIFIER (tests addVariant, deleteVariant)
```

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Migration `20260529082551_add_stock_level_is_active` appliquée avec succès sur Neon PostgreSQL
- `npx prisma generate` — client Prisma 7.7.0 régénéré sans erreur
- TypeScript `tsc --noEmit` : 0 erreur
- `createStockLevelSchema` et `CreateStockLevelDto` déjà exportés via le barrel `packages/shared/src/schemas/index.ts` — pas de recompilation nécessaire
- Suite de tests : 224 tests — 220 passés, 4 échecs pré-existants (`encryption.service.spec.ts` ×1, `storage.service.spec.ts` ×3) — aucune régression

### Completion Notes List

- **Tâche 1** : `isActive Boolean @default(true)` ajouté à `StockLevel` — migration appliquée, client Prisma régénéré, `findByIdAndTenant` mis à jour pour inclure `isActive` dans le select des `stockLevels`
- **Tâche 2** : `createStockLevelSchema` et `CreateStockLevelDto` déjà présents dans le barrel — aucune modification du package shared nécessaire
- **Tâche 3** : Repository étendu avec 5 nouvelles méthodes — `addVariantToProduct`, `findVariantByIdAndProduct`, `deleteVariantById`, `deactivateVariantById`, `countOrderItemsByVariantId` (stub retournant `0` en attente de Story 4.1) + type `VariantResult` exporté
- **Tâche 4** : Service étendu avec `addVariant` (validation Zod + P2002→ConflictException) et `deleteVariant` (hard vs soft delete selon `countOrderItemsByVariantId`) + helper `isPrismaP2002`
- **Tâche 5** : Controller étendu avec `POST /:id/variants` et `DELETE /:id/variants/:variantId` — HTTP 200 sur DELETE, pas d'enveloppe manuelle
- **Tâche 6** : 37 tests service (27 existants + 10 nouveaux) — tous passés ; tests couvrent happy path, validations Zod, P2002, hard delete, soft delete, 404 produit absent, 404 variante absente

### File List

- `apps/api/prisma/schema.prisma` — MODIFIÉ (isActive ajouté à StockLevel)
- `apps/api/prisma/migrations/20260529082551_add_stock_level_is_active/migration.sql` — CRÉÉ
- `apps/api/src/modules/products/products.repository.ts` — MODIFIÉ (VariantResult type, isActive dans StockLevelSummary + findByIdAndTenant select, 5 nouvelles méthodes variants)
- `apps/api/src/modules/products/products.service.ts` — MODIFIÉ (isPrismaP2002 helper, ConflictException import, createStockLevelSchema import, addVariant, deleteVariant)
- `apps/api/src/modules/products/products.controller.ts` — MODIFIÉ (POST /:id/variants, DELETE /:id/variants/:variantId)
- `apps/api/src/modules/products/products.service.spec.ts` — MODIFIÉ (VARIANT_ID + VARIANT_RESULT fixtures, 5 nouveaux mocks repository, 10 nouveaux tests addVariant + deleteVariant)
- `_bmad-output/implementation-artifacts/3-3-gestion-des-variantes-libres.md` — MODIFIÉ (story file)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIÉ (status → review)

## Change Log

- **2026-05-29** : Implémentation Story 3.3 — Gestion des Variantes Libres
  - Migration Prisma : `isActive Boolean @default(true)` ajouté à `StockLevel`
  - Repository : +5 méthodes variants (`addVariantToProduct`, `findVariantByIdAndProduct`, `deleteVariantById`, `deactivateVariantById`, `countOrderItemsByVariantId`) + type `VariantResult`
  - Service : +2 méthodes (`addVariant`, `deleteVariant`) + helper `isPrismaP2002`
  - Controller : +2 endpoints (`POST /:id/variants`, `DELETE /:id/variants/:variantId`)
  - Tests : 37 tests service (+10 nouveaux), 0 régression
