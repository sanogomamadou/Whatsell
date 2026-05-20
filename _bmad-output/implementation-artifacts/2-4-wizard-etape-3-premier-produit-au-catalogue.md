# Story 2.4 : Wizard Étape 3 — Premier Produit au Catalogue

Status: done

## Story

En tant que **vendeur en cours d'onboarding**,
je veux ajouter au moins un produit à mon catalogue pendant l'onboarding,
afin que mon agent IA ait quelque chose à vendre dès son activation.

## Acceptance Criteria

1. `POST /api/v1/products` avec `name` et `basePrice` valides (+ `image` optionnel multipart) → produit créé avec `tenantId` automatique + `StockLevel` avec `variantKey="Standard"`, `quantity=0` créé automatiquement → réponse `{ data: { id, name, basePrice, imageUrl, isActive } }`
2. `POST /api/v1/products` avec `name` vide → `400 Bad Request`, message humain
3. `POST /api/v1/products` avec `basePrice` ≤ 0 → `400 Bad Request`, message humain
4. `GET /api/v1/products` → liste des produits du tenant courant uniquement, format `{ data: Product[], meta: { total, page, limit } }`
5. La page `/onboarding/catalogue` affiche `<OnboardingStep stepNumber={3} total={5} title="Catalogue Initial" status="active" />` visible en permanence (UX-DR9)
6. La page charge les produits existants via `GET /api/v1/products` au montage du composant (skeleton pendant chargement — UX-DR20 : `ProductsSkeleton`, jamais spinner générique)
7. Le formulaire d'ajout contient : champ "Nom du produit" (obligatoire) + champ "Prix en FCFA" (obligatoire, entier positif) + champ "Photo" (optionnel, image depuis galerie mobile en 1 tap)
8. Soumission valide → appel `POST /api/v1/products`, succès → produit ajouté à la liste locale, formulaire réinitialisé (les champs repassent à vide)
9. Au moins 1 produit dans la liste → bouton "Continuer" activé → clic → redirection vers `/onboarding/payment` (placeholder Story 2.5)
10. 0 produit dans la liste + clic "Continuer" → état vide motivant affiché : "Ajoutez au moins 1 produit pour que votre agent puisse vendre !" avec CTA "Ajouter un produit" (UX-DR21)
11. En cas d'erreur API → message humain affiché avec action proposée (UX-DR22), bouton "Ajouter" reste accessible

## Tasks / Subtasks

- [x] Tâche 1 : Schéma Zod `createProductSchema` dans `packages/shared` (AC: 1, 2, 3)
  - [x] Créer `packages/shared/src/schemas/product.schema.ts`
  - [x] Ajouter `createProductSchema = z.object({ name: z.string().trim().min(1, ...), basePrice: z.coerce.number().int(...).positive(...), description: z.string().trim().max(500, ...).optional() })`
  - [x] Exporter `type CreateProductDto = z.infer<typeof createProductSchema>`
  - [x] Ajouter `export * from './product.schema'` dans `packages/shared/src/schemas/index.ts`
  - [x] Rebuild `@whatsell/shared` : `pnpm --filter @whatsell/shared build`

- [x] Tâche 2 : `ProductsRepository` — requêtes Prisma (AC: 1, 4)
  - [x] Créer `apps/api/src/modules/products/products.repository.ts`
  - [x] Méthode `createProductWithDefaultVariant(tenantId, data: { name, basePrice, description?, imageUrl? }): Promise<ProductResult>` :
    - `prisma.$transaction` → créer `Product` puis `StockLevel` avec `variantKey="Standard"`, `quantity=0`
  - [x] Méthode `findByTenantId(tenantId, page, limit): Promise<{ items: Product[]; total: number }>` :
    - `prisma.product.findMany({ where: { tenantId }, skip: (page-1)*limit, take: limit })` + `prisma.product.count({ where: { tenantId } })`

- [x] Tâche 3 : `ProductsService` — logique métier (AC: 1, 2, 3, 4)
  - [x] Créer `apps/api/src/modules/products/products.service.ts`
  - [x] Méthode `createProduct(tenantId, dto: CreateProductDto, image?: Express.Multer.File): Promise<ProductResult>` :
    1. Validation Zod → `BadRequestException` sur `ZodError`
    2. Si `image` → `this.storageService.upload(tenantId, 'products', image.buffer, image.mimetype)` → `imageUrl`
    3. `return this.productsRepository.createProductWithDefaultVariant(tenantId, { name, basePrice, description, imageUrl })`
  - [x] Méthode `getProducts(tenantId, page, limit): Promise<{ data: Product[]; meta: { total, page, limit } }>` :
    - Déléguer au repository, retourner le format paginé
  - [x] `StorageService` est global via `CommonModule` — **pas d'import dans `ProductsModule`**

