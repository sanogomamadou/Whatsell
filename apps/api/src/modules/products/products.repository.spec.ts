import { Test, TestingModule } from '@nestjs/testing';
import { ProductsRepository } from './products.repository';
import { PrismaService } from '../../prisma/prisma.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

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

// ─── Fixtures ────────────────────────────────────────────────────────────────

const PRODUCT_RESULT = {
  id: 'prod-uuid-1',
  name: 'Boubou Bazin Bleu',
  basePrice: 15000,
  imageUrl: null,
  isActive: true,
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProductsRepository — Isolation Multi-Tenant (NFR8)', () => {
  let repository: ProductsRepository;

  beforeEach(async () => {
    jest.clearAllMocks();

    // $transaction exécute le callback avec le mock comme proxy tx
    mockPrismaService.$transaction.mockImplementation(
      async (cb: (tx: typeof mockPrismaService) => Promise<unknown>) => cb(mockPrismaService),
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsRepository,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    repository = module.get<ProductsRepository>(ProductsRepository);
  });

  // ─── findByTenantId ───────────────────────────────────────────────────────

  describe('findByTenantId', () => {
    beforeEach(() => {
      mockPrismaService.product.findMany.mockResolvedValue([PRODUCT_RESULT]);
      mockPrismaService.product.count.mockResolvedValue(1);
    });

    it('filtre toujours par tenantId dans where — isolation NFR8', async () => {
      await repository.findByTenantId('tenant-A', 1, 20);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-A' }),
        }),
      );
      expect(mockPrismaService.product.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ tenantId: 'tenant-A' }),
        }),
      );
    });

    it('pagination correcte — page=2, limit=5 → skip=5, take=5', async () => {
      await repository.findByTenantId('tenant-A', 2, 5);

      expect(mockPrismaService.product.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ skip: 5, take: 5 }),
      );
    });

    it('retourne le format { items, total } attendu par le service', async () => {
      const result = await repository.findByTenantId('tenant-A', 1, 20);

      expect(result).toEqual({ items: [PRODUCT_RESULT], total: 1 });
    });

    it('tenant-B ne voit pas les données de tenant-A — mock simule le filtre DB', async () => {
      // Simule une DB où seul tenant-A a des produits : le mock retourne selon le tenantId reçu
      mockPrismaService.product.findMany.mockImplementation(
        ({ where }: { where: { tenantId: string } }) =>
          where.tenantId === 'tenant-A' ? [PRODUCT_RESULT] : [],
      );
      mockPrismaService.product.count.mockImplementation(
        ({ where }: { where: { tenantId: string } }) =>
          where.tenantId === 'tenant-A' ? 1 : 0,
      );

      const resultB = await repository.findByTenantId('tenant-B', 1, 20);
      expect(resultB.items).toHaveLength(0);
      expect(resultB.total).toBe(0);

      const resultA = await repository.findByTenantId('tenant-A', 1, 20);
      expect(resultA.items).toHaveLength(1);
    });
  });

  // ─── createProductWithDefaultVariant ─────────────────────────────────────

  describe('createProductWithDefaultVariant', () => {
    beforeEach(() => {
      mockPrismaService.product.create.mockResolvedValue(PRODUCT_RESULT);
      mockPrismaService.stockLevel.create.mockResolvedValue({});
    });

    it('passe tenantId à product.create — isolation NFR8', async () => {
      await repository.createProductWithDefaultVariant('tenant-A', {
        name: 'Boubou Bazin Bleu',
        basePrice: 15000,
      });

      expect(mockPrismaService.product.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ tenantId: 'tenant-A' }),
        }),
      );
    });

    it('passe tenantId à stockLevel.create — isolation NFR8', async () => {
      await repository.createProductWithDefaultVariant('tenant-A', {
        name: 'Boubou Bazin Bleu',
        basePrice: 15000,
      });

      expect(mockPrismaService.stockLevel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            tenantId: 'tenant-A',
            productId: PRODUCT_RESULT.id,
            variantKey: 'Standard',
          }),
        }),
      );
    });

    it("s'exécute dans une transaction atomique", async () => {
      await repository.createProductWithDefaultVariant('tenant-A', {
        name: 'Boubou Bazin Bleu',
        basePrice: 15000,
      });

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
    });

    it('retourne le produit créé sans les stockLevels', async () => {
      const result = await repository.createProductWithDefaultVariant('tenant-A', {
        name: 'Boubou Bazin Bleu',
        basePrice: 15000,
      });

      expect(result).toEqual(PRODUCT_RESULT);
    });
  });
});
