import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface OnboardingSummary {
  shopName: string;
  whatsappNumber: string | null;
  productCount: number;
  advancePercentage: number;
  acceptedPaymentModes: string[];
}

@Injectable()
export class OnboardingRepository {
  constructor(private readonly prisma: PrismaService) {}

  async connectWhatsapp(
    tenantId: string,
    data: { whatsappBusinessAccountId: string; encryptedToken: string },
  ): Promise<{ whatsappBusinessAccountId: string }> {
    try {
      const tenant = await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          whatsappBusinessAccountId: data.whatsappBusinessAccountId,
          whatsappToken: data.encryptedToken,
        },
        select: { whatsappBusinessAccountId: true },
      });
      return { whatsappBusinessAccountId: tenant.whatsappBusinessAccountId! };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException('Compte introuvable');
      }
      throw err;
    }
  }

  async updateProfile(
    tenantId: string,
    data: { name: string; logoUrl?: string },
  ): Promise<{ name: string; logoUrl: string | null }> {
    const tenant = await this.prisma.tenant.update({
      where: { id: tenantId },
      data: {
        name: data.name,
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
      },
      select: { name: true, logoUrl: true },
    });
    return tenant;
  }

  async updatePaymentRules(
    tenantId: string,
    data: { advancePercentage: number; acceptedPaymentModes: string[] },
  ): Promise<{ advancePercentage: number; acceptedPaymentModes: string[] }> {
    try {
      return await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          advancePercentage: data.advancePercentage,
          acceptedPaymentModes: data.acceptedPaymentModes,
        },
        select: {
          advancePercentage: true,
          acceptedPaymentModes: true,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException('Compte introuvable');
      }
      throw err;
    }
  }

  async getOnboardingSummary(tenantId: string): Promise<OnboardingSummary> {
    try {
      const tenant = await this.prisma.tenant.findUniqueOrThrow({
        where: { id: tenantId },
        select: {
          name: true,
          whatsappBusinessAccountId: true,
          advancePercentage: true,
          acceptedPaymentModes: true,
          _count: { select: { products: { where: { isActive: true } } } },
        },
      });
      return {
        shopName: tenant.name,
        whatsappNumber: tenant.whatsappBusinessAccountId,
        productCount: tenant._count.products,
        advancePercentage: tenant.advancePercentage,
        acceptedPaymentModes: tenant.acceptedPaymentModes,
      };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException('Compte introuvable');
      }
      throw err;
    }
  }

  async activateAgent(tenantId: string): Promise<{ activatedAt: Date }> {
    try {
      const tenant = await this.prisma.tenant.update({
        where: { id: tenantId },
        data: { onboardingCompletedAt: new Date() },
        select: { onboardingCompletedAt: true },
      });
      if (!tenant.onboardingCompletedAt) {
        throw new Error('onboardingCompletedAt unexpectedly null after update');
      }
      return { activatedAt: tenant.onboardingCompletedAt };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException('Compte introuvable');
      }
      throw err;
    }
  }
}