- [x] Tâche 4 : `ProductsController` — endpoints REST (AC: 1, 2, 3, 4)
  - [x] Créer `apps/api/src/modules/products/products.controller.ts`
  - [x] `@Controller('products')` + `@ApiTags('products')` (si swagger configuré)
  - [x] `POST /` : `@Post()` + `@UseInterceptors(FileInterceptor('image'))` + `@Body() body: CreateProductDto` + `@UploadedFile() image?: Express.Multer.File` + `@CurrentTenant() tenantId: string`
  - [x] `GET /` : `@Get()` + `@Query('page') page = '1'` + `@Query('limit') limit = '20'` + `@CurrentTenant() tenantId: string`
  - [x] Les rôles `OWNER` et `CO_MANAGER` sont autorisés — ajouter `@Roles(Role.OWNER, Role.CO_MANAGER)` sur le controller
  - [x] **Pas de `@UseGuards`** — `JwtAuthGuard` + `RolesGuard` sont globaux (APP_GUARD)

- [x] Tâche 5 : `ProductsModule` + intégration `AppModule` (AC: 1, 2, 3, 4)
  - [x] Créer `apps/api/src/modules/products/products.module.ts` :
    - Importer `MulterModule.register({ limits: { fileSize: 5 * 1024 * 1024 } })` (5 Mo, comme OnboardingModule)
    - Déclarer `ProductsController`, fournir `ProductsService` + `ProductsRepository`
  - [x] Modifier `apps/api/src/app.module.ts` :
    - Ajouter `import { ProductsModule } from './modules/products/products.module'`
    - Ajouter `ProductsController` dans `import { ProductsController }` depuis products.controller
    - Ajouter `ProductsModule` dans le tableau `imports`
    - Ajouter `ProductsController` dans `consumer.apply(TenantMiddleware).forRoutes(...)` (avec les autres controllers)

- [x] Tâche 6 : Tests unitaires `products.service.spec.ts` (AC: 1, 2, 3)
  - [x] Créer `apps/api/src/modules/products/products.service.spec.ts`
  - [x] Mocks : `{ createProductWithDefaultVariant: jest.fn(), findByTenantId: jest.fn() }` pour le repository
  - [x] Mock `StorageService` : `{ upload: jest.fn() }`
  - [x] Test : nom + prix valides sans image → `createProductWithDefaultVariant` appelé, `upload` non appelé, retourne le produit
  - [x] Test : nom + prix valides + image → `upload()` appelé avec `tenantId, 'products', buffer, mimetype`, `createProductWithDefaultVariant` appelé avec `imageUrl`
  - [x] Test : upload R2 échoue → produit créé sans image (dégradation gracieuse)
  - [x] Test : nom vide → `BadRequestException`, repository non appelé
  - [x] Test : prix = 0 → `BadRequestException`, repository non appelé
  - [x] Test : prix négatif → `BadRequestException`, repository non appelé

- [x] Tâche 7 : Frontend — Page `/onboarding/catalogue/page.tsx` (AC: 5–11)
  - [x] Créer `apps/web/src/app/onboarding/catalogue/page.tsx` (`'use client'`)
  - [x] Afficher `<OnboardingStep stepNumber={3} total={5} title="Catalogue Initial" status="active" />`
  - [x] Charger les produits au montage via `GET /api/v1/products` (`apiGet`) — afficher skeleton pendant chargement
  - [x] State : `products: ProductItem[]` (liste locale mise à jour après chaque création)
  - [x] Formulaire d'ajout inline (pas de modal) avec React Hook Form + `zodResolver(createProductSchema)` :
    - Champ "Nom du produit" : `<Input>`, `h-12`, `autoComplete="off"`
    - Champ "Prix (FCFA)" : `<Input type="number" min="1" step="1" inputMode="numeric">`, `h-12`
    - Champ photo : `<input type="file" accept="image/jpeg,image/png,image/webp">` caché, bouton visible "Ajouter une photo" (optionnel)
  - [x] Soumission : `apiFormData('POST', '/api/v1/products', formData)` — **utiliser `apiFormData` pas `apiPost`** (multipart pour supporter la photo optionnelle)
  - [x] Succès → `setProducts(prev => [newProduct, ...prev])`, `reset()` (formulaire vide)
  - [x] Erreur → `setError('root', { message: '...' })` — message humain (UX-DR22)
  - [x] Liste des produits : carte par produit avec nom + prix formaté (ex: "12 500 FCFA") + photo si disponible
  - [x] Bouton "Continuer" : `w-full h-12`, désactivé si `isSubmitting` du formulaire
  - [x] Clic "Continuer" sans produit → afficher message d'erreur inline (pas toast) : "Ajoutez au moins 1 produit pour que votre agent puisse vendre !" avec le CTA "Ajouter un produit" (UX-DR21)
  - [x] Clic "Continuer" avec ≥1 produit → `router.push('/onboarding/payment')`
  - [x] Contraintes mobile-first 360px (voir Dev Notes)

