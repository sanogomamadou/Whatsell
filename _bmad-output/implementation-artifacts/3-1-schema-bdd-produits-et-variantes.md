# Story 3.1 : Schéma BDD Produits & Variantes

Status: done

## Story

En tant que **développeur**,
je veux finaliser le schéma Prisma pour les entités Produit et Stock, ajouter le champ `alertThreshold` manquant sur `StockLevel`, étendre les schémas Zod partagés, et ajouter des tests d'isolation multi-tenant,
afin que le catalogue soit prêt pour l'implémentation des Stories 3.2 à 3.5 sans modification de schéma ultérieure.

## Acceptance Criteria

1. Étant donné que la migration Prisma est exécutée, Quand le schéma est appliqué, Alors `stock_levels` contient le champ `alertThreshold Int @default(5)` — permettant les alertes par variante (Story 3.5, FR26)

2. Étant donné qu'une query est effectuée sur `products` ou `stock_levels` sans filtre `tenantId`, Quand `products.repository.spec.ts` s'exécute, Alors les tests vérifient que chaque méthode du repository passe toujours `where: { tenantId }` à Prisma — aucune fuite de données cross-tenant possible (NFR8)

3. Les schémas Zod dans `packages/shared/src/schemas/product.schema.ts` couvrent le cycle complet : `createProductSchema` (existant), `variantKeySchema`, `createStockLevelSchema`, `updateStockLevelSchema`, `updateAlertThresholdSchema` — tous exportés via `@whatsell/shared`

4. La migration Prisma est générée avec succès (`prisma migrate dev`) et le fichier existe dans `apps/api/prisma/migrations/`

## Tasks / Subtasks

- [x] Tâche 1 : Ajouter `alertThreshold` à `StockLevel` dans schema.prisma (AC: 1, 4)
  - [x] Dans `apps/api/prisma/schema.prisma`, ajouter `alertThreshold Int @default(5)` après `quantity` dans `model StockLevel`
  - [x] Exécuter `pnpm --filter api prisma migrate dev --name add_stock_level_alert_threshold` depuis le projet root
  - [x] Vérifier que la migration générée ne touche que `stock_levels` (ne pas modifier `Product` ni `StockLevel` autrement)

- [x] Tâche 2 : Étendre les schémas Zod partagés (AC: 3)
  - [x] Dans `packages/shared/src/schemas/product.schema.ts`, ajouter :
    - `variantKeySchema` : `z.string().trim().min(1).max(200)` — format libre ex: `"Taille:L,Couleur:Rouge"` ou `"Standard"`
    - `createStockLevelSchema` : `{ variantKey, quantity: z.coerce.number().int().min(0) }`
    - `updateStockLevelSchema` : `{ quantity: z.coerce.number().int().min(0) }`
    - `updateAlertThresholdSchema` : `{ alertThreshold: z.coerce.number().int().min(0).max(9999) }`
  - [x] Exporter les nouveaux types depuis `packages/shared/src/index.ts` (ou le barrel existant)

- [x] Tâche 3 : Tests d'isolation multi-tenant du repository (AC: 2)
  - [x] Créer `apps/api/src/modules/products/products.repository.spec.ts`
  - [x] Mock `PrismaService` avec `jest.fn()` sur `product.create`, `product.findMany`, `product.count`, `stockLevel.create`
  - [x] Test : `findByTenantId('tenant-A')` → vérifie que `prisma.product.findMany` est appelé avec `where: { tenantId: 'tenant-A', isActive: true }`
  - [x] Test : `createProductWithDefaultVariant('tenant-A', dto)` → vérifie que `$transaction` est appelé, que `product.create` reçoit `{ tenantId: 'tenant-A' }` et que `stockLevel.create` reçoit `{ tenantId: 'tenant-A', variantKey: 'Standard' }`
  - [x] Test : appel `findByTenantId` avec pagination — `page=2, limit=5` → `skip=5, take=5`

### Review Findings

- [x] [Review][Patch] `createStockLevelSchema` contient `alertThreshold` hors spec AC3 + typage `.default(5).optional()` incorrect — supprimé [`packages/shared/src/schemas/product.schema.ts:30`]
- [x] [Review][Patch] Test isolation cross-tenant logiquement insuffisant — mock refactoré pour simuler le filtre DB réel [`apps/api/src/modules/products/products.repository.spec.ts:89`]
- [x] [Review][Defer] `variantKeySchema` — espaces Unicode invisibles (U+00A0, U+200B) passent `.trim().min(1)` [`packages/shared/src/schemas/product.schema.ts:25`] — deferred, scope Story 3.3
- [x] [Review][Defer] `updateStockLevelSchema`/`updateAlertThresholdSchema` sans endpoint consommateur — deferred, scope Stories 3.3–3.5
- [x] [Review][Defer] Pas de borne `max()` sur `quantity` — overflow Postgres Int théorique [`packages/shared/src/schemas/product.schema.ts`] — deferred, pre-existing
- [x] [Review][Defer] Guard `page=0`/négatif manquant dans `findByTenantId` — skip = (page-1)*limit devient négatif [`apps/api/src/modules/products/products.repository.ts`] — deferred, pre-existing (Story 2.4)
- [x] [Review][Defer] Mock `$transaction` pointe sur le même objet que `mockPrismaService` — appels `tx.X` vs `this.prisma.X` indistinguables [`apps/api/src/modules/products/products.repository.spec.ts`] — deferred, pre-existing

