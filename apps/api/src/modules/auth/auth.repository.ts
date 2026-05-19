import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User, SubscriptionTier } from '../../../generated/prisma/client';

interface CreateTenantAndUserInput {
  email: string;
  passwordHash: string;
  tenantName: string;
  tenantSlug: string;
}

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  findUserWithTenant(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      include: { tenant: true },
    });
  }

  async createTenantAndUser(data: CreateTenantAndUserInput): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.tenantName,
          slug: data.tenantSlug,
        },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.email,
          passwordHash: data.passwordHash,
        },
      });

      // Abonnement essai Pro 7 jours — atomique avec la création du compte (FR46)
      // Pro = 100 commandes/mois selon PRD §MVP "Modèle freemium"
      const trialEnd = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      await tx.subscription.create({
        data: {
          tenantId: tenant.id,
          tier: SubscriptionTier.PRO,
          ordersLimit: 100,
          ordersUsed: 0,
          trialEndsAt: trialEnd,
          currentPeriodStart: new Date(),
          currentPeriodEnd: trialEnd,
        },
      });

      return user;
    });
  }

  async updateRefreshTokenHash(userId: string, hash: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }
}