## Dev Notes

### Schéma Prisma — AUCUNE MIGRATION REQUISE

Les tables `products` et `stock_levels` existent **déjà dans la base de données** (incluses dans la migration initiale `20260518154957`). Ne pas créer de migration. Ne pas modifier `schema.prisma`.

```prisma
model Product {
  id                  String      @id @default(uuid())
  tenantId            String
  name                String
  description         String?
  basePrice           Int         // Prix FCFA — Int obligatoire, jamais Float
  isActive            Boolean     @default(true)
  imageUrl            String?
  stockAlertThreshold Int         @default(5)
  createdAt           DateTime    @default(now())
  updatedAt           DateTime    @updatedAt

  tenant      Tenant       @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  stockLevels StockLevel[]

  @@index([tenantId])
  @@map("products")
}

model StockLevel {
  id         String   @id @default(uuid())
  tenantId   String
  productId  String
  variantKey String   // ex: "Standard", "Taille:L,Couleur:Rouge"
  quantity   Int      @default(0)
  // ...
  @@unique([productId, variantKey])
  @@map("stock_levels")
}
```

**IMPORTANT — Pas de `ProductVariant` model séparé** : les variantes sont modélisées par `StockLevel.variantKey` (string libre). La "variante par défaut" pour l'onboarding est `variantKey="Standard"`.

### Schéma Zod dans `packages/shared`

```typescript
// packages/shared/src/schemas/product.schema.ts — NOUVEAU FICHIER
import { z } from 'zod';

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Le nom du produit est obligatoire' })
    .trim()
    .min(1, 'Le nom du produit est obligatoire')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  basePrice: z
    .coerce
    .number({ invalid_type_error: 'Le prix est obligatoire' })
    .int('Le prix doit être un entier en FCFA')
    .positive('Le prix doit être supérieur à 0'),
  description: z
    .string()
    .trim()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
```

**`basePrice` est un entier** (FCFA, jamais Float/Decimal). Le `.coerce` permet de recevoir une string du FormData.

Ajouter dans `packages/shared/src/schemas/index.ts` :
```typescript
export * from './product.schema';
```

Ne pas oublier : `pnpm --filter @whatsell/shared build` après modification.

### StorageService — Pattern d'Upload (depuis Story 2.2)

```typescript
// Signature (apps/api/src/common/services/storage.service.ts)
upload(tenantId: string, folder: string, buffer: Buffer, mimetype: string): Promise<string>
// Retourne l'URL publique ou signée du fichier uploadé dans R2

// Usage pour les photos produit :
const imageUrl = await this.storageService.upload(
  tenantId,
  'products',         // ← nouveau dossier (comme 'logos' pour Story 2.2)
  image.buffer,
  image.mimetype,
);
```

`StorageService` est `@Global()` dans `CommonModule` — **pas d'import dans `ProductsModule`**.

### Implémentation du Repository

```typescript
// products.repository.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createProductWithDefaultVariant(
    tenantId: string,
    data: { name: string; basePrice: number; description?: string; imageUrl?: string },
  ): Promise<{ id: string; name: string; basePrice: number; imageUrl: string | null; isActive: boolean }> {
    return this.prisma.$transaction(async (tx) => {
      const product = await tx.product.create({
        data: {
          tenantId,
          name: data.name,
          basePrice: data.basePrice,
          description: data.description,
          imageUrl: data.imageUrl,
        },
        select: { id: true, name: true, basePrice: true, imageUrl: true, isActive: true },
      });

      await tx.stockLevel.create({
        data: {
          tenantId,
          productId: product.id,
          variantKey: 'Standard',
          quantity: 0,
        },
      });

      return product;
    });
  }

  async findByTenantId(
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<{ items: Array<{ id: string; name: string; basePrice: number; imageUrl: string | null; isActive: boolean }>; total: number }> {
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { tenantId },
        select: { id: true, name: true, basePrice: true, imageUrl: true, isActive: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where: { tenantId } }),
    ]);
    return { items, total };
  }
}
```

