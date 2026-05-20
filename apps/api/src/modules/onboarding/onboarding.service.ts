import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ZodError } from 'zod';
import { updateProfileSchema, connectWhatsappSchema, type ConnectWhatsappDto } from '@whatsell/shared';
import { StorageService } from '../../common/services/storage.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { OnboardingRepository } from './onboarding.repository';

@Injectable()
export class OnboardingService {
  constructor(
    private readonly onboardingRepository: OnboardingRepository,
    private readonly storageService: StorageService,
    private readonly encryptionService: EncryptionService,
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

  async connectWhatsapp(
    tenantId: string,
    dto: ConnectWhatsappDto,
  ): Promise<{ whatsappBusinessAccountId: string }> {
    let validated: ConnectWhatsappDto;
    try {
      validated = connectWhatsappSchema.parse(dto);
    } catch (err) {
      if (err instanceof ZodError) {
        throw new BadRequestException(err.errors[0]?.message ?? 'Données invalides');
      }
      throw err;
    }

    let encryptedToken: string;
    try {
      encryptedToken = this.encryptionService.encrypt(validated.whatsappToken);
    } catch {
      throw new InternalServerErrorException('Erreur lors du chiffrement du token');
    }
    return this.onboardingRepository.connectWhatsapp(tenantId, {
      whatsappBusinessAccountId: validated.whatsappBusinessAccountId,
      encryptedToken,
    });
  }
}
