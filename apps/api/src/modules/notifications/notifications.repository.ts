import * as crypto from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { PushToken } from '../../../generated/prisma/client';

export interface PushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface StoredPushToken {
  id: string;
  tenantId: string;
  userId: string;
  endpoint: string;
  keys: PushSubscriptionKeys;
}

@Injectable()
export class NotificationsRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly encryption: EncryptionService,
  ) {}

  private hashEndpoint(endpoint: string): string {
    return crypto.createHash('sha256').update(endpoint).digest('hex');
  }

  async storeToken(
    tenantId: string,
    userId: string,
    endpoint: string,
    keys: PushSubscriptionKeys,
    userAgent?: string,
  ): Promise<PushToken> {
    const endpointHash = this.hashEndpoint(endpoint);
    return this.prisma.pushToken.upsert({
      where: { tenantId_endpointHash: { tenantId, endpointHash } },
      create: {
        tenantId,
        userId,
        endpointHash,
        endpointEncrypted: this.encryption.encrypt(endpoint),
        p256dhEncrypted: this.encryption.encrypt(keys.p256dh),
        authEncrypted: this.encryption.encrypt(keys.auth),
        userAgent,
      },
      update: {
        userId,
        endpointEncrypted: this.encryption.encrypt(endpoint),
        p256dhEncrypted: this.encryption.encrypt(keys.p256dh),
        authEncrypted: this.encryption.encrypt(keys.auth),
        userAgent,
      },
    });
  }

  async deleteToken(tenantId: string, endpoint: string): Promise<void> {
    const endpointHash = this.hashEndpoint(endpoint);
    await this.prisma.pushToken.deleteMany({
      where: { tenantId, endpointHash },
    });
  }

  async getTokensByTenant(tenantId: string): Promise<StoredPushToken[]> {
    const tokens = await this.prisma.pushToken.findMany({
      where: { tenantId },
    });
    return tokens.map((t) => ({
      id: t.id,
      tenantId: t.tenantId,
      userId: t.userId,
      endpoint: this.encryption.decrypt(t.endpointEncrypted),
      keys: {
        p256dh: this.encryption.decrypt(t.p256dhEncrypted),
        auth: this.encryption.decrypt(t.authEncrypted),
      },
    }));
  }

  async deleteByEndpointHash(tenantId: string, endpointHash: string): Promise<void> {
    await this.prisma.pushToken.deleteMany({
      where: { tenantId, endpointHash },
    });
  }
}