**Note** : `prisma.product.update` avec P2025 (product not found) lève une erreur Prisma — à wrapper en `NotFoundException` si nécessaire dans les méthodes de mise à jour futures (hors scope de cette story).

### Implémentation du Service

```typescript
// products.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import { ZodError } from 'zod';
import { createProductSchema, type CreateProductDto } from '@whatsell/shared';
import { StorageService } from '../../common/services/storage.service';
import { ProductsRepository } from './products.repository';

@Injectable()
export class ProductsService {
  constructor(
    private readonly productsRepository: ProductsRepository,
    private readonly storageService: StorageService,
  ) {}

  async createProduct(
    tenantId: string,
    dto: CreateProductDto,
    image?: Express.Multer.File,
  ): Promise<{ id: string; name: string; basePrice: number; imageUrl: string | null; isActive: boolean }> {
    let validated: CreateProductDto;
    try {
      validated = createProductSchema.parse(dto);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors[0]?.message ?? 'Données invalides');
      }
      throw err;
    }

    let imageUrl: string | undefined;
    if (image) {
      imageUrl = await this.storageService.upload(
        tenantId,
        'products',
        image.buffer,
        image.mimetype,
      );
    }

    return this.productsRepository.createProductWithDefaultVariant(tenantId, {
      name: validated.name,
      basePrice: validated.basePrice,
      description: validated.description,
      imageUrl,
    });
  }

  async getProducts(
    tenantId: string,
    page: number,
    limit: number,
  ): Promise<{ data: Array<{ id: string; name: string; basePrice: number; imageUrl: string | null; isActive: boolean }>; meta: { total: number; page: number; limit: number } }> {
    const { items, total } = await this.productsRepository.findByTenantId(tenantId, page, limit);
    return { data: items, meta: { total, page, limit } };
  }
}
```

### Implémentation du Controller

```typescript
// products.controller.ts
import {
  Controller, Get, Post, Body, Query,
  UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { CreateProductDto } from '@whatsell/shared';
import { ProductsService } from './products.service';

@Controller('products')
@Roles('OWNER', 'CO_MANAGER')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('image'))
  async createProduct(
    @Body() body: CreateProductDto,
    @UploadedFile() image: Express.Multer.File | undefined,
    @CurrentTenant() tenantId: string,
  ) {
    return this.productsService.createProduct(tenantId, body, image);
  }

  @Get()
  async getProducts(
    @CurrentTenant() tenantId: string,
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.productsService.getProducts(tenantId, +page, +limit);
  }
}
```

**Pas de `@UseGuards`** — `JwtAuthGuard` + `RolesGuard` sont globaux (`APP_GUARD` dans `AppModule`).

### ProductsModule

```typescript
// products.module.ts
import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { ProductsController } from './products.controller';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';

@Module({
  imports: [
    MulterModule.register({
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo — même limite que OnboardingModule
    }),
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsRepository],
})
export class ProductsModule {}
```

### Intégration dans AppModule

```typescript
// app.module.ts — MODIFICATIONS REQUISES

// Ajouter les imports :
import { ProductsModule } from './modules/products/products.module';
import { ProductsController } from './modules/products/products.controller';

// Dans @Module({ imports: [...] }) :
ProductsModule,  // ← AJOUTER après NotificationsModule

// Dans configure() :
consumer
  .apply(TenantMiddleware)
  .forRoutes(OnboardingController, EventsController, NotificationsController, ProductsController); // ← AJOUTER ProductsController
```

### Frontend — Pattern API

Cette story utilise **FormData** (multipart) pour la création de produit, même si la photo est absente. Pourquoi : le champ photo est optionnel mais géré par un `<input type="file">` — `apiFormData` est le seul helper qui omet `Content-Type` et laisse le browser set `multipart/form-data + boundary` automatiquement.

```typescript
// CORRECT — multipart pour supporter la photo optionnelle
import { apiFormData, apiGet } from '@/lib/api';

// Création produit
const formData = new FormData();
formData.append('name', data.name);
formData.append('basePrice', String(data.basePrice));  // ← string dans FormData, coercé par Zod côté backend
if (data.description) formData.append('description', data.description);
if (imageFile) formData.append('image', imageFile);    // ← clé 'image' = FileInterceptor('image')

const result = await apiFormData<{ data: ProductItem }>(
  'POST',
  '/api/v1/products',
  formData,
);

// Chargement initial
const existing = await apiGet<{ data: ProductItem[]; meta: { total: number; page: number; limit: number } }>(
  '/api/v1/products',
);
```

