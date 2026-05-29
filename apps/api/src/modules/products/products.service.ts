import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { ZodError } from 'zod';

function isPrismaP2025(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 'P2025';
}

function isPrismaP2002(err: unknown): boolean {
  return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === 'P2002';
}
import {
  createProductSchema,
  createStockLevelSchema,
  updateProductSchema,
  type CreateProductDto,
  type CreateStockLevelDto,
  type UpdateProductDto,
} from '@whatsell/shared';
import { StorageService } from '../../common/services/storage.service';
import { ProductsRepository, type ProductDetail, type VariantResult } from './products.repository';

type ProductResult = {
  id: string;
  name: string;
  basePrice: number;
  imageUrl: string | null;
  isActive: boolean;
};

type ProductsListResult = {
  data: ProductResult[];
  meta: { total: number; page: number; limit: number };
};

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
  ): Promise<ProductResult> {
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
    if (image && image.buffer.length > 0) {
      try {
        imageUrl = await this.storageService.upload(
          tenantId,
          'products',
          image.buffer,
          image.mimetype,
        );
      } catch {
        // R2 non configuré en dev — image ignorée silencieusement
        imageUrl = undefined;
      }
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
  ): Promise<ProductsListResult> {
    const { items, total } = await this.productsRepository.findByTenantId(tenantId, page, limit);
    return { data: items, meta: { total, page, limit } };
  }

  async getProductById(tenantId: string, id: string): Promise<ProductDetail> {
    const product = await this.productsRepository.findByIdAndTenant(id, tenantId);
    if (!product) throw new NotFoundException(`Produit #${id} introuvable`);
    return product;
  }

  async updateProduct(
    tenantId: string,
    id: string,
    dto: unknown,
    image?: Express.Multer.File,
  ): Promise<ProductResult> {
    let validated: UpdateProductDto;
    try {
      validated = updateProductSchema.parse(dto);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors[0]?.message ?? 'Données invalides');
      }
      throw err;
    }

    const existing = await this.productsRepository.findByIdAndTenant(id, tenantId);
    if (!existing) throw new NotFoundException(`Produit #${id} introuvable`);

    let imageUrl: string | undefined;
    if (image && image.buffer.length > 0) {
      try {
        imageUrl = await this.storageService.upload(
          tenantId,
          'products',
          image.buffer,
          image.mimetype,
        );
      } catch {
        imageUrl = undefined;
      }
    }

    try {
      return await this.productsRepository.updateById(id, tenantId, { ...validated, imageUrl });
    } catch (err) {
      if (isPrismaP2025(err)) throw new NotFoundException(`Produit #${id} introuvable`);
      throw err;
    }
  }

  async deleteProduct(tenantId: string, id: string): Promise<{ id: string }> {
    const existing = await this.productsRepository.findByIdAndTenant(id, tenantId);
    if (!existing) throw new NotFoundException(`Produit #${id} introuvable`);
    try {
      return await this.productsRepository.deleteById(id, tenantId);
    } catch (err) {
      if (isPrismaP2025(err)) throw new NotFoundException(`Produit #${id} introuvable`);
      throw err;
    }
  }

  async addVariant(tenantId: string, productId: string, dto: unknown): Promise<VariantResult> {
    let validated: CreateStockLevelDto;
    try {
      validated = createStockLevelSchema.parse(dto);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors[0]?.message ?? 'Données invalides');
      }
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

  async deleteVariant(
    tenantId: string,
    productId: string,
    variantId: string,
  ): Promise<{ id: string } | VariantResult> {
    const product = await this.productsRepository.findByIdAndTenant(productId, tenantId);
    if (!product) throw new NotFoundException(`Produit #${productId} introuvable`);

    const variant = await this.productsRepository.findVariantByIdAndProduct(variantId, productId, tenantId);
    if (!variant) throw new NotFoundException(`Variante #${variantId} introuvable`);

    const orderCount = await this.productsRepository.countOrderItemsByVariantId(variantId);

    if (orderCount > 0) {
      return this.productsRepository.deactivateVariantById(variantId, productId, tenantId);
    }

    try {
      return await this.productsRepository.deleteVariantById(variantId, productId, tenantId);
    } catch (err) {
      if (isPrismaP2025(err)) throw new NotFoundException(`Variante #${variantId} introuvable`);
      throw err;
    }
  }

  async toggleProduct(tenantId: string, id: string): Promise<ProductResult> {
    const existing = await this.productsRepository.findByIdAndTenant(id, tenantId);
    if (!existing) throw new NotFoundException(`Produit #${id} introuvable`);
    try {
      const result = await this.productsRepository.toggleActive(id, tenantId);
      if (!result) throw new NotFoundException(`Produit #${id} introuvable`);
      return result;
    } catch (err) {
      if (err instanceof NotFoundException) throw err;
      if (isPrismaP2025(err)) throw new NotFoundException(`Produit #${id} introuvable`);
      throw err;
    }
  }
}
