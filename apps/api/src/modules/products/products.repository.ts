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
    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where: { tenantId, isActive: true },
        select: { id: true, name: true, basePrice: true, imageUrl: true, isActive: true },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.product.count({ where: { tenantId, isActive: true } }),
    ]);
    return { items, total };
  }
}
