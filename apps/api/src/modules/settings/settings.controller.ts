import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  UnsupportedMediaTypeException,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { type ConnectWhatsappDto } from '@whatsell/shared';
import { Role } from '../../../generated/prisma/client';
import { CurrentTenant, CurrentUser, Roles } from '../../common/decorators';
import { type AuthUser } from '../auth/strategies/jwt.strategy';
import { SettingsService } from './settings.service';
import { type ProfileSettings } from './settings.repository';

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

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('profile')
  async getProfileSettings(
    @CurrentTenant() tenantId: string,
  ): Promise<ProfileSettings> {
    return this.settingsService.getProfileSettings(tenantId);
  }

  @Patch('profile')
  @Roles(Role.OWNER)
  @UseInterceptors(
    FileInterceptor('logo', {
      limits: { fileSize: 5 * 1024 * 1024 },
      fileFilter: imageFilter,
    }),
  )
  async updateProfile(
    @CurrentTenant() tenantId: string,
    @Body('name') name: string,
    @UploadedFile() logoFile?: Express.Multer.File,
  ): Promise<{ name: string; logoUrl: string | null }> {
    return this.settingsService.updateProfile(tenantId, name, logoFile);
  }

  @Post('whatsapp-connect')
  @Roles(Role.OWNER)
  async reconnectWhatsapp(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: ConnectWhatsappDto,
  ): Promise<{ whatsappBusinessAccountId: string }> {
    return this.settingsService.reconnectWhatsapp(tenantId, user.id, body);
  }
}
