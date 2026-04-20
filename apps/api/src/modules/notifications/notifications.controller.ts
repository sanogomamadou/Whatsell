import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import {
  RegisterPushSchema,
  RegisterPushDto,
  UnregisterPushSchema,
  UnregisterPushDto,
} from '@whatsell/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { CurrentTenant, CurrentUser } from '../../common/decorators';
import { AuthUser } from '../auth/strategies/jwt.strategy';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('register-push')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Enregistre un token Web Push pour le vendeur connecté' })
  async registerPush(
    @CurrentTenant() tenantId: string,
    @CurrentUser() user: AuthUser,
    @Body(new ZodValidationPipe(RegisterPushSchema)) dto: RegisterPushDto,
  ): Promise<void> {
    await this.notificationsService.registerPush(tenantId, user.id, dto);
  }

  @Post('unregister-push')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Supprime un token Web Push' })
  async unregisterPush(
    @CurrentTenant() tenantId: string,
    @Body(new ZodValidationPipe(UnregisterPushSchema)) dto: UnregisterPushDto,
  ): Promise<void> {
    await this.notificationsService.unregisterPush(tenantId, dto);
  }
}