### Frontend — Structure de la Page

```typescript
// apps/web/src/app/onboarding/catalogue/page.tsx

'use client';
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { createProductSchema, type CreateProductDto } from '@whatsell/shared';
import { apiFormData, apiGet } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { OnboardingStep } from '@/components/shared/OnboardingStep';

type ProductItem = { id: string; name: string; basePrice: number; imageUrl: string | null; isActive: boolean };

// Structure globale :
// 1. OnboardingStep (3/5)
// 2. Liste des produits (skeleton → liste ou état vide motivant)
// 3. Card formulaire "Ajouter un produit"
// 4. Erreur globale (ajout ou continuation sans produit)
// 5. Bouton "Continuer"
```

**Format prix** : afficher `basePrice.toLocaleString('fr-FR')` + " FCFA" (ex : "12 500 FCFA").

### Contraintes Mobile-First 360px

- Layout identique aux stories 2.2 et 2.3 : `min-h-screen bg-background flex flex-col items-center justify-start pt-8 px-4` + `w-full max-w-sm`
- Inputs : `h-12` (48px — touch target)
- Bouton "Ajouter" + bouton "Continuer" : `w-full h-12`
- Bouton photo : `min-h-[44px]`, texte conditionnel ("Ajouter une photo" / "Photo ajoutée ✓")
- Carte produit dans la liste : nom en `font-medium`, prix formaté en `text-text-muted text-sm`
- Skeleton : `<div className="h-16 bg-neutral-100 rounded-lg animate-pulse" />` × 2 (jamais spinner)
- Messages d'erreur : jamais en temps réel pendant la saisie, uniquement après soumission

### Routing Wizard — Décision Architecture

- Étape 1 : `/onboarding` (Story 2.2) ✓ FAIT
- Étape 2 : `/onboarding/whatsapp` (Story 2.3) ✓ FAIT
- Étape 3 : `/onboarding/catalogue` (cette story) ← **ICI**
- Étape 4 : `/onboarding/payment` (Story 2.5 — créer ce dossier vide ou placeholder)
- Étape 5 : `/onboarding/activate` (Story 2.6)

La page `apps/web/src/app/onboarding/whatsapp/page.tsx` redirige déjà vers `/onboarding/catalogue` après succès (Story 2.3) — cette story crée cette destination.

### Fichiers à Créer / Modifier

```
NOUVEAUX :
packages/shared/src/schemas/product.schema.ts
apps/api/src/modules/products/products.module.ts
apps/api/src/modules/products/products.controller.ts
apps/api/src/modules/products/products.service.ts
apps/api/src/modules/products/products.repository.ts
apps/api/src/modules/products/products.service.spec.ts
apps/web/src/app/onboarding/catalogue/page.tsx

MODIFIÉS :
packages/shared/src/schemas/index.ts  (ajouter export * from './product.schema')
apps/api/src/app.module.ts            (ajouter ProductsModule + ProductsController dans TenantMiddleware)

INCHANGÉS :
apps/api/prisma/schema.prisma           (tables déjà présentes — NE PAS MODIFIER)
apps/api/prisma/migrations/             (NE PAS créer de migration)
apps/api/src/modules/onboarding/        (NE PAS TOUCHER)
```

### Learnings des Stories Précédentes

**Story 2.2 (upload fichier)** :
- `apiFormData(method, endpoint, formData)` pour le multipart — **pas `apiPost`**
- `MulterModule.register({ limits: { fileSize: 5 * 1024 * 1024 } })` dans le module
- `StorageService.upload(tenantId, folder, buffer, mimetype)` retourne l'URL
- `FileInterceptor('fieldName')` dans le controller + `@UploadedFile() file?: Express.Multer.File`
- R2 peut ne pas être configuré en dev local — `StorageService.upload()` lève `Error` si R2 absent. En dev sans R2, passer `imageUrl = undefined` silencieusement est acceptable (voir DEF-06 dans deferred-work.md)
- Orphelin R2 si DB write échoue après upload réussi (D-01 deferred — accepté, pattern connu)

