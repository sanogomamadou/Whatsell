import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

type ProductResult = {
  id: string;
  name: string;
  basePrice: number;
  imageUrl: string | null;
  isActive: boolean;
};

type ProductListResult = {
  items: ProductResult[];
  total: number;
};

type StockLevelSummary = {
  id: string;
  variantKey: string;
  quantity: number;
  alertThreshold: number;
  isActive: boolean;
};

export type ProductDetail = ProductResult & {
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  stockLevels: StockLevelSummary[];
};

export type VariantResult = {
  id: string;
  variantKey: string;
  quantity: number;
  alertThreshold: number;
  isActive: boolean;
};

@Injectable()
export class ProductsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createProductWithDefaultVariant(
    tenantId: string,
    data: { name: string; basePrice: number; description?: string; imageUrl?: string },
  ): Promise<ProductResult> {
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
  ): Promise<ProductListResult> {
    page = Math.max(1, page);
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

  async findByIdAndTenant(id: string, tenantId: string): Promise<ProductDetail | null> {
    return this.prisma.product.findFirst({
      where: { id, tenantId },
      select: {
        id: true,
        name: true,
        basePrice: true,
        description: true,
        imageUrl: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        stockLevels: {
          select: { id: true, variantKey: true, quantity: true, alertThreshold: true, isActive: true },
          orderBy: { variantKey: 'asc' },
        },
      },
    });
  }

  async updateById(
    id: string,
    tenantId: string,
    data: { name?: string; basePrice?: number; description?: string | null; imageUrl?: string },
  ): Promise<ProductResult> {
    return this.prisma.product.update({
      where: { id, tenantId },
      data,
      select: { id: true, name: true, basePrice: true, imageUrl: true, isActive: true },
    });
  }

  async deleteById(id: string, tenantId: string): Promise<{ id: string }> {
    await this.prisma.product.delete({ where: { id, tenantId } });
    return { id };
  }

  async addVariantToProduct(
    productId: string,
    tenantId: string,
    data: { variantKey: string; quantity: number },
  ): Promise<VariantResult> {
    return this.prisma.stockLevel.create({
      data: {
        tenantId,
        productId,
        variantKey: data.variantKey,
        quantity: data.quantity,
      },
      select: { id: true, variantKey: true, quantity: true, alertThreshold: true, isActive: true },
    });
  }

  async findVariantByIdAndProduct(
    variantId: string,
    productId: string,
    tenantId: string,
  ): Promise<VariantResult | null> {
    return this.prisma.stockLevel.findFirst({
      where: { id: variantId, productId, tenantId },
      select: { id: true, variantKey: true, quantity: true, alertThreshold: true, isActive: true },
    });
  }

  async deleteVariantById(
    variantId: string,
    productId: string,
    tenantId: string,
  ): Promise<{ id: string }> {
    await this.prisma.stockLevel.delete({ where: { id: variantId, productId, tenantId } });
    return { id: variantId };
  }

  async deactivateVariantById(
    variantId: string,
    productId: string,
    tenantId: string,
  ): Promise<VariantResult> {
    return this.prisma.stockLevel.update({
      where: { id: variantId, productId, tenantId },
      data: { isActive: false },
      select: { id: true, variantKey: true, quantity: true, alertThreshold: true, isActive: true },
    });
  }

  async countOrderItemsByVariantId(_variantId: string): Promise<number> {
    // TODO Story 4.1: replace with real orderItem count when table exists
    return 0;
  }

  async toggleActive(id: string, tenantId: string): Promise<ProductResult | null> {
    const product = await this.prisma.product.findFirst({
      where: { id, tenantId },
      select: { isActive: true },
    });
    if (!product) return null;

    return this.prisma.product.update({
      where: { id, tenantId },
      data: { isActive: !product.isActive },
      select: { id: true, name: true, basePrice: true, imageUrl: true, isActive: true },
    });
  }
}
