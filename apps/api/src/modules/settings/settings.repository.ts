import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../../generated/prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

export interface ProfileSettings {
  name: string;
  logoUrl: string | null;
  whatsappBusinessAccountId: string | null;
}

@Injectable()
export class SettingsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async getProfileSettings(tenantId: string): Promise<ProfileSettings> {
    try {
      return await this.prisma.tenant.findUniqueOrThrow({
        where: { id: tenantId },
        select: { name: true, logoUrl: true, whatsappBusinessAccountId: true },
      });
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
    try {
      return await this.prisma.tenant.update({
        where: { id: tenantId },
        data: {
          name: data.name,
          ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        },
        select: { name: true, logoUrl: true },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException('Compte introuvable');
      }
      throw err;
    }
  }

  async updateWhatsappConnection(
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
      if (tenant.whatsappBusinessAccountId === null) {
        throw new InternalServerErrorException('whatsappBusinessAccountId inattendu null après update');
      }
      return { whatsappBusinessAccountId: tenant.whatsappBusinessAccountId };
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
        throw new NotFoundException('Compte introuvable');
      }
      throw err;
    }
  }
}
