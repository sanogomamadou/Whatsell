import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { User } from '../../../generated/prisma/client';

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

  async createTenantAndUser(data: CreateTenantAndUserInput): Promise<User> {
    return this.prisma.$transaction(async (tx) => {
      const tenant = await tx.tenant.create({
        data: {
          name: data.tenantName,
          slug: data.tenantSlug,
        },
      });

      return tx.user.create({
        data: {
          tenantId: tenant.id,
          email: data.email,
          passwordHash: data.passwordHash,
        },
      });
    });
  }

  async updateRefreshTokenHash(userId: string, hash: string | null): Promise<void> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshTokenHash: hash },
    });
  }
}
