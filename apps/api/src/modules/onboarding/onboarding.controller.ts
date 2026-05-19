import {
  Body,
  Controller,
  Patch,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CurrentTenant } from '../../common/decorators';
import { OnboardingService } from './onboarding.service';

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

@Controller('onboarding')
export class OnboardingController {
  constructor(private readonly onboardingService: OnboardingService) {}

  @Patch('profile')
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: imageFilter,
    }),
  )
  async updateProfile(
    @CurrentTenant() tenantId: string,
    @Body('name') name: string,
    @UploadedFile() logoFile?: Express.Multer.File,
  ): Promise<{ name: string; logoUrl: string | null }> {
    return this.onboardingService.updateProfile(tenantId, name, logoFile);
  }
}
