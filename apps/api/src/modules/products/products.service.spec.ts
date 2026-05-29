import { BadRequestException, ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { StorageService } from '../../common/services/storage.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockProductsRepository = {
  createProductWithDefaultVariant: jest.fn(),
  findByTenantId: jest.fn(),
  findByIdAndTenant: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  toggleActive: jest.fn(),
  addVariantToProduct: jest.fn(),
  findVariantByIdAndProduct: jest.fn(),
  deleteVariantById: jest.fn(),
  deactivateVariantById: jest.fn(),
  countOrderItemsByVariantId: jest.fn(),
};

const mockStorageService = {
  upload: jest.fn(),
};

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-uuid-1';
const PRODUCT_ID = 'product-uuid-1';
const VARIANT_ID = 'variant-uuid-1';

const PRODUCT_RESULT = {
  id: PRODUCT_ID,
  name: 'Boubou Bazin Bleu',
  basePrice: 15000,
  imageUrl: null,
  isActive: true,
};

const PRODUCT_DETAIL = {
  ...PRODUCT_RESULT,
  description: 'Bazin Riche qualité premium',
  createdAt: new Date('2026-05-29T10:00:00Z'),
  updatedAt: new Date('2026-05-29T10:00:00Z'),
  stockLevels: [
    { id: 'stock-uuid-1', variantKey: 'Standard', quantity: 10, alertThreshold: 5, isActive: true },
  ],
};

const VARIANT_RESULT = {
  id: VARIANT_ID,
  variantKey: 'Taille:L',
  quantity: 5,
  alertThreshold: 5,
  isActive: true,
};

