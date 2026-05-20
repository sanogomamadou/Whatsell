import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { OnboardingRepository } from './onboarding.repository';
import { StorageService } from '../../common/services/storage.service';
import { EncryptionService } from '../../common/services/encryption.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockOnboardingRepository = {
  updateProfile: jest.fn(),
  connectWhatsapp: jest.fn(),
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
});