## Dev Notes

### Décision d'Architecture Critique — Pas de Table `product_variants` Distincte

> **L'Epic 3.1 mentionne une table `product_variants` qui N'EXISTE PAS et ne sera PAS créée.**

La décision d'architecture retenue est : les variantes sont encodées comme des `StockLevel` distincts avec un champ `variantKey: String` composite.

- **Exemple :** un produit "Boubou Bazin" avec variantes Taille=L/Couleur=Bleu et Taille=M/Couleur=Rouge → 2 entrées `StockLevel` avec `variantKey = "Taille:L,Couleur:Bleu"` et `variantKey = "Taille:M,Couleur:Rouge"`
- **Produit sans variante :** `variantKey = "Standard"` (déjà implémenté dans `createProductWithDefaultVariant`)
- **Avantage :** simplicité du schéma, chaque variante a son propre stock et son propre `alertThreshold`
- **Contrainte clé :** `@@unique([productId, variantKey])` garantit l'unicité — NE PAS la supprimer

### État Actuel du Schéma Prisma

**`Product` — déjà en production (`apps/api/prisma/schema.prisma`) :**
```prisma
model Product {
  id                  String   @id @default(uuid())
  tenantId            String
  name                String
  description         String?
  basePrice           Int                        // FCFA — jamais Float
  isActive            Boolean  @default(true)
  imageUrl            String?
  stockAlertThreshold Int      @default(5)       // seuil au niveau produit (legacy, gardé pour compat)
  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  tenant      Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  stockLevels StockLevel[]

  @@index([tenantId])
  @@map("products")
}
```

**`StockLevel` — ÉTAT ACTUEL (à modifier) :**
```prisma
model StockLevel {
  id         String   @id @default(uuid())
  tenantId   String
  productId  String
  variantKey String          // ex: "Standard", "Taille:L,Couleur:Bleu"
  quantity   Int      @default(0)
  // ← alertThreshold MANQUANT — à ajouter dans cette story
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  tenant  Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, variantKey])
  @@index([tenantId])
  @@map("stock_levels")
}
```

**`StockLevel` — ÉTAT CIBLE (après cette story) :**
```prisma
model StockLevel {
  id             String   @id @default(uuid())
  tenantId       String
  productId      String
  variantKey     String
  quantity       Int      @default(0)
  alertThreshold Int      @default(5)   // ← NOUVEAU — seuil par variante (Story 3.5)
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  tenant  Tenant  @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  product Product @relation(fields: [productId], references: [id], onDelete: Cascade)

  @@unique([productId, variantKey])
  @@index([tenantId])
  @@map("stock_levels")
}
```

**Relation `Product.stockAlertThreshold` vs `StockLevel.alertThreshold` :**
- `Product.stockAlertThreshold` = seuil au niveau produit entier (grain grossier, hérité du wizard Story 2.4)
- `StockLevel.alertThreshold` = seuil par variante (grain fin, utilisé par Story 3.5)
- Les deux coexistent — NE PAS supprimer `Product.stockAlertThreshold` (risque de casser la migration et Story 2.4)
- Story 3.5 utilisera exclusivement `StockLevel.alertThreshold`

### Schémas Zod Existants

```typescript
// packages/shared/src/schemas/product.schema.ts — ÉTAT ACTUEL
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z.string({ required_error: 'Le nom du produit est obligatoire' })
    .trim().min(1, 'Le nom du produit est obligatoire').max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  basePrice: z.coerce.number({ invalid_type_error: 'Le prix est obligatoire' })
    .int('Le prix doit être un entier en FCFA').positive('Le prix doit être supérieur à 0').max(100_000_000, 'Le prix ne peut pas dépasser 100 000 000 FCFA'),
  description: z.string().trim().max(500, 'La description ne peut pas dépasser 500 caractères').optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
```