const mockImageFile = {
  fieldname: 'image',
  originalname: 'produit.png',
  encoding: '7bit',
  mimetype: 'image/png',
  buffer: Buffer.from('fake-image-data'),
  size: 2048,
} as Express.Multer.File;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProductsService', () => {
  let service: ProductsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockProductsRepository.createProductWithDefaultVariant.mockResolvedValue(PRODUCT_RESULT);
    mockProductsRepository.findByTenantId.mockResolvedValue({ items: [PRODUCT_RESULT], total: 1 });
    mockProductsRepository.findByIdAndTenant.mockResolvedValue(PRODUCT_DETAIL);
    mockProductsRepository.updateById.mockResolvedValue(PRODUCT_RESULT);
    mockProductsRepository.deleteById.mockResolvedValue({ id: PRODUCT_ID });
    mockProductsRepository.toggleActive.mockResolvedValue({ ...PRODUCT_RESULT, isActive: false });
    mockProductsRepository.addVariantToProduct.mockResolvedValue(VARIANT_RESULT);
    mockProductsRepository.findVariantByIdAndProduct.mockResolvedValue(VARIANT_RESULT);
    mockProductsRepository.deleteVariantById.mockResolvedValue({ id: VARIANT_ID });
    mockProductsRepository.deactivateVariantById.mockResolvedValue({ ...VARIANT_RESULT, isActive: false });
    mockProductsRepository.countOrderItemsByVariantId.mockResolvedValue(0);
    mockStorageService.upload.mockResolvedValue('https://cdn.example.com/products/produit.png');

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: ProductsRepository, useValue: mockProductsRepository },
        { provide: StorageService, useValue: mockStorageService },
      ],
    }).compile();

    service = module.get<ProductsService>(ProductsService);
  });

  // ─── createProduct ────────────────────────────────────────────────────────

  describe('createProduct', () => {
    it('nom + prix valides sans image → createProductWithDefaultVariant appelé, upload non appelé', async () => {
      const result = await service.createProduct(
        TENANT_ID,
        { name: 'Boubou Bazin Bleu', basePrice: 15000 },
      );

      expect(mockStorageService.upload).not.toHaveBeenCalled();
      expect(mockProductsRepository.createProductWithDefaultVariant).toHaveBeenCalledWith(
        TENANT_ID,
        { name: 'Boubou Bazin Bleu', basePrice: 15000, description: undefined, imageUrl: undefined },
      );
      expect(result).toEqual(PRODUCT_RESULT);
    });

    it('nom + prix valides + image → upload() appelé avec bons args, imageUrl passée au repository', async () => {
      const withImage = { ...PRODUCT_RESULT, imageUrl: 'https://cdn.example.com/products/produit.png' };
      mockProductsRepository.createProductWithDefaultVariant.mockResolvedValue(withImage);

      const result = await service.createProduct(
        TENANT_ID,
        { name: 'Boubou Bazin Bleu', basePrice: 15000 },
        mockImageFile,
      );

      expect(mockStorageService.upload).toHaveBeenCalledWith(
        TENANT_ID,
        'products',
        mockImageFile.buffer,
        mockImageFile.mimetype,
      );
      expect(mockProductsRepository.createProductWithDefaultVariant).toHaveBeenCalledWith(
        TENANT_ID,
        expect.objectContaining({ imageUrl: 'https://cdn.example.com/products/produit.png' }),
      );
      expect(result.imageUrl).toBe('https://cdn.example.com/products/produit.png');
    });

    it('upload R2 échoue → imageUrl undefined, création du produit continue sans image', async () => {
      mockStorageService.upload.mockRejectedValue(new Error('R2 non configuré'));

      const result = await service.createProduct(
        TENANT_ID,
        { name: 'Boubou Bazin Bleu', basePrice: 15000 },
        mockImageFile,
      );

      expect(mockProductsRepository.createProductWithDefaultVariant).toHaveBeenCalledWith(
        TENANT_ID,
        expect.objectContaining({ imageUrl: undefined }),
      );
      expect(result).toEqual(PRODUCT_RESULT);
    });

    it('nom vide → BadRequestException, repository non appelé', async () => {
      await expect(
        service.createProduct(TENANT_ID, { name: '', basePrice: 15000 }),
      ).rejects.toThrow(BadRequestException);

      expect(mockProductsRepository.createProductWithDefaultVariant).not.toHaveBeenCalled();
      expect(mockStorageService.upload).not.toHaveBeenCalled();
    });

    it('prix = 0 → BadRequestException, repository non appelé', async () => {
      await expect(
        service.createProduct(TENANT_ID, { name: 'Produit valide', basePrice: 0 }),
      ).rejects.toThrow(BadRequestException);

      expect(mockProductsRepository.createProductWithDefaultVariant).not.toHaveBeenCalled();
    });

    it('prix négatif → BadRequestException, repository non appelé', async () => {
      await expect(
        service.createProduct(TENANT_ID, { name: 'Produit valide', basePrice: -500 }),
      ).rejects.toThrow(BadRequestException);

      expect(mockProductsRepository.createProductWithDefaultVariant).not.toHaveBeenCalled();
    });

    it('prix > 100 000 000 → BadRequestException, repository non appelé', async () => {
      await expect(
        service.createProduct(TENANT_ID, { name: 'Produit valide', basePrice: 100_000_001 }),
      ).rejects.toThrow(BadRequestException);

      expect(mockProductsRepository.createProductWithDefaultVariant).not.toHaveBeenCalled();
    });
  });

  // ─── getProducts ─────────────────────────────────────────────────────────

  describe('getProducts', () => {
    it('retourne les produits avec meta paginée', async () => {
      const result = await service.getProducts(TENANT_ID, 1, 20);

      expect(mockProductsRepository.findByTenantId).toHaveBeenCalledWith(TENANT_ID, 1, 20);
      expect(result).toEqual({
        data: [PRODUCT_RESULT],
        meta: { total: 1, page: 1, limit: 20 },
      });
    });
  });

  // ─── getProductById ───────────────────────────────────────────────────────

  describe('getProductById', () => {
    it('id valide du tenant → retourne le produit avec stockLevels', async () => {
      const result = await service.getProductById(TENANT_ID, PRODUCT_ID);

      expect(mockProductsRepository.findByIdAndTenant).toHaveBeenCalledWith(PRODUCT_ID, TENANT_ID);
      expect(result).toEqual(PRODUCT_DETAIL);
    });

    it('id absent ou cross-tenant → NotFoundException', async () => {
      mockProductsRepository.findByIdAndTenant.mockResolvedValue(null);

      await expect(service.getProductById(TENANT_ID, 'unknown-id')).rejects.toThrow(NotFoundException);
      expect(mockProductsRepository.findByIdAndTenant).toHaveBeenCalledWith('unknown-id', TENANT_ID);
    });
  });

  // ─── updateProduct ────────────────────────────────────────────────────────

  describe('updateProduct', () => {
    it('données valides → updateById appelé, retourne le produit mis à jour', async () => {
      const updated = { ...PRODUCT_RESULT, name: 'Nouveau Nom' };
      mockProductsRepository.updateById.mockResolvedValue(updated);

      const result = await service.updateProduct(TENANT_ID, PRODUCT_ID, { name: 'Nouveau Nom' });

      expect(mockProductsRepository.findByIdAndTenant).toHaveBeenCalledWith(PRODUCT_ID, TENANT_ID);
      expect(mockProductsRepository.updateById).toHaveBeenCalledWith(
        PRODUCT_ID,
        TENANT_ID,
        expect.objectContaining({ name: 'Nouveau Nom' }),
      );
      expect(result).toEqual(updated);
    });

    it('basePrice = 0 → BadRequestException, repository non modifié', async () => {
      await expect(
        service.updateProduct(TENANT_ID, PRODUCT_ID, { basePrice: 0 }),
      ).rejects.toThrow(BadRequestException);

      expect(mockProductsRepository.updateById).not.toHaveBeenCalled();
    });

    it('produit absent → NotFoundException avant update', async () => {
      mockProductsRepository.findByIdAndTenant.mockResolvedValue(null);

      await expect(
        service.updateProduct(TENANT_ID, 'unknown-id', { name: 'Nouveau Nom' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockProductsRepository.updateById).not.toHaveBeenCalled();
    });

    it('avec image valide → upload R2 appelé, imageUrl transmise', async () => {
      await service.updateProduct(TENANT_ID, PRODUCT_ID, { name: 'Test' }, mockImageFile);

      expect(mockStorageService.upload).toHaveBeenCalledWith(
        TENANT_ID,
        'products',
        mockImageFile.buffer,
        mockImageFile.mimetype,
      );
      expect(mockProductsRepository.updateById).toHaveBeenCalledWith(
        PRODUCT_ID,
        TENANT_ID,
        expect.objectContaining({ imageUrl: 'https://cdn.example.com/products/produit.png' }),
      );
    });

    it('payload vide {} → BadRequestException, updateById non appelé', async () => {
      await expect(
        service.updateProduct(TENANT_ID, PRODUCT_ID, {}),
      ).rejects.toThrow(BadRequestException);

      expect(mockProductsRepository.updateById).not.toHaveBeenCalled();
    });
  });

  // ─── deleteProduct ────────────────────────────────────────────────────────

  describe('deleteProduct', () => {
    it('id valide → deleteById appelé, retourne { id }', async () => {
      const result = await service.deleteProduct(TENANT_ID, PRODUCT_ID);

      expect(mockProductsRepository.findByIdAndTenant).toHaveBeenCalledWith(PRODUCT_ID, TENANT_ID);
      expect(mockProductsRepository.deleteById).toHaveBeenCalledWith(PRODUCT_ID, TENANT_ID);
      expect(result).toEqual({ id: PRODUCT_ID });
    });

    it('produit absent → NotFoundException, deleteById non appelé', async () => {
      mockProductsRepository.findByIdAndTenant.mockResolvedValue(null);

      await expect(service.deleteProduct(TENANT_ID, 'unknown-id')).rejects.toThrow(NotFoundException);
      expect(mockProductsRepository.deleteById).not.toHaveBeenCalled();
    });
  });

  // ─── addVariant ───────────────────────────────────────────────────────────

  describe('addVariant', () => {
    it('variantKey + quantity valides → addVariantToProduct appelé, retourne VariantResult', async () => {
      const result = await service.addVariant(TENANT_ID, PRODUCT_ID, {
        variantKey: 'Taille:L',
        quantity: 5,
      });

      expect(mockProductsRepository.findByIdAndTenant).toHaveBeenCalledWith(PRODUCT_ID, TENANT_ID);
      expect(mockProductsRepository.addVariantToProduct).toHaveBeenCalledWith(
        PRODUCT_ID,
        TENANT_ID,
        { variantKey: 'Taille:L', quantity: 5 },
      );
      expect(result).toEqual(VARIANT_RESULT);
    });

    it('variantKey vide → BadRequestException, addVariantToProduct non appelé', async () => {
      await expect(
        service.addVariant(TENANT_ID, PRODUCT_ID, { variantKey: '', quantity: 0 }),
      ).rejects.toThrow(BadRequestException);

      expect(mockProductsRepository.addVariantToProduct).not.toHaveBeenCalled();
    });

    it('quantity négative → BadRequestException, addVariantToProduct non appelé', async () => {
      await expect(
        service.addVariant(TENANT_ID, PRODUCT_ID, { variantKey: 'Taille:L', quantity: -1 }),
      ).rejects.toThrow(BadRequestException);

      expect(mockProductsRepository.addVariantToProduct).not.toHaveBeenCalled();
    });

    it('produit absent → NotFoundException, addVariantToProduct non appelé', async () => {
      mockProductsRepository.findByIdAndTenant.mockResolvedValue(null);

      await expect(
        service.addVariant(TENANT_ID, 'unknown-product', { variantKey: 'Taille:L', quantity: 0 }),
      ).rejects.toThrow(NotFoundException);

      expect(mockProductsRepository.addVariantToProduct).not.toHaveBeenCalled();
    });

    it('variantKey déjà existant (P2002) → ConflictException', async () => {
      const p2002Error = Object.assign(new Error('Unique constraint'), { code: 'P2002' });
      mockProductsRepository.addVariantToProduct.mockRejectedValue(p2002Error);

      await expect(
        service.addVariant(TENANT_ID, PRODUCT_ID, { variantKey: 'Standard', quantity: 0 }),
      ).rejects.toThrow(ConflictException);
    });
  });

  // ─── deleteVariant ────────────────────────────────────────────────────────

  describe('deleteVariant', () => {
    it('variante sans commandes → deleteVariantById appelé, retourne { id }', async () => {
      const result = await service.deleteVariant(TENANT_ID, PRODUCT_ID, VARIANT_ID);

      expect(mockProductsRepository.findByIdAndTenant).toHaveBeenCalledWith(PRODUCT_ID, TENANT_ID);
      expect(mockProductsRepository.findVariantByIdAndProduct).toHaveBeenCalledWith(VARIANT_ID, PRODUCT_ID, TENANT_ID);
      expect(mockProductsRepository.countOrderItemsByVariantId).toHaveBeenCalledWith(VARIANT_ID);
      expect(mockProductsRepository.deleteVariantById).toHaveBeenCalledWith(VARIANT_ID, PRODUCT_ID, TENANT_ID);
      expect(mockProductsRepository.deactivateVariantById).not.toHaveBeenCalled();
      expect(result).toEqual({ id: VARIANT_ID });
    });

    it('variante avec commandes (count > 0) → deactivateVariantById appelé, retourne VariantResult avec isActive=false', async () => {
      mockProductsRepository.countOrderItemsByVariantId.mockResolvedValue(3);

      const result = await service.deleteVariant(TENANT_ID, PRODUCT_ID, VARIANT_ID);

      expect(mockProductsRepository.deactivateVariantById).toHaveBeenCalledWith(VARIANT_ID, PRODUCT_ID, TENANT_ID);
      expect(mockProductsRepository.deleteVariantById).not.toHaveBeenCalled();
      expect((result as { isActive: boolean }).isActive).toBe(false);
    });

    it('produit absent → NotFoundException, deleteVariantById non appelé', async () => {
      mockProductsRepository.findByIdAndTenant.mockResolvedValue(null);

      await expect(
        service.deleteVariant(TENANT_ID, 'unknown-product', VARIANT_ID),
      ).rejects.toThrow(NotFoundException);

      expect(mockProductsRepository.deleteVariantById).not.toHaveBeenCalled();
    });

    it('variante absente → NotFoundException, deleteVariantById non appelé', async () => {
      mockProductsRepository.findVariantByIdAndProduct.mockResolvedValue(null);

      await expect(
        service.deleteVariant(TENANT_ID, PRODUCT_ID, 'unknown-variant'),
      ).rejects.toThrow(NotFoundException);

      expect(mockProductsRepository.deleteVariantById).not.toHaveBeenCalled();
    });
  });

  // ─── toggleProduct ────────────────────────────────────────────────────────

  describe('toggleProduct', () => {
    it('produit actif → toggleActive appelé, retourne produit avec isActive=false', async () => {
      const result = await service.toggleProduct(TENANT_ID, PRODUCT_ID);

      expect(mockProductsRepository.findByIdAndTenant).toHaveBeenCalledWith(PRODUCT_ID, TENANT_ID);
      expect(mockProductsRepository.toggleActive).toHaveBeenCalledWith(PRODUCT_ID, TENANT_ID);
      expect(result.isActive).toBe(false);
    });

    it('produit absent → NotFoundException, toggleActive non appelé', async () => {
      mockProductsRepository.findByIdAndTenant.mockResolvedValue(null);

      await expect(service.toggleProduct(TENANT_ID, 'unknown-id')).rejects.toThrow(NotFoundException);
      expect(mockProductsRepository.toggleActive).not.toHaveBeenCalled();
    });

    it('toggleActive retourne null (race TOCTOU) → NotFoundException', async () => {
      mockProductsRepository.toggleActive.mockResolvedValue(null);

      await expect(service.toggleProduct(TENANT_ID, PRODUCT_ID)).rejects.toThrow(NotFoundException);
    });
  });
});
