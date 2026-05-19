import { BadRequestException, Injectable } from '@nestjs/common';
import { ZodError } from 'zod';
import { updateProfileSchema } from '@whatsell/shared';
import { StorageService } from '../../common/services/storage.service';
import { OnboardingRepository } from './onboarding.repository';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly onboardingRepository: OnboardingRepository,
    private readonly storageService: StorageService,
  ) {}

  async updateProfile(
    tenantId: string,
    name: string,
    logoFile?: Express.Multer.File,
  ): Promise<{ name: string; logoUrl: string | null }> {
    let validatedName: string;
    try {
      ({ name: validatedName } = updateProfileSchema.parse({ name }));
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors[0]?.message ?? 'Données invalides');
      }
      throw err;
    }

    let logoUrl: string | undefined;
    if (logoFile) {
      logoUrl = await this.storageService.upload(
        tenantId,
        'logos',
        logoFile.buffer,
        logoFile.mimetype,
      );
    }

    return this.onboardingRepository.updateProfile(tenantId, { name: validatedName, logoUrl });
  }
}
