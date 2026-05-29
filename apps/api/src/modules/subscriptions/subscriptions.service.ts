import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SubscriptionTier } from '../../../generated/prisma/client';
import { MailService } from '../../common/services/mail.service';
import {
  SubscriptionsRepository,
  type SubscriptionStatus,
} from './subscriptions.repository';

export interface SubscriptionStatusResult extends SubscriptionStatus {
  isTrialExpired: boolean;
}

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly subscriptionsRepository: SubscriptionsRepository,
    private readonly mailService: MailService,
    private readonly configService: ConfigService,
  ) {}

  async getStatus(tenantId: string): Promise<SubscriptionStatusResult> {
    const sub = await this.subscriptionsRepository.getSubscriptionByTenant(tenantId);
    if (!sub) {
      return {
        tier: SubscriptionTier.FREE,
        trialEndsAt: null,
        ordersUsed: 0,
        ordersLimit: 20,
        isTrialExpired: false,
      };
    }
    // Vrai dès que trialEndsAt est passé, quel que soit le tier courant.
    // Couvre le délai entre l'expiry réelle et le prochain passage du cron de downgrade.
    const isTrialExpired = sub.trialEndsAt !== null && sub.trialEndsAt < new Date();
    return { ...sub, isTrialExpired };
  }

  async processTrialWarnings(): Promise<void> {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 1.5 * 24 * 60 * 60 * 1000);
    const windowEnd = new Date(now.getTime() + 2.5 * 24 * 60 * 60 * 1000);

    const subscriptions = await this.subscriptionsRepository.findSubscriptionsExpiringSoon(
      windowStart,
      windowEnd,
    );
    this.logger.log({ event: 'trial-warnings-found', count: subscriptions.length });

    const frontendUrl = this.configService.get<string>('frontendUrl', 'http://localhost:3000');
    const upgradeUrl = `${frontendUrl}/settings`;

    for (const sub of subscriptions) {
      const ownerEmail = sub.tenant.users[0]?.email;
      if (!ownerEmail) {
        this.logger.warn({ event: 'trial-owner-email-missing', tenantId: sub.tenantId });
        continue;
      }
      try {
        await this.mailService.sendTrialExpiringWarning({
          email: ownerEmail,
          shopName: sub.tenant.name,
          trialEndsAt: sub.trialEndsAt,
          upgradeUrl,
        });
        await this.subscriptionsRepository.markWarningSent(sub.tenantId);
      } catch (err) {
        this.logger.error({ event: 'trial-warning-loop-error', tenantId: sub.tenantId, err });
      }
    }
  }

  async processTrialExpirations(): Promise<void> {
    const count = await this.subscriptionsRepository.downgradeExpiredTrials();
    if (count > 0) {
      this.logger.log({ event: 'trials-downgraded', count });
    }
  }
}
