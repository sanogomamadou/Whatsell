import { BadRequestException, Injectable } from '@nestjs/common';
import { ZodError } from 'zod';
import { createProductSchema, type CreateProductDto } from '@whatsell/shared';
import { StorageService } from '../../common/services/storage.service';
import { ProductsRepository } from './products.repository';

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
}