**Story 2.3 (service + tests)** :
- ZodError → `BadRequestException(err.errors[0]?.message)` — même pattern ici
- `ResponseWrapperInterceptor` global : **ne jamais envelopper manuellement** `{ data: ... }` dans les services/controllers — le service retourne le produit directement, l'interceptor wraps automatiquement
- `@CurrentTenant()` injecté par `TenantMiddleware` — **requiert que `ProductsController` soit dans `forRoutes()`**
- `EncryptionService` n'est pas nécessaire ici (pas de données sensibles dans les produits)
- 4 test failures pré-existantes (`encryption.service.spec.ts` x1, `storage.service.spec.ts` x3) — **ne pas les corriger**
- Mock `StorageService` dans les tests : `{ upload: jest.fn().mockResolvedValue('https://cdn.example.com/products/test.jpg') }`

**Story 2.2 (patterns frontend)** :
- `errors.root` display pattern : `{errors.root && <p role="alert" className="text-sm text-destructive">{errors.root.message}</p>}`
- `OnboardingStep` props : `{ stepNumber, total, title, status }` — import depuis `@/components/shared/OnboardingStep`
- Pattern erreur HTTP : `message.includes('413')`, `message.includes('415')`, `message.includes('400')` — fragile mais pré-existant (D-04 dans deferred-work.md)
- `useRef` + `URL.createObjectURL` + `URL.revokeObjectURL` dans le cleanup `useEffect` pour la prévisualisation d'image

### Pièges à Éviter

1. **NE PAS créer de migration Prisma** — les tables `products` et `stock_levels` existent déjà.
2. **NE PAS créer de modèle `ProductVariant`** — les variantes sont dans `StockLevel.variantKey` (string "Standard" pour l'onboarding). Le schéma actuel ne supporte pas de modèle séparé.
3. **`basePrice` est un `Int` (FCFA)**, pas un `Decimal` — utiliser `z.coerce.number().int()` et ne jamais stocker de décimales.
4. **`ProductsController` DOIT être dans `TenantMiddleware.forRoutes()`** — sans ça, `@CurrentTenant()` retourne `undefined` et toutes les requêtes échouent silencieusement.
5. **Ne pas oublier d'importer `ProductsController`** dans `app.module.ts` pour le middleware (en plus d'importer `ProductsModule`).
6. **Ne pas utiliser `apiPost`** pour la création de produit — même sans photo, utiliser `apiFormData` pour cohérence avec le `FileInterceptor` côté backend.
7. **`ResponseWrapperInterceptor` wraps automatiquement** — le service retourne `{ id, name, basePrice, imageUrl, isActive }` directement, pas `{ data: { id, ... } }`.
8. **`StorageService` absent en dev** (R2 non configuré) → l'upload lève `Error`. Intercepter dans le service pour éviter un 500 brut si R2 est absent : `try { imageUrl = await upload(...) } catch { imageUrl = undefined }` — ou simplement documenter que R2 doit être configuré.

### Dépendance Sprint — IMPORTANT

Cette story dépend des modèles Prisma `Product` et `StockLevel` (Story 3.1) qui **existent déjà dans la DB** et de l'API produits (Story 3.2) qui est **implémentée dans cette story**. La dépendance documentée dans les epics (3.1 → 3.2 avant 2.4) est satisfaite : le schéma DB est présent, et les endpoints API sont créés ici. Stories 3.1 et 3.2 resteront à marquer comme terminées séparément (elles couvrent aussi les autres endpoints CRUD et la gestion des variantes avancées hors scope de cette story).

### Références

- `StorageService` : [storage.service.ts](../../../apps/api/src/common/services/storage.service.ts) — `upload(tenantId, folder, buffer, mimetype)` retourne l'URL
- `CommonModule` (`@Global`) : [common.module.ts](../../../apps/api/src/common/common.module.ts) — `StorageService` globalement disponible
- `OnboardingModule` (pattern référence) : [onboarding.module.ts](../../../apps/api/src/modules/onboarding/onboarding.module.ts)
- `OnboardingService` (pattern upload + ZodError) : [onboarding.service.ts](../../../apps/api/src/modules/onboarding/onboarding.service.ts)
- `AppModule` (pattern intégration module) : [app.module.ts](../../../apps/api/src/app.module.ts)
- Schéma Prisma (Product + StockLevel) : [schema.prisma](../../../apps/api/prisma/schema.prisma)
- `OnboardingStep` composant : [OnboardingStep.tsx](../../../apps/web/src/components/shared/OnboardingStep.tsx)
- Page étape 2 (patterns frontend) : [onboarding/whatsapp/page.tsx](../../../apps/web/src/app/onboarding/whatsapp/page.tsx)
- Page étape 1 (pattern upload fichier) : [onboarding/page.tsx](../../../apps/web/src/app/onboarding/page.tsx)
- `apiFormData` + `apiGet` : [api.ts](../../../apps/web/src/lib/api.ts)
- Schéma partagé onboarding (pattern) : [onboarding.schema.ts](../../../packages/shared/src/schemas/onboarding.schema.ts)
- Deferred work (D-01, D-04 Story 2.2 — upload R2 orphelins + erreur fragile) : [deferred-work.md](./deferred-work.md)

