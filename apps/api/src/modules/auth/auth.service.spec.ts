import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';
import { AuthRepository } from './auth.repository';
import { Role } from '../../../generated/prisma/client';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const mockUser = {
  id: 'user-uuid-1',
  email: 'test@example.com',
  passwordHash: '',
  tenantId: 'tenant-uuid-1',
  role: Role.OWNER,
  isActive: true,
  firstName: null,
  lastName: null,
  refreshTokenHash: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockTenant = {
  id: 'tenant-uuid-1',
  name: 'Boutique test',
  slug: 'boutique-test',
  logoUrl: null,
  whatsappBusinessAccountId: null,
  whatsappToken: null,
  onboardingCompletedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockAuthRepository = {
  findUserByEmail: jest.fn(),
  findUserById: jest.fn(),
  findUserWithTenant: jest.fn(),
  createTenantAndUser: jest.fn(),
  updateRefreshTokenHash: jest.fn(),
};

const mockJwtService = {
  sign: jest.fn(),
  verify: jest.fn(),
};

const CONFIG: Record<string, string> = {
  'jwt.secret': 'test-secret-min-32-chars-long-enough',
};

const mockConfigService = {
  get: jest.fn((key: string) => CONFIG[key]),
  getOrThrow: jest.fn((key: string) => {
    const value = CONFIG[key];
    if (value === undefined) throw new Error(`Config key "${key}" not found`);
    return value;
  }),
};

// ─── Test suite ───────────────────────────────────────────────────────────────

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    jest.clearAllMocks();

    // Valeurs par défaut des mocks
    mockJwtService.sign.mockReturnValue('signed-jwt-token');
    mockAuthRepository.updateRefreshTokenHash.mockResolvedValue(undefined);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: AuthRepository, useValue: mockAuthRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  // ─── register() ────────────────────────────────────────────────────────────

  describe('register()', () => {
    it('should create tenant + user and return tokens on success', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createTenantAndUser.mockResolvedValue(mockUser);

      const result = await service.register({
        email: 'new@example.com',
        password: 'password123',
      });

      expect(mockAuthRepository.findUserByEmail).toHaveBeenCalledWith('new@example.com');
      expect(mockAuthRepository.createTenantAndUser).toHaveBeenCalledWith(
        expect.objectContaining({ email: 'new@example.com' }),
      );
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw ConflictException when email is already taken', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(mockUser);

      await expect(
        service.register({ email: 'test@example.com', password: 'password123' }),
      ).rejects.toThrow(ConflictException);
    });

    it('should hash the password with bcrypt (salt >= 10)', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);
      mockAuthRepository.createTenantAndUser.mockResolvedValue(mockUser);

      const bcryptSpy = jest.spyOn(bcrypt, 'hash');

      await service.register({ email: 'new@example.com', password: 'secret' });

      expect(bcryptSpy).toHaveBeenCalledWith('secret', 10);
    });
  });

  // ─── login() ───────────────────────────────────────────────────────────────

  describe('login()', () => {
    let userWithHash: typeof mockUser;

    beforeEach(async () => {
      const hash = await bcrypt.hash('correct-password', 10);
      userWithHash = { ...mockUser, passwordHash: hash };
    });

    it('should return tokens when credentials are valid', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(userWithHash);

      const result = await service.login({
        email: 'test@example.com',
        password: 'correct-password',
      });

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('should throw UnauthorizedException for wrong password (generic message)', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(userWithHash);

      const error = await service
        .login({ email: 'test@example.com', password: 'wrong-password' })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).message).toBe('Email ou mot de passe invalide');
    });

    it('should throw UnauthorizedException for non-existent email (same generic message)', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue(null);

      const error = await service
        .login({ email: 'unknown@example.com', password: 'any' })
        .catch((e: unknown) => e);

      expect(error).toBeInstanceOf(UnauthorizedException);
      expect((error as UnauthorizedException).message).toBe('Email ou mot de passe invalide');
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      mockAuthRepository.findUserByEmail.mockResolvedValue({
        ...userWithHash,
        isActive: false,
      });

      await expect(
        service.login({ email: 'test@example.com', password: 'correct-password' }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── refresh() ─────────────────────────────────────────────────────────────

  describe('refresh()', () => {
    const validJti = 'valid-jti-hex-string';

    it('should rotate tokens when refresh token is valid', async () => {
      const jtiHash = await bcrypt.hash(validJti, 10);
      const userWithRefresh = { ...mockUser, refreshTokenHash: jtiHash };

      mockJwtService.verify.mockReturnValue({
        sub: mockUser.id,
        jti: validJti,
        type: 'refresh',
      });
      mockAuthRepository.findUserById.mockResolvedValue(userWithRefresh);

      const result = await service.refresh('valid-refresh-jwt');

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      // L'ancien hash doit être remplacé
      expect(mockAuthRepository.updateRefreshTokenHash).toHaveBeenCalledWith(
        mockUser.id,
        expect.any(String),
      );
    });

    it('should throw UnauthorizedException when jti does not match stored hash (token révoqué)', async () => {
      const otherJtiHash = await bcrypt.hash('different-jti', 10);
      const userWithOtherHash = { ...mockUser, refreshTokenHash: otherJtiHash };

      mockJwtService.verify.mockReturnValue({
        sub: mockUser.id,
        jti: 'incoming-jti-that-does-not-match',
        type: 'refresh',
      });
      mockAuthRepository.findUserById.mockResolvedValue(userWithOtherHash);

      await expect(service.refresh('tampered-token')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when JWT is invalid or expired', async () => {
      mockJwtService.verify.mockImplementation(() => {
        throw new Error('jwt expired');
      });

      await expect(service.refresh('expired-token')).rejects.toThrow(UnauthorizedException);
    });
  });

  // ─── logout() ──────────────────────────────────────────────────────────────

  describe('logout()', () => {
    it('should set refreshTokenHash to null', async () => {
      await service.logout(mockUser.id);

      expect(mockAuthRepository.updateRefreshTokenHash).toHaveBeenCalledWith(
        mockUser.id,
        null,
      );
    });
  });

  // ─── me() ──────────────────────────────────────────────────────────────────

  describe('me()', () => {
    it('should return onboardingCompleted: false when onboardingCompletedAt is null', async () => {
      mockAuthRepository.findUserWithTenant.mockResolvedValue({
        ...mockUser,
        tenant: { ...mockTenant, onboardingCompletedAt: null },
      });

      const result = await service.me(mockUser.id);

      expect(result.id).toBe(mockUser.id);
      expect(result.email).toBe(mockUser.email);
      expect(result.role).toBe(mockUser.role);
      expect(result.tenantId).toBe(mockUser.tenantId);
      expect(result.onboardingCompleted).toBe(false);
    });

    it('should return onboardingCompleted: true when onboardingCompletedAt is set', async () => {
      mockAuthRepository.findUserWithTenant.mockResolvedValue({
        ...mockUser,
        tenant: { ...mockTenant, onboardingCompletedAt: new Date() },
      });

      const result = await service.me(mockUser.id);

      expect(result.onboardingCompleted).toBe(true);
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      mockAuthRepository.findUserWithTenant.mockResolvedValue(null);

      await expect(service.me('unknown-id')).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      mockAuthRepository.findUserWithTenant.mockResolvedValue({
        ...mockUser,
        isActive: false,
        tenant: mockTenant,
      });

      await expect(service.me(mockUser.id)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when tenant is null (orphaned user)', async () => {
      mockAuthRepository.findUserWithTenant.mockResolvedValue({
        ...mockUser,
        tenant: null,
      });

      await expect(service.me(mockUser.id)).rejects.toThrow(UnauthorizedException);
    });
  });
});
