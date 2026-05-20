import { BadRequestException, ForbiddenException, Injectable, Logger } from '@nestjs/common';
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

export type StorageType = 'receipts' | 'logos' | 'invoices' | 'products';

const STORAGE_TYPES: readonly StorageType[] = ['receipts', 'logos', 'invoices', 'products'];

// Limite AWS S3 Presigned URL : 7 jours
const MAX_EXPIRES_IN = 604800;

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly buckets: Record<StorageType, string>;

  constructor(
    private readonly configService: ConfigService,
    private readonly tenantContextService: TenantContextService,
  ) {
    const accountId = this.configService.get<string>('r2.accountId') ?? '';
    const accessKeyId = this.configService.get<string>('r2.accessKeyId') ?? '';
    const secretAccessKey = this.configService.get<string>('r2.secretAccessKey') ?? '';

    if (!accountId || !accessKeyId || !secretAccessKey) {
      this.logger.warn('R2 non configuré — StorageService désactivé jusqu\'à la configuration de R2_ACCOUNT_ID, R2_ACCESS_KEY_ID et R2_SECRET_ACCESS_KEY');
      this.client = null;
    } else {
      this.client = new S3Client({
        region: 'auto',
        endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
        credentials: { accessKeyId, secretAccessKey },
      });
    }

    this.buckets = {
      receipts: this.configService.get<string>('r2.bucketReceipts') ?? 'whatsell-receipts',
      logos: this.configService.get<string>('r2.bucketLogos') ?? 'whatsell-logos',
      invoices: this.configService.get<string>('r2.bucketInvoices') ?? 'whatsell-invoices',
      products: this.configService.get<string>('r2.bucketProducts') ?? 'whatsell-products',
    };
  }

  private assertClientReady(): void {
    if (!this.client) {
      throw new Error('StorageService : R2 non configuré. Définissez R2_ACCOUNT_ID, R2_ACCESS_KEY_ID et R2_SECRET_ACCESS_KEY.');
    }
  }

  async upload(
    tenantId: string,
    type: StorageType,
    file: Buffer,
    mimeType: string,
  ): Promise<string> {
    this.assertClientReady();
    if (!tenantId) {
      throw new BadRequestException('tenantId requis pour le stockage R2');
    }

    const uuid = randomUUID();
    const key = `${tenantId}/${type}/${uuid}`;

    await this.client!.send(
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
    this.assertClientReady();
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

    return getSignedUrl(this.client!, command, { expiresIn });
  }

  async delete(key: string): Promise<void> {
    this.assertClientReady();
    const type = this.parseType(key);
    this.assertTenantAccess(key);

    await this.client!.send(
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
