import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { TenantContextService } from './tenant-context.service';

export type StorageType = 'receipts' | 'logos' | 'invoices';

const STORAGE_TYPES: readonly StorageType[] = ['receipts', 'logos', 'invoices'];

// Limite AWS S3 Presigned URL : 7 jours
const MAX_EXPIRES_IN = 604800;

@Injectable()
export class StorageService {
  private readonly client: S3Client;
  private readonly buckets: Record<StorageType, string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly tenantContextService: TenantContextService,
  ) {
    const accountId = this.configService.get<string>('r2.accountId') ?? '';
    const accessKeyId = this.configService.get<string>('r2.accessKeyId') ?? '';
    const secretAccessKey = this.configService.get<string>('r2.secretAccessKey') ?? '';

    if (!accountId || !accessKeyId || !secretAccessKey) {
      throw new Error(
        'StorageService : configuration R2 incomplète. ' +
          'Définissez R2_ACCOUNT_ID, R2_ACCESS_KEY_ID et R2_SECRET_ACCESS_KEY.',
      );
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });

    this.buckets = {
      receipts: this.configService.get<string>('r2.bucketReceipts') ?? 'whatsell-receipts',
      logos: this.configService.get<string>('r2.bucketLogos') ?? 'whatsell-logos',
      invoices: this.configService.get<string>('r2.bucketInvoices') ?? 'whatsell-invoices',
    };
  }

  async upload(
    tenantId: string,
    type: StorageType,
    file: Buffer,
    mimeType: string,
  ): Promise<string> {
    if (!tenantId) {
      throw new BadRequestException('tenantId requis pour le stockage R2');
    }

    const uuid = randomUUID();
    const key = `${tenantId}/${type}/${uuid}`;

    await this.client.send(
      new PutObjectCommand({
        Bucket: this.buckets[type],
        Key: key,
        Body: file,
        ContentType: mimeType,
      }),
    );

    return key;
  }

  async getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
    if (expiresIn <= 0 || expiresIn > MAX_EXPIRES_IN) {
      throw new BadRequestException(
        `expiresIn doit être entre 1 et ${MAX_EXPIRES_IN} secondes`,
      );
    }

    const type = this.parseType(key);
    this.assertTenantAccess(key);

    const command = new GetObjectCommand({
      Bucket: this.buckets[type],
      Key: key,
    });

    return getSignedUrl(this.client, command, { expiresIn });
  }

  async delete(key: string): Promise<void> {
    const type = this.parseType(key);
    this.assertTenantAccess(key);

    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.buckets[type],
        Key: key,
      }),
    );
  }

  private parseType(key: string): StorageType {
    const rawType = key.split('/')[1];

    if (!rawType || !STORAGE_TYPES.includes(rawType as StorageType)) {
      throw new BadRequestException('Type de stockage invalide');
    }

    return rawType as StorageType;
  }

  private assertTenantAccess(key: string): void {
    const currentTenantId = this.tenantContextService.getTenantId();
    if (!currentTenantId) return;

    const keyTenantId = key.split('/')[0];
    if (keyTenantId !== currentTenantId) {
      throw new ForbiddenException('Accès refusé : clé R2 appartient à un autre tenant');
    }
  }
}
