import { BadRequestException, ForbiddenException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';

const mockSend = jest.fn();

jest.mock('@aws-sdk/client-s3', () => ({
  S3Client: jest.fn().mockImplementation(() => ({ send: mockSend })),
  PutObjectCommand: jest.fn().mockImplementation((input: unknown) => ({
    ...(input as object),
    _type: 'PutObject',
  })),
  GetObjectCommand: jest.fn().mockImplementation((input: unknown) => ({
    ...(input as object),
    _type: 'GetObject',
  })),
  DeleteObjectCommand: jest.fn().mockImplementation((input: unknown) => ({
    ...(input as object),
    _type: 'DeleteObject',
  })),
}));

const mockGetSignedUrl = jest.fn();

jest.mock('@aws-sdk/s3-request-presigner', () => ({
  getSignedUrl: (...args: unknown[]) => mockGetSignedUrl(...args),
}));

import { StorageService } from './storage.service';
import { TenantContextService } from './tenant-context.service';
import { PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

const mockGetTenantId = jest.fn();

const mockTenantContextService = {
  getTenantId: mockGetTenantId,
};

const mockConfigService = {
  get: jest.fn((key: string) => {
    const config: Record<string, string> = {
      'r2.accountId': 'test-account-id',
      'r2.accessKeyId': 'test-access-key',
      'r2.secretAccessKey': 'test-secret-key',
      'r2.bucketReceipts': 'whatsell-receipts',
      'r2.bucketLogos': 'whatsell-logos',
      'r2.bucketInvoices': 'whatsell-invoices',
    };
    return config[key];
  }),
};

describe('StorageService', () => {
  let service: StorageService;

  beforeEach(async () => {
    mockGetTenantId.mockReturnValue(undefined);

    const module = await Test.createTestingModule({
      providers: [
        StorageService,
        { provide: ConfigService, useValue: mockConfigService },
        { provide: TenantContextService, useValue: mockTenantContextService },
      ],
    }).compile();

    service = module.get(StorageService);
    jest.clearAllMocks();
    mockGetTenantId.mockReturnValue(undefined);
  });

  describe('constructor', () => {
    it('should throw when accountId is missing', async () => {
      const badConfig = {
        get: jest.fn((key: string) => {
          if (key === 'r2.accountId') return '';
          if (key === 'r2.accessKeyId') return 'key';
          if (key === 'r2.secretAccessKey') return 'secret';
          return undefined;
        }),
      };

      await expect(
        Test.createTestingModule({
          providers: [
            StorageService,
            { provide: ConfigService, useValue: badConfig },
            { provide: TenantContextService, useValue: mockTenantContextService },
          ],
        }).compile(),
      ).rejects.toThrow('configuration R2 incomplète');
    });

    it('should throw when accessKeyId is missing', async () => {
      const badConfig = {
        get: jest.fn((key: string) => {
          if (key === 'r2.accountId') return 'account';
          if (key === 'r2.accessKeyId') return '';
          if (key === 'r2.secretAccessKey') return 'secret';
          return undefined;
        }),
      };

      await expect(
        Test.createTestingModule({
          providers: [
            StorageService,
            { provide: ConfigService, useValue: badConfig },
            { provide: TenantContextService, useValue: mockTenantContextService },
          ],
        }).compile(),
      ).rejects.toThrow('configuration R2 incomplète');
    });

    it('should throw when secretAccessKey is missing', async () => {
      const badConfig = {
        get: jest.fn((key: string) => {
          if (key === 'r2.accountId') return 'account';
          if (key === 'r2.accessKeyId') return 'key';
          if (key === 'r2.secretAccessKey') return '';
          return undefined;
        }),
      };

      await expect(
        Test.createTestingModule({
          providers: [
            StorageService,
            { provide: ConfigService, useValue: badConfig },
            { provide: TenantContextService, useValue: mockTenantContextService },
          ],
        }).compile(),
      ).rejects.toThrow('configuration R2 incomplète');
    });
  });

  describe('upload()', () => {
    it('should return a key with format {tenantId}/{type}/{uuid}', async () => {
      mockSend.mockResolvedValueOnce({});

      const key = await service.upload('tenant-abc', 'receipts', Buffer.from('data'), 'image/jpeg');

      const parts = key.split('/');
      expect(parts).toHaveLength(3);
      expect(parts[0]).toBe('tenant-abc');
      expect(parts[1]).toBe('receipts');
      expect(parts[2]).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('should use whatsell-receipts bucket for type receipts', async () => {
      mockSend.mockResolvedValueOnce({});

      await service.upload('tenant-abc', 'receipts', Buffer.from('data'), 'image/jpeg');

      const [[cmd]] = (mockSend as jest.Mock).mock.calls;
      expect((cmd as InstanceType<typeof PutObjectCommand> & { Bucket: string }).Bucket).toBe(
        'whatsell-receipts',
      );
    });

    it('should use whatsell-logos bucket for type logos', async () => {
      mockSend.mockResolvedValueOnce({});

      await service.upload('tenant-abc', 'logos', Buffer.from('logo'), 'image/png');

      const [[cmd]] = (mockSend as jest.Mock).mock.calls;
      expect((cmd as InstanceType<typeof PutObjectCommand> & { Bucket: string }).Bucket).toBe(
        'whatsell-logos',
      );
    });

    it('should use whatsell-invoices bucket for type invoices', async () => {
      mockSend.mockResolvedValueOnce({});

      await service.upload('tenant-abc', 'invoices', Buffer.from('pdf'), 'application/pdf');

      const [[cmd]] = (mockSend as jest.Mock).mock.calls;
      expect((cmd as InstanceType<typeof PutObjectCommand> & { Bucket: string }).Bucket).toBe(
        'whatsell-invoices',
      );
    });

    it('should pass ContentType and Key to PutObjectCommand', async () => {
      mockSend.mockResolvedValueOnce({});

      const key = await service.upload('tenant-xyz', 'logos', Buffer.from('img'), 'image/webp');

      const [[cmd]] = (mockSend as jest.Mock).mock.calls;
      const typedCmd = cmd as InstanceType<typeof PutObjectCommand> & {
        Key: string;
        ContentType: string;
      };
      expect(typedCmd.Key).toBe(key);
      expect(typedCmd.ContentType).toBe('image/webp');
    });

    it('should include tenantId as first segment of the key', async () => {
      mockSend.mockResolvedValueOnce({});

      const key = await service.upload('my-tenant', 'invoices', Buffer.from('pdf'), 'application/pdf');

      expect(key.startsWith('my-tenant/')).toBe(true);
    });

    it('should throw BadRequestException when tenantId is empty', async () => {
      await expect(
        service.upload('', 'receipts', Buffer.from('data'), 'image/jpeg'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getSignedUrl()', () => {
    it('should return the signed URL from the presigner', async () => {
      const fakeUrl = 'https://signed.r2.dev/abc';
      mockGetSignedUrl.mockResolvedValueOnce(fakeUrl);

      const url = await service.getSignedUrl('tenant-abc/receipts/some-uuid');

      expect(url).toBe(fakeUrl);
    });

    it('should use whatsell-receipts bucket and correct key', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://signed.url');

      await service.getSignedUrl('tenant-abc/receipts/some-uuid');

      const [, cmd] = mockGetSignedUrl.mock.calls[0] as [
        unknown,
        InstanceType<typeof GetObjectCommand> & { Bucket: string; Key: string },
      ];
      expect(cmd.Bucket).toBe('whatsell-receipts');
      expect(cmd.Key).toBe('tenant-abc/receipts/some-uuid');
    });

    it('should use whatsell-logos bucket for logos key', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://signed.url');

      await service.getSignedUrl('tenant-abc/logos/logo-uuid');

      const [, cmd] = mockGetSignedUrl.mock.calls[0] as [
        unknown,
        InstanceType<typeof GetObjectCommand> & { Bucket: string },
      ];
      expect(cmd.Bucket).toBe('whatsell-logos');
    });

    it('should default expiresIn to 3600', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://signed.url');

      await service.getSignedUrl('tenant-abc/invoices/inv-uuid');

      const [, , options] = mockGetSignedUrl.mock.calls[0] as [unknown, unknown, { expiresIn: number }];
      expect(options.expiresIn).toBe(3600);
    });

    it('should pass custom expiresIn when provided', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://signed.url');

      await service.getSignedUrl('tenant-abc/invoices/inv-uuid', 300);

      const [, , options] = mockGetSignedUrl.mock.calls[0] as [unknown, unknown, { expiresIn: number }];
      expect(options.expiresIn).toBe(300);
    });

    it('should throw BadRequestException for invalid type in key', async () => {
      await expect(service.getSignedUrl('tenant-abc/invalid-type/some-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw BadRequestException when key has no type segment', async () => {
      await expect(service.getSignedUrl('tenant-abc')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when expiresIn is 0', async () => {
      await expect(
        service.getSignedUrl('tenant-abc/receipts/some-uuid', 0),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException when expiresIn exceeds 604800', async () => {
      await expect(
        service.getSignedUrl('tenant-abc/receipts/some-uuid', 604801),
      ).rejects.toThrow(BadRequestException);
    });

    it('should accept expiresIn of exactly 604800', async () => {
      mockGetSignedUrl.mockResolvedValueOnce('https://signed.url');

      await expect(
        service.getSignedUrl('tenant-abc/receipts/some-uuid', 604800),
      ).resolves.toBe('https://signed.url');
    });

    it('should throw ForbiddenException when key belongs to different tenant', async () => {
      mockGetTenantId.mockReturnValue('tenant-xyz');

      await expect(
        service.getSignedUrl('tenant-abc/receipts/some-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow access when key matches current tenant', async () => {
      mockGetTenantId.mockReturnValue('tenant-abc');
      mockGetSignedUrl.mockResolvedValueOnce('https://signed.url');

      await expect(
        service.getSignedUrl('tenant-abc/receipts/some-uuid'),
      ).resolves.toBe('https://signed.url');
    });

    it('should skip tenant check when no tenant context (cron/tests)', async () => {
      mockGetTenantId.mockReturnValue(undefined);
      mockGetSignedUrl.mockResolvedValueOnce('https://signed.url');

      await expect(
        service.getSignedUrl('any-tenant/receipts/some-uuid'),
      ).resolves.toBe('https://signed.url');
    });
  });

  describe('delete()', () => {
    it('should call DeleteObjectCommand with correct Bucket and Key for receipts', async () => {
      mockSend.mockResolvedValueOnce({});

      await service.delete('tenant-abc/receipts/file-uuid');

      const [[cmd]] = (mockSend as jest.Mock).mock.calls;
      const typedCmd = cmd as InstanceType<typeof DeleteObjectCommand> & {
        Bucket: string;
        Key: string;
      };
      expect(typedCmd.Bucket).toBe('whatsell-receipts');
      expect(typedCmd.Key).toBe('tenant-abc/receipts/file-uuid');
    });

    it('should call DeleteObjectCommand with correct Bucket for logos', async () => {
      mockSend.mockResolvedValueOnce({});

      await service.delete('tenant-abc/logos/logo-uuid');

      const [[cmd]] = (mockSend as jest.Mock).mock.calls;
      expect((cmd as InstanceType<typeof DeleteObjectCommand> & { Bucket: string }).Bucket).toBe(
        'whatsell-logos',
      );
    });

    it('should call DeleteObjectCommand with correct Bucket for invoices', async () => {
      mockSend.mockResolvedValueOnce({});

      await service.delete('tenant-abc/invoices/inv-uuid');

      const [[cmd]] = (mockSend as jest.Mock).mock.calls;
      expect((cmd as InstanceType<typeof DeleteObjectCommand> & { Bucket: string }).Bucket).toBe(
        'whatsell-invoices',
      );
    });

    it('should throw BadRequestException for invalid type in key', async () => {
      await expect(service.delete('tenant-abc/unknown/file-uuid')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw ForbiddenException when key belongs to different tenant', async () => {
      mockGetTenantId.mockReturnValue('tenant-xyz');

      await expect(
        service.delete('tenant-abc/receipts/file-uuid'),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should allow delete when key matches current tenant', async () => {
      mockGetTenantId.mockReturnValue('tenant-abc');
      mockSend.mockResolvedValueOnce({});

      await expect(
        service.delete('tenant-abc/receipts/file-uuid'),
      ).resolves.toBeUndefined();
    });

    it('should propagate S3 errors', async () => {
      mockSend.mockRejectedValueOnce(new Error('S3 network failure'));

      await expect(
        service.delete('tenant-abc/receipts/file-uuid'),
      ).rejects.toThrow('S3 network failure');
    });
  });
});