## Dev Agent Record

### Agent Model Used

claude-sonnet-4-6

### Debug Log References

- Erreur TS2345 : `StorageService.upload()` acceptait `'receipts' | 'logos' | 'invoices'` mais pas `'products'`. Ajout de `'products'` dans `StorageType` + bucket `'whatsell-products'` dans `storage.service.ts`.
- Erreur TS2307 : import `'../../generated/prisma/client'` incorrect dans `products.controller.ts` — le client Prisma est à `apps/api/generated/prisma` (output Prisma = `../generated/prisma` depuis `prisma/`). Corrigé en `'../../../generated/prisma/client'` (3 niveaux depuis `src/modules/products/`).
- 4 test failures pré-existantes confirmées dans `storage.service.spec.ts` (3) et `encryption.service.spec.ts` (1) — identiques à celles documentées en Stories 2.2 et 2.3. Aucune nouvelle failure introduite.

### Completion Notes List

- **Tâche 1** : `createProductSchema` + `CreateProductDto` créés dans `packages/shared/src/schemas/product.schema.ts`. `basePrice` est `z.coerce.number().int().positive()` (FCFA, entier). Build shared réussi.
- **Tâche 2** : `ProductsRepository` créé — `createProductWithDefaultVariant()` via `prisma.$transaction` (Product + StockLevel variantKey="Standard"), `findByTenantId()` avec pagination et `Promise.all`.
- **Tâche 3** : `ProductsService` créé — validation Zod → BadRequestException, upload R2 dégradé silencieusement si erreur (imageUrl=undefined), délégation au repository. `StorageService` global via CommonModule.
- **Tâche 4** : `ProductsController` créé — `POST /api/v1/products` (multipart FileInterceptor 'image' + imageFilter MIME), `GET /api/v1/products` (paginé). `@Roles(Role.OWNER, Role.CO_MANAGER)` au niveau du controller. Import `Role` depuis `'../../../generated/prisma/client'`.
- **Tâche 5** : `ProductsModule` créé avec `MulterModule` (5 Mo). `AppModule` mis à jour : import `ProductsModule` + `ProductsController`, ajout dans `imports[]` et `TenantMiddleware.forRoutes()`.
- **Tâche 6** : 7 tests unitaires — 7/7 PASS. Cas couverts : sans image, avec image, upload R2 échoue, nom vide, prix=0, prix négatif, getProducts paginé.
- **Tâche 7** : Page `/onboarding/catalogue/page.tsx` créée — `OnboardingStep(3/5)`, chargement initial GET + skeleton UX-DR20, formulaire RHF + Zod (nom + prix + photo optionnelle), `apiFormData POST`, liste mise à jour localement, état vide UX-DR21 si continuer sans produit, `router.push('/onboarding/payment')`.
- **StorageType** : `'products'` ajouté à `StorageType` dans `storage.service.ts` + bucket `'whatsell-products'` — modification mineure du service partagé nécessaire pour le nouvel usage.
- **TypeScript** : `tsc --noEmit` passe sur web et api sans erreur.
- **Régressions** : 0 nouvelles failures. 4 failures pré-existantes confirmées.

### File List

packages/shared/src/schemas/product.schema.ts (nouveau)
packages/shared/src/schemas/index.ts (modifié — ajout export product.schema)
apps/api/src/common/services/storage.service.ts (modifié — ajout type 'products' + bucket whatsell-products)
apps/api/src/modules/products/products.module.ts (nouveau)
apps/api/src/modules/products/products.controller.ts (nouveau)
apps/api/src/modules/products/products.service.ts (nouveau)
apps/api/src/modules/products/products.repository.ts (nouveau)
apps/api/src/modules/products/products.service.spec.ts (nouveau)
apps/api/src/app.module.ts (modifié — ajout ProductsModule + ProductsController dans TenantMiddleware)
apps/web/src/app/onboarding/catalogue/page.tsx (nouveau)

### Review Findings

