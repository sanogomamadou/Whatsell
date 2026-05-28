import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { SettingsService } from './settings.service';
import { SettingsRepository } from './settings.repository';
import { StorageService } from '../../common/services/storage.service';
import { EncryptionService } from '../../common/services/encryption.service';
import { AuditService } from '../audit/audit.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockSettingsRepository = {
  getProfileSettings: jest.fn(),
  updateProfile: jest.fn(),
  updateWhatsappConnection: jest.fn(),
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

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const TENANT_ID = 'tenant-uuid-1';
const USER_ID = 'user-uuid-1';
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

const VALID_DTO = {
  whatsappBusinessAccountId: 'waba-123',
  whatsappToken: 'valid-token-permanent-access',
};

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SettingsService', () => {
  let service: SettingsService;

  beforeEach(async () => {
    jest.clearAllMocks();

    mockSettingsRepository.updateProfile.mockResolvedValue({ name: VALID_NAME, logoUrl: null });
    mockStorageService.upload.mockResolvedValue(R2_KEY);
    mockEncryptionService.encrypt.mockReturnValue('encrypted-token');
    mockSettingsRepository.updateWhatsappConnection.mockResolvedValue({
      whatsappBusinessAccountId: 'waba-123',
    });
    mockAuditService.log.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: SettingsRepository, useValue: mockSettingsRepository },
        { provide: StorageService, useValue: mockStorageService },
        { provide: EncryptionService, useValue: mockEncryptionService },
        { provide: AuditService, useValue: mockAuditService },
      ],
    }).compile();

    service = module.get<SettingsService>(SettingsService);
  });

  // ── getProfileSettings ─────────────────────────────────────────────────────

  describe('getProfileSettings', () => {
    it('délègue au repo et retourne le résultat intact', async () => {
      const profile = {
        name: 'Boutique',
        logoUrl: null,
        whatsappBusinessAccountId: 'waba-1',
      };
      mockSettingsRepository.getProfileSettings.mockResolvedValue(profile);

      const result = await service.getProfileSettings(TENANT_ID);

      expect(mockSettingsRepository.getProfileSettings).toHaveBeenCalledWith(TENANT_ID);
      expect(result).toEqual(profile);
    });
  });

  // ── updateProfile ──────────────────────────────────────────────────────────

  describe('updateProfile', () => {
    it('sans logo → repo appelé sans logoUrl', async () => {
      await service.updateProfile(TENANT_ID, VALID_NAME);

      expect(mockStorageService.upload).not.toHaveBeenCalled();
      expect(mockSettingsRepository.updateProfile).toHaveBeenCalledWith(TENANT_ID, {
        name: VALID_NAME,
        logoUrl: undefined,
      });
    });

    it('avec logo → upload R2, clé passée au repo', async () => {
      await service.updateProfile(TENANT_ID, VALID_NAME, mockLogoFile);

      expect(mockStorageService.upload).toHaveBeenCalledWith(
        TENANT_ID,
        'logos',
        mockLogoFile.buffer,
        mockLogoFile.mimetype,
      );
      expect(mockSettingsRepository.updateProfile).toHaveBeenCalledWith(TENANT_ID, {
        name: VALID_NAME,
        logoUrl: R2_KEY,
      });
    });

    it('nom vide → BadRequestException', async () => {
      await expect(service.updateProfile(TENANT_ID, '')).rejects.toBeInstanceOf(BadRequestException);
      expect(mockSettingsRepository.updateProfile).not.toHaveBeenCalled();
    });

    it('nom uniquement espaces → BadRequestException', async () => {
      await expect(service.updateProfile(TENANT_ID, '   ')).rejects.toBeInstanceOf(BadRequestException);
      expect(mockSettingsRepository.updateProfile).not.toHaveBeenCalled();
    });

    it('retourne le résultat du repo', async () => {
      const repoResult = { name: VALID_NAME, logoUrl: null };
      mockSettingsRepository.updateProfile.mockResolvedValue(repoResult);

      const result = await service.updateProfile(TENANT_ID, VALID_NAME);

      expect(result).toEqual(repoResult);
    });
  });

  // ── reconnectWhatsapp ──────────────────────────────────────────────────────

  describe('reconnectWhatsapp', () => {
    it('succès → encrypt + repo + audit whatsapp.reconnected', async () => {
      const result = await service.reconnectWhatsapp(TENANT_ID, USER_ID, VALID_DTO);

      expect(mockEncryptionService.encrypt).toHaveBeenCalledWith(VALID_DTO.whatsappToken);
      expect(mockSettingsRepository.updateWhatsappConnection).toHaveBeenCalledWith(
        TENANT_ID,
        expect.objectContaining({
          whatsappBusinessAccountId: 'waba-123',
          encryptedToken: 'encrypted-token',
        }),
      );
      expect(mockAuditService.log).toHaveBeenCalledWith(
        expect.objectContaining({
          tenantId: TENANT_ID,
          userId: USER_ID,
          action: 'whatsapp.reconnected',
          resource: 'tenant',
          resourceId: TENANT_ID,
        }),
      );
      expect(result).toEqual({ whatsappBusinessAccountId: 'waba-123' });
    });

    it('audit échoue silencieusement → opération principale réussit', async () => {
      // AuditService.log() garantit en interne de ne jamais propager d'exception.
      // Ce test vérifie que SettingsService s'appuie sur cette garantie.
      mockAuditService.log.mockRejectedValueOnce(new Error('DB down'));

      await expect(
        service.reconnectWhatsapp(TENANT_ID, USER_ID, VALID_DTO),
      ).resolves.toEqual({ whatsappBusinessAccountId: 'waba-123' });
    });

    it('WABA ID vide → BadRequestException', async () => {
      await expect(
        service.reconnectWhatsapp(TENANT_ID, USER_ID, {
          whatsappBusinessAccountId: '',
          whatsappToken: 'some-token',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockSettingsRepository.updateWhatsappConnection).not.toHaveBeenCalled();
    });

    it('token vide → BadRequestException', async () => {
      await expect(
        service.reconnectWhatsapp(TENANT_ID, USER_ID, {
          whatsappBusinessAccountId: 'waba-123',
          whatsappToken: '',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(mockSettingsRepository.updateWhatsappConnection).not.toHaveBeenCalled();
    });
  });
});