**Schémas à ajouter (état cible) :**
```typescript
// Ajouter à la suite dans product.schema.ts

export const variantKeySchema = z.string().trim().min(1).max(200);
// Format libre : "Standard" ou "Taille:L,Couleur:Rouge" ou "Volume:500ml"

export const createStockLevelSchema = z.object({
  variantKey: variantKeySchema,
  quantity: z.coerce.number().int().min(0, 'Le stock ne peut pas être négatif'),
  alertThreshold: z.coerce.number().int().min(0).max(9999).default(5).optional(),
});
export type CreateStockLevelDto = z.infer<typeof createStockLevelSchema>;

export const updateStockLevelSchema = z.object({
  quantity: z.coerce.number().int().min(0, 'Le stock ne peut pas être négatif'),
});
export type UpdateStockLevelDto = z.infer<typeof updateStockLevelSchema>;

export const updateAlertThresholdSchema = z.object({
  alertThreshold: z.coerce.number().int().min(0).max(9999),
});
export type UpdateAlertThresholdDto = z.infer<typeof updateAlertThresholdSchema>;
```

### Module Products — État Actuel

Le module `products` est **partiellement implémenté** (Story 2.4 du wizard) :

```
apps/api/src/modules/products/
├── products.module.ts        ✅ existant
├── products.controller.ts    ✅ existant — POST /products + GET /products seulement
├── products.service.ts       ✅ existant — createProduct() + getProducts()
├── products.repository.ts    ✅ existant — createProductWithDefaultVariant() + findByTenantId()
└── products.service.spec.ts  ✅ existant — 6 tests unitaires du service
```

**`products.repository.ts` — méthode clé existante :**
```typescript
async createProductWithDefaultVariant(tenantId, data): Promise<ProductResult> {
  return this.prisma.$transaction(async (tx) => {
    const product = await tx.product.create({ data: { tenantId, ...data }, select: {...} });
    await tx.stockLevel.create({
      data: { tenantId, productId: product.id, variantKey: 'Standard', quantity: 0 }
      // ↑ alertThreshold absent ici — après migration, le @default(5) s'appliquera automatiquement
    });
    return product;
  });
}
```

**Important :** après l'ajout d'`alertThreshold @default(5)` dans le schéma Prisma, la méthode `createProductWithDefaultVariant` n'a PAS besoin d'être modifiée — le `@default(5)` Prisma s'applique automatiquement si le champ n'est pas fourni.

### Commandes à Exécuter

```bash
# Depuis le répertoire racine du monorepo
pnpm --filter api prisma migrate dev --name add_stock_level_alert_threshold

# Vérifier que le client Prisma est régénéré
pnpm --filter api prisma generate

# Lancer les tests unitaires du products module
pnpm --filter api test --testPathPattern="products"
```

### Structure des Fichiers — Ce Story

```
apps/api/src/modules/products/
└── products.repository.spec.ts    ← NOUVEAU (tests isolation multi-tenant)

apps/api/prisma/
├── schema.prisma                  ← MODIFIER (ajouter alertThreshold à StockLevel)
└── migrations/
    └── 20260530_add_stock_level_alert_threshold/
        └── migration.sql          ← GÉNÉRÉ par prisma migrate dev

packages/shared/src/schemas/
└── product.schema.ts              ← MODIFIER (ajouter 4 nouveaux schemas Zod)
```

### Pattern de Test d'Isolation Multi-Tenant (Référence)

```typescript
// apps/api/src/modules/products/products.repository.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsRepository } from './products.repository';
import { PrismaService } from '../../prisma/prisma.service';

const mockPrismaService = {
  product: {
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
  },
  stockLevel: {
    create: jest.fn(),
  },
  $transaction: jest.fn(),
};

describe('ProductsRepository — Isolation Multi-Tenant', () => {
  let repository: ProductsRepository;

  beforeEach(async () => {
    jest.clearAllMocks();
    // $transaction doit exécuter le callback et retourner son résultat
    mockPrismaService.$transaction.mockImplementation(async (cb) => cb(mockPrismaService));

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<ProductsRepository>(ProductsRepository);
  });

  describe('findByTenantId — isolation NFR8', () => {
    it('passe toujours tenantId dans where pour product.findMany', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await repository.findByTenantId('tenant-A', 1, 20);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ where: expect.objectContaining({ tenantId: 'tenant-A' }) })
      );
    });

    it('pagination correcte — page=2, limit=5 → skip=5, take=5', async () => {
      mockPrismaService.product.findMany.mockResolvedValue([]);
      mockPrismaService.product.count.mockResolvedValue(0);

      await repository.findByTenantId('tenant-A', 2, 5);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 })
      );
    });
  });

  describe('createProductWithDefaultVariant — isolation NFR8', () => {
    it('passe tenantId à product.create ET stockLevel.create', async () => {
      const productResult = { id: 'prod-1', name: 'Test', basePrice: 5000, imageUrl: null, isActive: true };
      mockPrismaService.product.create.mockResolvedValue(productResult);
      mockPrismaService.stockLevel.create.mockResolvedValue({});

      await repository.createProductWithDefaultVariant('tenant-A', { name: 'Test', basePrice: 5000 });

      expect(mockPrismaService.product.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: expect.objectContaining({ tenantId: 'tenant-A' }) })
      );
      expect(mockPrismaService.stockLevel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: 'tenant-A', variantKey: 'Standard' })
        })
      );
    });
  });
});
```

