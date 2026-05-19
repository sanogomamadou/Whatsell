import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OnboardingRepository {
  constructor(private readonly prisma: PrismaService) {}

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
