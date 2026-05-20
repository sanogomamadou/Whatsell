import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

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
}
