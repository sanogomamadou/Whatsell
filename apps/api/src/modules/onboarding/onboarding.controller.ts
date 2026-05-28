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
import { type ConnectWhatsappDto, type PaymentRulesDto } from '@whatsell/shared';
import { type OnboardingSummary } from './onboarding.repository';
import { Role } from '../../../generated/prisma/client';
import { CurrentTenant, CurrentUser, Roles } from '../../common/decorators';
import { type AuthUser } from '../auth/strategies/jwt.strategy';
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

  @Get('summary')
  async getOnboardingSummary(
    @CurrentTenant() tenantId: string,
  ): Promise<OnboardingSummary> {
    return this.onboardingService.getOnboardingSummary(tenantId);
  }

  @Post('activate')
  @Roles(Role.OWNER)
  async activateAgent(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
  ): Promise<{ activatedAt: string }> {
    return this.onboardingService.activateAgent(tenantId, user.id);
  }

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

  @Post('whatsapp-connect')
  async connectWhatsapp(
    @CurrentTenant() tenantId: string,
    @Body() body: ConnectWhatsappDto,
  ): Promise<{ whatsappBusinessAccountId: string }> {
    return this.onboardingService.connectWhatsapp(tenantId, body);
  }

  @Patch('payment-rules')
  @Roles(Role.OWNER)
  async updatePaymentRules(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Body() body: PaymentRulesDto,
  ): Promise<{ advancePercentage: number; acceptedPaymentModes: string[] }> {
    return this.onboardingService.updatePaymentRules(tenantId, user.id, body);
  }
}
