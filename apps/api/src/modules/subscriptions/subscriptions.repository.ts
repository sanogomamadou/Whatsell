import { Injectable } from '@nestjs/common';
import { Role, SubscriptionTier } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface SubscriptionStatus {
  tier: SubscriptionTier;
  trialEndsAt: Date | null;
  ordersUsed: number;
  ordersLimit: number;
}

export interface SubscriptionWithOwnerEmail {
  tenantId: string;
  trialEndsAt: Date;
  tenant: {
    name: string;
    users: Array<{ email: string }>;
  };
}

@Injectable()
export class SubscriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getSubscriptionByTenant(tenantId: string): Promise<SubscriptionStatus | null> {
    return this.prisma.subscription.findUnique({
      where: { tenantId },
      select: { tier: true, trialEndsAt: true, ordersUsed: true, ordersLimit: true },
    });
  }

  async findSubscriptionsExpiringSoon(
    windowStart: Date,
    windowEnd: Date,
  ): Promise<SubscriptionWithOwnerEmail[]> {
    const results = await this.prisma.subscription.findMany({
      where: {
        tier: SubscriptionTier.PRO,
        trialEndsAt: { gte: windowStart, lte: windowEnd },
        warningSentAt: null,
      },
      select: {
        tenantId: true,
        trialEndsAt: true,
        tenant: {
          select: {
            name: true,
            users: {
              take: 1,
              where: { role: Role.OWNER, isActive: true },
              orderBy: { createdAt: 'asc' },
              select: { email: true },
            },
          },
        },
      },
    });
    return results as SubscriptionWithOwnerEmail[];
  }

  async markWarningSent(tenantId: string): Promise<void> {
    await this.prisma.subscription.update({
      where: { tenantId },
      data: { warningSentAt: new Date() },
    });
  }

  async downgradeExpiredTrials(): Promise<number> {
    const result = await this.prisma.subscription.updateMany({
      where: {
        tier: SubscriptionTier.PRO,
        trialEndsAt: { lt: new Date() },
      },
      data: {
        tier: SubscriptionTier.FREE,
        ordersLimit: 20,
        ordersUsed: 0,
        warningSentAt: null,
      },
    });
    return result.count;
  }
}