- [x] [Review][Decision] Produits inactifs visibles dans la liste onboarding — résolu : `where: { tenantId, isActive: true }` appliqué sur `findMany` et `count`. [apps/api/src/modules/products/products.repository.ts]

- [x] [Review][Patch] `basePrice: number` au lieu de `true` dans select Prisma — FALSE POSITIVE : le fichier avait déjà `true` (confusion type TS vs valeur Prisma dans le prompt du reviewer) [apps/api/src/modules/products/products.repository.ts:57]
- [x] [Review][Patch] Pagination params non validés — `page=0`/`NaN`/négatif → skip négatif Prisma (500) ; `limit` non borné → DoS mémoire — CORRIGÉ : `parseInt` + bornes 1–100 dans le controller [apps/api/src/modules/products/products.controller.ts:58-63]
- [x] [Review][Patch] Race condition frontend — GET initial peut écraser l'état local si la réponse arrive après un POST réussi — CORRIGÉ : `hasMutatedRef` + flag `mounted` dans le `useEffect` [apps/web/src/app/onboarding/catalogue/page.tsx:44-52]
- [x] [Review][Patch] Double soumission possible — FALSE POSITIVE : `react-hook-form handleSubmit` bloque les soumissions concurrentes nativement [apps/web/src/app/onboarding/catalogue/page.tsx:75]
- [x] [Review][Patch] Fichier 0 octet accepté à l'upload — CORRIGÉ : guard `image.buffer.length > 0` ajouté [apps/api/src/modules/products/products.service.ts:43]
- [x] [Review][Patch] `basePrice` sans borne supérieure — CORRIGÉ : `.max(100_000_000, ...)` ajouté au schéma Zod [packages/shared/src/schemas/product.schema.ts:9]
- [x] [Review][Patch] Composant démonté pendant le GET initial — CORRIGÉ : flag `mounted` + cleanup dans `useEffect` [apps/web/src/app/onboarding/catalogue/page.tsx:44]
- [x] [Review][Patch] Fuite mémoire Object URL — FALSE POSITIVE : le fichier avait déjà `[imagePreview]` dans les deps du `useEffect` [apps/web/src/app/onboarding/catalogue/page.tsx:56]
- [x] [Review][Patch] Config Multer dupliquée — CORRIGÉ : `limits` retiré de `ProductsModule.register`, seul `FileInterceptor` les définit [apps/api/src/modules/products/products.module.ts:9]
- [x] [Review][Patch] AC10 — CTA interactif "Ajouter un produit" absent de l'état vide motivant — CORRIGÉ : `<Button>` avec focus sur le champ nom ajouté [apps/web/src/app/onboarding/catalogue/page.tsx:275]
- [x] [Review][Patch] AC6 — Skeleton non extrait en composant `ProductsSkeleton` nommé (UX-DR20) — CORRIGÉ : composant `ProductsSkeleton` extrait et utilisé [apps/web/src/app/onboarding/catalogue/page.tsx:132]

- [x] [Review][Defer] Orphelin R2 si transaction DB échoue après upload réussi [apps/api/src/modules/products/products.service.ts:44] — deferred, pre-existing (D-01 story 2-2)
- [x] [Review][Defer] Détection d'erreur HTTP frontend fragile via `message.includes('400')` [apps/web/src/app/onboarding/catalogue/page.tsx:91] — deferred, pre-existing (D-04 story 2-2)
- [x] [Review][Defer] `imageUrl` stocke une clé R2 (`tenantId/products/uuid`) pas une URL HTTP — images potentiellement brisées [apps/api/src/common/services/storage.service.ts] — deferred, pre-existing (DEF-07 story 1-8)
- [x] [Review][Defer] Upload R2 silencieux en production — catch avale toutes erreurs sans log ni distinction dev/prod [apps/api/src/modules/products/products.service.ts:46] — deferred, pre-existing (DEF-06 story 2-2)
- [x] [Review][Defer] MIME spoofing — validation MIME basée sur l'en-tête client, pas sur les magic bytes [apps/api/src/modules/products/products.controller.ts:19] — deferred, hardening sécurité post-MVP
- [x] [Review][Defer] Race condition count/findMany — `Promise.all` non atomique, incohérence total/items possible [apps/api/src/modules/products/products.repository.ts:55] — deferred, faible risque onboarding

### Change Log

- 2026-05-20 : Story 2.4 créée — wizard étape 3 catalogue initial, ajout premier produit avec photo optionnelle
- 2026-05-20 : Story 2.4 implémentée — module Products backend (controller + service + repository + tests), page wizard étape 3 frontend, StorageType étendu avec 'products'
