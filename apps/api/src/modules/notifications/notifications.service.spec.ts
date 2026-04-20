import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { Subject } from 'rxjs';
import { NotificationsService } from './notifications.service';
import { NotificationsRepository } from './notifications.repository';
import { EventsService, InternalEvent } from '../events/events.service';

// Mock web-push
jest.mock('web-push', () => ({
  setVapidDetails: jest.fn(),
  sendNotification: jest.fn().mockResolvedValue({}),
}));

import * as webpush from 'web-push';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let repo: jest.Mocked<NotificationsRepository>;
  let eventsService: jest.Mocked<EventsService>;
  let internalStream$: Subject<InternalEvent>;

  const TENANT_ID = 'tenant-abc';
  const USER_ID = 'user-xyz';

  const mockDto = {
    endpoint: 'https://push.example.com/sub/123',
    keys: { p256dh: 'pubkey', auth: 'authsecret' },
  };

  beforeEach(async () => {
    internalStream$ = new Subject<InternalEvent>();

    repo = {
      storeToken: jest.fn().mockResolvedValue({}),
      deleteToken: jest.fn().mockResolvedValue(undefined),
      getTokensByTenant: jest.fn().mockResolvedValue([]),
      deleteByEndpointHash: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<NotificationsRepository>;

    eventsService = {
      subscribeToAll: jest.fn().mockReturnValue(internalStream$.asObservable()),
    } as unknown as jest.Mocked<EventsService>;

    const configService = {
      get: jest.fn((key: string, def: string) => {
        const map: Record<string, string> = {
          'webPush.vapidPublicKey': 'test-public-key',
          'webPush.vapidPrivateKey': 'test-private-key',
          'webPush.vapidSubject': 'mailto:test@example.com',
        };
        return map[key] ?? def;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: NotificationsRepository, useValue: repo },
        { provide: EventsService, useValue: eventsService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    service.onModuleInit();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('registerPush stocke le token via le repository', async () => {
    await service.registerPush(TENANT_ID, USER_ID, mockDto);
    expect(repo.storeToken).toHaveBeenCalledWith(
      TENANT_ID,
      USER_ID,
      mockDto.endpoint,
      mockDto.keys,
      undefined,
    );
  });

  it('unregisterPush supprime le token via le repository', async () => {
    await service.unregisterPush(TENANT_ID, { endpoint: mockDto.endpoint });
    expect(repo.deleteToken).toHaveBeenCalledWith(TENANT_ID, mockDto.endpoint);
  });

  it('sendPushToTenant appelle webpush pour chaque token du tenant', async () => {
    repo.getTokensByTenant.mockResolvedValue([
      { id: '1', tenantId: TENANT_ID, userId: USER_ID, endpoint: mockDto.endpoint, keys: mockDto.keys },
    ]);
    await service.sendPushToTenant(TENANT_ID, 'order.created', { orderId: '42', productName: 'Boubou', totalAmount: 5000 });
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
  });

  it('sendPushToTenant ne plante pas si aucun token', async () => {
    repo.getTokensByTenant.mockResolvedValue([]);
    await expect(
      service.sendPushToTenant(TENANT_ID, 'order.created', {}),
    ).resolves.not.toThrow();
    expect(webpush.sendNotification).not.toHaveBeenCalled();
  });

  it('onModuleInit s\'abonne au stream EventsService', () => {
    expect(eventsService.subscribeToAll).toHaveBeenCalledTimes(1);
  });

  it('seuls order.created, conversation.handoff_required, stock.alert déclenchent un push', async () => {
    repo.getTokensByTenant.mockResolvedValue([
      { id: '1', tenantId: TENANT_ID, userId: USER_ID, endpoint: mockDto.endpoint, keys: mockDto.keys },
    ]);

    // Émet order.status_changed — ne devrait PAS déclencher push
    internalStream$.next({ tenantId: TENANT_ID, event: 'order.status_changed', payload: {}, timestamp: new Date().toISOString() });
    // Émet order.created — devrait déclencher push
    internalStream$.next({ tenantId: TENANT_ID, event: 'order.created', payload: { orderId: '1' }, timestamp: new Date().toISOString() });

    // Attendre la micro-task (async dans l'observable)
    await new Promise((r) => setTimeout(r, 10));
    expect(webpush.sendNotification).toHaveBeenCalledTimes(1);
  });

  it('payload order.created contient "Nouvelle commande 🎉"', async () => {
    repo.getTokensByTenant.mockResolvedValue([
      { id: '1', tenantId: TENANT_ID, userId: USER_ID, endpoint: mockDto.endpoint, keys: mockDto.keys },
    ]);
    await service.sendPushToTenant(TENANT_ID, 'order.created', { orderId: '1', productName: 'Tissu wax', totalAmount: 12000 });
    const call = (webpush.sendNotification as jest.Mock).mock.calls[0] as [unknown, string];
    const parsed = JSON.parse(call[1]) as { title: string };
    expect(parsed.title).toBe('Nouvelle commande 🎉');
  });

  it('token expiré (statusCode 410) — supprime silencieusement sans crash', async () => {
    const expiredError = { statusCode: 410 };
    (webpush.sendNotification as jest.Mock).mockRejectedValueOnce(expiredError);
    repo.getTokensByTenant.mockResolvedValue([
      { id: '1', tenantId: TENANT_ID, userId: USER_ID, endpoint: mockDto.endpoint, keys: mockDto.keys },
    ]);
    await expect(
      service.sendPushToTenant(TENANT_ID, 'order.created', {}),
    ).resolves.not.toThrow();
    expect(repo.deleteByEndpointHash).toHaveBeenCalledTimes(1);
  });
});
