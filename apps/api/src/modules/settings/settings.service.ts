import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ZodError } from 'zod';
import {
  updateProfileSchema,
  connectWhatsappSchema,
  type ConnectWhatsappDto,
} from '@whatsell/shared';
import { StorageService } from '../../common/services/storage.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { AuditService } from '../audit/audit.service';
import { SettingsRepository, type ProfileSettings } from './settings.repository';

@Injectable()
export class SettingsService {
  constructor(
    private readonly settingsRepository: SettingsRepository,
    private readonly storageService: StorageService,
    private readonly encryptionService: EncryptionService,
    private readonly auditService: AuditService,
  ) {}

  async getProfileSettings(tenantId: string): Promise<ProfileSettings> {
    return this.settingsRepository.getProfileSettings(tenantId);
  }

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

    return this.settingsRepository.updateProfile(tenantId, { name: validatedName, logoUrl });
  }

  async reconnectWhatsapp(
    tenantId: string,
    userId: string,
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

    const result = await this.settingsRepository.updateWhatsappConnection(tenantId, {
      whatsappBusinessAccountId: validated.whatsappBusinessAccountId,
      encryptedToken,
    });

    // NFR9 — reconnexion WhatsApp = action sensible. AuditService.log() absorbs exceptions
    // internally; the try/catch here protects against mock behavior in tests.
    try {
      await this.auditService.log({
        tenantId,
        userId,
        action: 'whatsapp.reconnected',
        resource: 'tenant',
        resourceId: tenantId,
        metadata: { whatsappBusinessAccountId: validated.whatsappBusinessAccountId },
      });
    } catch {
      // intentionally swallowed — audit failure must not block the main operation
    }

    return result;
  }
}
