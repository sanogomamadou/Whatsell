import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsRepository } from './subscriptions.repository';
import { MailService } from '../../common/services/mail.service';
import { SubscriptionTier } from '../../../generated/prisma/client';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockSubscriptionsRepository = {
  getSubscriptionByTenant: jest.fn(),
  findSubscriptionsExpiringSoon: jest.fn(),
  downgradeExpiredTrials: jest.fn(),
  markWarningSent: jest.fn(),
};

const mockMailService = {
  sendTrialExpiringWarning: jest.fn(),
};

const mockConfigService = {
  get: jest.fn().mockReturnValue('http://localhost:3000'),
};

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-uuid-1';
const PAST_DATE = new Date(Date.now() - 24 * 60 * 60 * 1000); // hier
const FUTURE_DATE = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000); // dans 5 jours

// ─── Suite ────────────────────────────────────────────────────────────────────

describe('SubscriptionsService', () => {
  let service: SubscriptionsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SubscriptionsService,
        { provide: SubscriptionsRepository, useValue: mockSubscriptionsRepository },
        { provide: MailService, useValue: mockMailService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<SubscriptionsService>(SubscriptionsService);
  });

  // ── getStatus ──────────────────────────────────────────────────────────────

  describe('getStatus', () => {
    it('tier=FREE avec trialEndsAt passé → isTrialExpired: true', async () => {
      mockSubscriptionsRepository.getSubscriptionByTenant.mockResolvedValue({
        tier: SubscriptionTier.FREE,
        trialEndsAt: PAST_DATE,
        ordersUsed: 5,
        ordersLimit: 20,
      });
      const result = await service.getStatus(TENANT_ID);
      expect(result.isTrialExpired).toBe(true);
      expect(result.tier).toBe(SubscriptionTier.FREE);
    });

    it('tier=PRO avec trialEndsAt passé (cron pas encore tourné) → isTrialExpired: true', async () => {
      mockSubscriptionsRepository.getSubscriptionByTenant.mockResolvedValue({
        tier: SubscriptionTier.PRO,
        trialEndsAt: PAST_DATE,
        ordersUsed: 0,
        ordersLimit: 100,
      });
      const result = await service.getStatus(TENANT_ID);
      expect(result.isTrialExpired).toBe(true);
    });

    it('tier=PRO avec trialEndsAt futur → isTrialExpired: false', async () => {
      mockSubscriptionsRepository.getSubscriptionByTenant.mockResolvedValue({
        tier: SubscriptionTier.PRO,
        trialEndsAt: FUTURE_DATE,
        ordersUsed: 0,
        ordersLimit: 100,
      });
      const result = await service.getStatus(TENANT_ID);
      expect(result.isTrialExpired).toBe(false);
      expect(result.tier).toBe(SubscriptionTier.PRO);
    });

    it('tier=FREE sans trialEndsAt → isTrialExpired: false', async () => {
      mockSubscriptionsRepository.getSubscriptionByTenant.mockResolvedValue({
        tier: SubscriptionTier.FREE,
        trialEndsAt: null,
        ordersUsed: 3,
        ordersLimit: 20,
      });
      const result = await service.getStatus(TENANT_ID);
      expect(result.isTrialExpired).toBe(false);
    });

    it('pas de subscription → retour défensif FREE sans expiration', async () => {
      mockSubscriptionsRepository.getSubscriptionByTenant.mockResolvedValue(null);
      const result = await service.getStatus(TENANT_ID);
      expect(result.tier).toBe(SubscriptionTier.FREE);
      expect(result.isTrialExpired).toBe(false);
      expect(result.ordersLimit).toBe(20);
    });
  });

  // ── processTrialWarnings ────────────────────────────────────────────────────

  describe('processTrialWarnings', () => {
    it('sub dans la fenêtre J-2 avec email OWNER → sendTrialExpiringWarning appelé + markWarningSent', async () => {
      const trialEndsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      mockSubscriptionsRepository.findSubscriptionsExpiringSoon.mockResolvedValue([
        {
          tenantId: TENANT_ID,
          trialEndsAt,
          tenant: { name: 'Boutique Test', users: [{ email: 'owner@test.com' }] },
        },
      ]);
      mockMailService.sendTrialExpiringWarning.mockResolvedValue(undefined);
      mockSubscriptionsRepository.markWarningSent.mockResolvedValue(undefined);

      await service.processTrialWarnings();

      expect(mockMailService.sendTrialExpiringWarning).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'owner@test.com',
          shopName: 'Boutique Test',
          trialEndsAt,
        }),
      );
      expect(mockSubscriptionsRepository.markWarningSent).toHaveBeenCalledWith(TENANT_ID);
    });

    it('aucun sub dans la fenêtre → mail NOT appelé', async () => {
      mockSubscriptionsRepository.findSubscriptionsExpiringSoon.mockResolvedValue([]);

      await service.processTrialWarnings();

      expect(mockMailService.sendTrialExpiringWarning).not.toHaveBeenCalled();
    });

    it("sub sans email OWNER → mail non envoyé, markWarningSent non appelé, pas d'erreur levée", async () => {
      const trialEndsAt = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000);
      mockSubscriptionsRepository.findSubscriptionsExpiringSoon.mockResolvedValue([
        {
          tenantId: TENANT_ID,
          trialEndsAt,
          tenant: { name: 'Boutique Sans Owner', users: [] },
        },
      ]);

      await expect(service.processTrialWarnings()).resolves.not.toThrow();
      expect(mockMailService.sendTrialExpiringWarning).not.toHaveBeenCalled();
      expect(mockSubscriptionsRepository.markWarningSent).not.toHaveBeenCalled();
    });
  });

  // ── processTrialExpirations ────────────────────────────────────────────────

  describe('processTrialExpirations', () => {
    it('appelle downgradeExpiredTrials et log le count', async () => {
      mockSubscriptionsRepository.downgradeExpiredTrials.mockResolvedValue(3);

      await service.processTrialExpirations();

      expect(mockSubscriptionsRepository.downgradeExpiredTrials).toHaveBeenCalledTimes(1);
    });

    it("count = 0 → pas d'erreur levée", async () => {
      mockSubscriptionsRepository.downgradeExpiredTrials.mockResolvedValue(0);

      await expect(service.processTrialExpirations()).resolves.not.toThrow();
    });
  });
});
