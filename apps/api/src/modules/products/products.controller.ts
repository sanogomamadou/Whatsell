import {
  Body,
  Controller,
  Get,
  Post,
  Query,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type CreateProductDto } from '@whatsell/shared';
import { CurrentTenant, Roles } from '../../common/decorators';
import { Role } from '../../../generated/prisma/client';
import { ProductsService } from './products.service';

const ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'];

const imageFilter = (
  _req: unknown,
  file: Express.Multer.File,
  cb: (error: Error | null, accept: boolean) => void,
): void => {
  if (!ALLOWED_MIME.includes(file.mimetype)) {
    cb(
      new UnsupportedMediaTypeException(
        'Format non supporté. Utilisez JPEG, PNG ou WebP.',
      ),
      false,
    );
    return;
  }
  cb(null, true);
};

@Controller('products')
@Roles(Role.OWNER, Role.CO_MANAGER)
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor('image', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 Mo
      fileFilter: imageFilter,
    }),
  )
  async createProduct(
    @CurrentTenant() tenantId: string,
    @Body() body: CreateProductDto,
    @UploadedFile() image?: Express.Multer.File,
  ) {
    return this.productsService.createProduct(tenantId, body, image);
  }

  @Get()
  async getProducts(
    @CurrentTenant() tenantId: string,
    @Query('page') pageStr = '1',
    @Query('limit') limitStr = '20',
  ) {
    const page = Math.max(1, parseInt(pageStr, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(limitStr, 10) || 20));
    return this.productsService.getProducts(tenantId, page, limit);
  }
}
