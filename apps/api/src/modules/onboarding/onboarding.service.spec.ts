import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OnboardingService } from './onboarding.service';
import { OnboardingRepository } from './onboarding.repository';
import { StorageService } from '../../common/services/storage.service';

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockOnboardingRepository = {
  updateProfile: jest.fn(),
};

const mockStorageService = {
  upload: jest.fn(),
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
});
