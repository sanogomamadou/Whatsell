import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ProductsService } from './products.service';
import { ProductsRepository } from './products.repository';
import { StorageService } from '../../common/services/storage.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockProductsRepository = {
  createProductWithDefaultVariant: jest.fn(),
  findByTenantId: jest.fn(),
};

const mockStorageService = {
  upload: jest.fn(),
};

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-uuid-1';

const PRODUCT_RESULT = {
  id: 'product-uuid-1',
  name: 'Boubou Bazin Bleu',
  basePrice: 15000,
  imageUrl: null,
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
});
