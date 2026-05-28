import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { OnboardingRepository } from './onboarding.repository';
import { StorageService } from '../../common/services/storage.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { AuditService } from '../audit/audit.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockOnboardingRepository = {
  updateProfile: jest.fn(),
  connectWhatsapp: jest.fn(),
  updatePaymentRules: jest.fn(),
  getOnboardingSummary: jest.fn(),
  activateAgent: jest.fn(),
};

const mockAuditService = {
  log: jest.fn(),
};

const mockStorageService = {
  upload: jest.fn(),
};

const mockEncryptionService = {
  encrypt: jest.fn(),
};

// ─── Fixtures ────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-uuid-1';
const VALID_NAME = 'Ma Boutique Test';
const R2_KEY = `${TENANT_ID}/logos/some-uuid`;

const mockLogoFile = {
  fieldname: 'logo',
  originalname: 'logo.png',
  encoding: '7bit',
  mimetype: 'image/png',
  buffer: Buffer.from('fake-image-data'),
  size: 1024,
} as Express.Multer.File;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('OnboardingService', () => {
  let service: OnboardingService;

  beforeEach(async () => {
    jest.clearAllMocks();
    mockOnboardingRepository.updateProfile.mockResolvedValue({
      name: VALID_NAME,
      logoUrl: null,
    });
    mockStorageService.upload.mockResolvedValue(R2_KEY);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OnboardingService,
        { provide: OnboardingRepository, useValue: mockOnboardingRepository },
        { provide: StorageService, useValue: mockStorageService },
        { provide: EncryptionService, useValue: mockEncryptionService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<OnboardingService>(OnboardingService);
  });

  describe('updateProfile', () => {
    it('nom valide sans logo — met à jour le nom, storageService non appelé', async () => {
      mockOnboardingRepository.updateProfile.mockResolvedValue({
        name: VALID_NAME,
        logoUrl: null,
      });

      const result = await service.updateProfile(TENANT_ID, VALID_NAME);

      expect(mockStorageService.upload).not.toHaveBeenCalled();
      expect(mockOnboardingRepository.updateProfile).toHaveBeenCalledWith(
        TENANT_ID,
        { name: VALID_NAME, logoUrl: undefined },
      );
      expect(result).toEqual({ name: VALID_NAME, logoUrl: null });
    });

    it('nom valide + logo — upload R2 puis mise à jour avec la clé retournée', async () => {
      mockOnboardingRepository.updateProfile.mockResolvedValue({
        name: VALID_NAME,
        logoUrl: R2_KEY,
      });

      const result = await service.updateProfile(TENANT_ID, VALID_NAME, mockLogoFile);

      expect(mockStorageService.upload).toHaveBeenCalledWith(
        TENANT_ID,
        'logos',
        mockLogoFile.buffer,
        mockLogoFile.mimetype,
      );
      expect(mockOnboardingRepository.updateProfile).toHaveBeenCalledWith(
        TENANT_ID,
        { name: VALID_NAME, logoUrl: R2_KEY },
      );
      expect(result).toEqual({ name: VALID_NAME, logoUrl: R2_KEY });
    });

    it('nom vide — lève BadRequestException', async () => {
      await expect(service.updateProfile(TENANT_ID, '')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockStorageService.upload).not.toHaveBeenCalled();
      expect(mockOnboardingRepository.updateProfile).not.toHaveBeenCalled();
    });

    it('nom avec uniquement des espaces — lève BadRequestException après trim', async () => {
      await expect(service.updateProfile(TENANT_ID, '   ')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockOnboardingRepository.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('connectWhatsapp', () => {
    const WABA_ID = 'waba-account-123';
    const RAW_TOKEN = 'EAAG...raw_token';
    const ENCRYPTED_TOKEN = 'iv123=:tag456=:cipher789=';

    beforeEach(() => {
      mockEncryptionService.encrypt.mockReturnValue(ENCRYPTED_TOKEN);
      mockOnboardingRepository.connectWhatsapp.mockResolvedValue({
        whatsappBusinessAccountId: WABA_ID,
      });
    });

    it('WABA ID + token valides → encrypt appelé avec token en clair, connectWhatsapp appelé avec token chiffré', async () => {
      const result = await service.connectWhatsapp(TENANT_ID, {
        whatsappBusinessAccountId: WABA_ID,
        whatsappToken: RAW_TOKEN,
      });

      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(RAW_TOKEN);
      expect(mockOnboardingRepository.connectWhatsapp).toHaveBeenCalledWith(
        TENANT_ID,
        { whatsappBusinessAccountId: WABA_ID, encryptedToken: ENCRYPTED_TOKEN },
      );
      expect(result).toEqual({ whatsappBusinessAccountId: WABA_ID });
    });

    it('WABA ID vide → lève BadRequestException, encrypt non appelé', async () => {
      await expect(
        service.connectWhatsapp(TENANT_ID, {
          whatsappBusinessAccountId: '',
          whatsappToken: RAW_TOKEN,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockEncryptionService.encrypt).not.toHaveBeenCalled();
      expect(mockOnboardingRepository.connectWhatsapp).not.toHaveBeenCalled();
    });

    it('token vide → lève BadRequestException, encrypt non appelé', async () => {
      await expect(
        service.connectWhatsapp(TENANT_ID, {
          whatsappBusinessAccountId: WABA_ID,
          whatsappToken: '',
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockEncryptionService.encrypt).not.toHaveBeenCalled();
      expect(mockOnboardingRepository.connectWhatsapp).not.toHaveBeenCalled();
    });

    it('WABA ID avec uniquement des espaces → lève BadRequestException après trim', async () => {
      await expect(
        service.connectWhatsapp(TENANT_ID, {
          whatsappBusinessAccountId: '   ',
          whatsappToken: RAW_TOKEN,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockEncryptionService.encrypt).not.toHaveBeenCalled();
    });
  });

  describe('updatePaymentRules', () => {
    const USER_ID = 'user-uuid-1';
    const VALID_DTO = {
      advancePercentage: 30,
      acceptedPaymentModes: ['orange_money', 'cash_on_delivery'] as ('orange_money' | 'moov_money' | 'cash_on_delivery')[],
    };

    beforeEach(() => {
      mockOnboardingRepository.updatePaymentRules.mockResolvedValue({
        advancePercentage: VALID_DTO.advancePercentage,
        acceptedPaymentModes: VALID_DTO.acceptedPaymentModes,
      });
      mockAuditService.log.mockResolvedValue(undefined);
    });

    it("données valides → met à jour les règles et log l'audit", async () => {
      const result = await service.updatePaymentRules(TENANT_ID, USER_ID, VALID_DTO);

      expect(mockOnboardingRepository.updatePaymentRules).toHaveBeenCalledWith(
        TENANT_ID,
        {
          advancePercentage: 30,
          acceptedPaymentModes: ['orange_money', 'cash_on_delivery'],
        },
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          userId: USER_ID,
          action: 'payment_rules.updated',
          resource: 'tenant',
          resourceId: TENANT_ID,
          metadata: {
            advancePercentage: 30,
            acceptedPaymentModes: ['orange_money', 'cash_on_delivery'],
          },
        }),
      );
      expect(result).toEqual({
        advancePercentage: 30,
        acceptedPaymentModes: ['orange_money', 'cash_on_delivery'],
      });
    });

    it('pourcentage 0% valide → accepté sans erreur', async () => {
      mockOnboardingRepository.updatePaymentRules.mockResolvedValue({
        advancePercentage: 0,
        acceptedPaymentModes: ['cash_on_delivery'],
      });

      await expect(
        service.updatePaymentRules(TENANT_ID, USER_ID, {
          advancePercentage: 0,
          acceptedPaymentModes: ['cash_on_delivery'],
        }),
      ).resolves.toEqual({ advancePercentage: 0, acceptedPaymentModes: ['cash_on_delivery'] });
    });

    it('pourcentage 100% valide → accepté sans erreur', async () => {
      mockOnboardingRepository.updatePaymentRules.mockResolvedValue({
        advancePercentage: 100,
        acceptedPaymentModes: ['orange_money'],
      });

      await expect(
        service.updatePaymentRules(TENANT_ID, USER_ID, {
          advancePercentage: 100,
          acceptedPaymentModes: ['orange_money'],
        }),
      ).resolves.toEqual({ advancePercentage: 100, acceptedPaymentModes: ['orange_money'] });
    });

    it('pourcentage 101 → lève BadRequestException', async () => {
      await expect(
        service.updatePaymentRules(TENANT_ID, USER_ID, {
          advancePercentage: 101,
          acceptedPaymentModes: ['orange_money'],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockOnboardingRepository.updatePaymentRules).not.toHaveBeenCalled();
    });

    it('pourcentage -1 → lève BadRequestException', async () => {
      await expect(
        service.updatePaymentRules(TENANT_ID, USER_ID, {
          advancePercentage: -1,
          acceptedPaymentModes: ['orange_money'],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockOnboardingRepository.updatePaymentRules).not.toHaveBeenCalled();
    });

    it('tableau de modes vide → lève BadRequestException', async () => {
      await expect(
        service.updatePaymentRules(TENANT_ID, USER_ID, {
          advancePercentage: 30,
          acceptedPaymentModes: [],
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockOnboardingRepository.updatePaymentRules).not.toHaveBeenCalled();
    });

    it("AuditService.log() est appelé et ne bloque pas l'opération principale", async () => {
      // AuditService.log() garantit par conception de ne jamais propager d'exception.
      // Ce test vérifie que OnboardingService s'appuie sur cette garantie (pas de double-catch).
      mockAuditService.log.mockResolvedValue(undefined);

      await expect(
        service.updatePaymentRules(TENANT_ID, USER_ID, VALID_DTO),
      ).resolves.toBeDefined();

      expect(mockAuditService.log).toHaveBeenCalled();
    });

    it('mode invalide ex: ["bitcoin"] → lève BadRequestException', async () => {
      await expect(
        service.updatePaymentRules(TENANT_ID, USER_ID, {
          advancePercentage: 30,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          acceptedPaymentModes: ['bitcoin'] as any,
        }),
      ).rejects.toThrow(BadRequestException);

      expect(mockOnboardingRepository.updatePaymentRules).not.toHaveBeenCalled();
    });
  });

  describe('getOnboardingSummary', () => {
    const SUMMARY = {
      shopName: 'Ma Boutique Test',
      whatsappNumber: 'waba-account-123',
      productCount: 3,
      advancePercentage: 50,
      acceptedPaymentModes: ['orange_money', 'cash_on_delivery'],
    };

    it('délègue au repo et retourne le résumé intact', async () => {
      mockOnboardingRepository.getOnboardingSummary.mockResolvedValue(SUMMARY);

      const result = await service.getOnboardingSummary(TENANT_ID);

      expect(mockOnboardingRepository.getOnboardingSummary).toHaveBeenCalledWith(TENANT_ID);
      expect(result).toEqual(SUMMARY);
    });
  });

  describe('activateAgent', () => {
    const USER_ID = 'user-uuid-1';
    const ACTIVATED_AT = new Date('2026-05-24T10:00:00.000Z');

    beforeEach(() => {
      mockOnboardingRepository.activateAgent.mockResolvedValue({ activatedAt: ACTIVATED_AT });
      mockAuditService.log.mockResolvedValue(undefined);
    });

    it("activation réussie → repo appelé + audit logué avec 'agent.activated'", async () => {
      const result = await service.activateAgent(TENANT_ID, USER_ID);

      expect(mockOnboardingRepository.activateAgent).toHaveBeenCalledWith(TENANT_ID);
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          userId: USER_ID,
          action: 'agent.activated',
          resource: 'tenant',
          resourceId: TENANT_ID,
        }),
      );
      expect(result).toEqual({ activatedAt: ACTIVATED_AT.toISOString() });
    });

    it('audit échoue silencieusement → opération principale réussit', async () => {
      // AuditService.log() garantit par conception de ne jamais propager d'exception.
      mockAuditService.log.mockRejectedValueOnce(new Error('DB down'));

      await expect(service.activateAgent(TENANT_ID, USER_ID)).resolves.toEqual({
        activatedAt: ACTIVATED_AT.toISOString(),
      });
    });
  });
});