### Exports Partagés à Vérifier

Le barrel `packages/shared/src/index.ts` doit exporter les nouveaux types. Chercher la ligne qui exporte depuis `schemas/product.schema` et s'assurer que les nouveaux types sont inclus :

```typescript
// Exemple d'ajout dans packages/shared/src/index.ts
export {
  createProductSchema, type CreateProductDto,
  variantKeySchema,
  createStockLevelSchema, type CreateStockLevelDto,
  updateStockLevelSchema, type UpdateStockLevelDto,
  updateAlertThresholdSchema, type UpdateAlertThresholdDto,
} from './schemas/product.schema';
```

### Learnings de Stories Précédentes

- **Prisma client location** : l'import Prisma se fait depuis `'../../../generated/prisma/client'` (chemin custom du monorepo), PAS depuis `'@prisma/client'` — voir `subscriptions.repository.ts` comme référence
- **Tests `$transaction`** : mocker avec `jest.fn().mockImplementation(async (cb) => cb(mockPrisma))` pour que le callback s'exécute réellement (pattern établi en Story 2.8)
- **Prix en FCFA** : toujours `Int`, jamais `Float` dans le schéma Prisma — `basePrice Int` (déjà correct)
- **`quantity` jamais négatif** : la contrainte n'est pas dans Prisma (pas de CHECK inline) — elle doit être dans le service/repository via validation Zod (`min(0)`)
- **Commit pattern** : `feat(products): story 3.1 — schéma BDD produits et variantes`

---

## Dev Agent Record

### Completion Notes

- **Tâche 1 (Prisma)** : Ajout de `alertThreshold Int @default(5)` au modèle `StockLevel`. Migration `20260529063429_add_stock_level_alert_threshold` générée et appliquée sur Neon PostgreSQL. Le SQL généré est minimal : `ALTER TABLE "stock_levels" ADD COLUMN "alertThreshold" INTEGER NOT NULL DEFAULT 5;`. Aucune modification de `Product` ou d'autre table.
- **Tâche 2 (Zod)** : 4 nouveaux schémas ajoutés à `product.schema.ts` : `variantKeySchema`, `createStockLevelSchema`, `updateStockLevelSchema`, `updateAlertThresholdSchema`. Ré-exportés automatiquement via `schemas/index.ts → src/index.ts`. Build `@whatsell/shared` réussi sans erreur TypeScript.
- **Tâche 3 (Tests)** : 10 tests unitaires créés dans `products.repository.spec.ts`. Tous passent (16 tests products au total avec les 6 existants). Les 4 échecs de la suite complète (`encryption.service.spec.ts`, `storage.service.spec.ts`) sont pré-existants — confirmés par `git stash` avant nos changements.
- **Décision architecture confirmée** : variantes via `variantKey String` dans `StockLevel`, pas de table `product_variants` distincte. `@@unique([productId, variantKey])` préservé.

---

## File List

- `apps/api/prisma/schema.prisma` — MODIFIÉ (ajout `alertThreshold Int @default(5)` à `StockLevel`)
- `apps/api/prisma/migrations/20260529063429_add_stock_level_alert_threshold/migration.sql` — CRÉÉ (généré par Prisma)
- `packages/shared/src/schemas/product.schema.ts` — MODIFIÉ (ajout `variantKeySchema`, `createStockLevelSchema`, `updateStockLevelSchema`, `updateAlertThresholdSchema`)
- `apps/api/src/modules/products/products.repository.spec.ts` — CRÉÉ (10 tests isolation multi-tenant NFR8)
- `_bmad-output/implementation-artifacts/3-1-schema-bdd-produits-et-variantes.md` — MODIFIÉ (story file)
- `_bmad-output/implementation-artifacts/sprint-status.yaml` — MODIFIÉ (epic-3 → in-progress, story → review)

---

## Change Log

- **2026-05-29** : Implémentation Story 3.1 — Schéma BDD Produits & Variantes
  - Ajout `StockLevel.alertThreshold Int @default(5)` + migration Prisma appliquée
  - Extension schémas Zod partagés : 4 nouveaux schemas pour le cycle CRUD catalogue
  - Création `products.repository.spec.ts` : 10 tests d'isolation multi-tenant (NFR8)
