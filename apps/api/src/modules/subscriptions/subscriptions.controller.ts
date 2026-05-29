import { Controller, Get } from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators';
import { SubscriptionsService } from './subscriptions.service';

@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('status')
  async getStatus(@CurrentTenant() tenantId: string) {
    return this.subscriptionsService.getStatus(tenantId);
  }
}
