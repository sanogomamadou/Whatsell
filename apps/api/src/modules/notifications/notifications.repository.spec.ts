import * as crypto from 'node:crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { NotificationsRepository } from './notifications.repository';
import { PrismaService } from '../../prisma/prisma.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { ConfigService } from '@nestjs/config';

const VALID_KEY = 'b'.repeat(32);
const TENANT_A = 'tenant-a';
const TENANT_B = 'tenant-b';
const USER_ID = 'user-1';

function makeSubscription(endpoint = 'https://push.example.com/sub/1') {
  return {
    endpoint,
    keys: { p256dh: 'p256dhValue', auth: 'authValue' },
  };
}

function hashEndpoint(endpoint: string): string {
  return crypto.createHash('sha256').update(endpoint).digest('hex');
}

describe('NotificationsRepository', () => {
  let repository: NotificationsRepository;
  let prisma: jest.Mocked<PrismaService>;
  let encryptionService: EncryptionService;

  beforeEach(async () => {
    prisma = {
      pushToken: {
        upsert: jest.fn(),
        findMany: jest.fn(),
        deleteMany: jest.fn(),
      },
    } as unknown as jest.Mocked<PrismaService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsRepository,
        { provide: PrismaService, useValue: prisma },
        EncryptionService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue(VALID_KEY) },
        },
      ],
    }).compile();

    repository = module.get<NotificationsRepository>(NotificationsRepository);
    encryptionService = module.get<EncryptionService>(EncryptionService);
  });

  afterEach(() => jest.clearAllMocks());

  it('storeToken fait un upsert avec le bon endpointHash', async () => {
    const sub = makeSubscription();
    (prisma.pushToken.upsert as jest.Mock).mockResolvedValue({});

    await repository.storeToken(TENANT_A, USER_ID, sub.endpoint, sub.keys);

    const expectedHash = hashEndpoint(sub.endpoint);
    expect(prisma.pushToken.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { tenantId_endpointHash: { tenantId: TENANT_A, endpointHash: expectedHash } },
      }),
    );
  });

  it('getTokensByTenant déchiffre correctement les champs', async () => {
    const sub = makeSubscription();
    const stored = {
      id: '1',
      tenantId: TENANT_A,
      userId: USER_ID,
      endpointHash: hashEndpoint(sub.endpoint),
      endpointEncrypted: encryptionService.encrypt(sub.endpoint),
      p256dhEncrypted: encryptionService.encrypt(sub.keys.p256dh),
      authEncrypted: encryptionService.encrypt(sub.keys.auth),
      userAgent: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    (prisma.pushToken.findMany as jest.Mock).mockResolvedValue([stored]);

    const result = await repository.getTokensByTenant(TENANT_A);

    expect(result).toHaveLength(1);
    expect(result[0].endpoint).toBe(sub.endpoint);
    expect(result[0].keys.p256dh).toBe(sub.keys.p256dh);
    expect(result[0].keys.auth).toBe(sub.keys.auth);
  });

  it('deleteToken n\'affecte que le tenant ciblé (isolation multi-tenant)', async () => {
    const sub = makeSubscription();
    (prisma.pushToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

    await repository.deleteToken(TENANT_A, sub.endpoint);

    expect(prisma.pushToken.deleteMany).toHaveBeenCalledWith({
      where: {
        tenantId: TENANT_A,
        endpointHash: hashEndpoint(sub.endpoint),
      },
    });
    // S'assurer que TENANT_B n'est PAS dans la clause where
    const call = (prisma.pushToken.deleteMany as jest.Mock).mock.calls[0] as [{ where: { tenantId: string } }];
    expect(call[0].where.tenantId).toBe(TENANT_A);
    expect(call[0].where.tenantId).not.toBe(TENANT_B);
  });

  it('getTokensByTenant filtre par tenantId (isolation)', async () => {
    (prisma.pushToken.findMany as jest.Mock).mockResolvedValue([]);
    await repository.getTokensByTenant(TENANT_B);
    expect(prisma.pushToken.findMany).toHaveBeenCalledWith({
      where: { tenantId: TENANT_B },
    });
  });

  it('storeToken upsert sur conflit endpoint (même tenant)', async () => {
    const sub = makeSubscription();
    (prisma.pushToken.upsert as jest.Mock).mockResolvedValue({});

    // Premier appel
    await repository.storeToken(TENANT_A, USER_ID, sub.endpoint, sub.keys);
    // Deuxième appel avec même endpoint → doit aussi faire un upsert (pas d'erreur)
    await repository.storeToken(TENANT_A, USER_ID, sub.endpoint, { ...sub.keys, auth: 'newAuth' });

    expect(prisma.pushToken.upsert).toHaveBeenCalledTimes(2);
  });
});
