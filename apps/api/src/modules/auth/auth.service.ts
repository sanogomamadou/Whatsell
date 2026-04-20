import * as crypto from 'node:crypto';
import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { LoginDto, RegisterDto } from '@whatsell/shared';
import { User } from '../../../generated/prisma/client';
import { AuthRepository } from './auth.repository';
import { JwtPayload } from './strategies/jwt.strategy';

// Durées d'expiration en secondes (évite le type StringValue non-inférable à la compilation)
const ACCESS_TOKEN_TTL_S = 15 * 60;          // 15 minutes
const REFRESH_TOKEN_TTL_S = 7 * 24 * 60 * 60; // 7 jours

interface RefreshPayload {
  sub: string;
  jti: string;
  type: 'refresh';
  iat?: number;
  exp?: number;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(dto: RegisterDto): Promise<AuthTokens> {
    const existing = await this.authRepository.findUserByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Un compte avec cet email existe déjà');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    // Génération d'un slug unique à partir de la partie locale de l'email
    const localPart = dto.email
      .split('@')[0]
      .replace(/[^a-z0-9]/gi, '')
      .toLowerCase();
    const uniqueSuffix = crypto.randomBytes(8).toString('hex');
    const tenantSlug = `${localPart}-${uniqueSuffix}`;
    const tenantName = `Boutique ${localPart}`;

    const user = await this.authRepository.createTenantAndUser({
      email: dto.email,
      passwordHash,
      tenantName,
      tenantSlug,
    });

    return this.generateTokens(user);
  }

  async login(dto: LoginDto): Promise<AuthTokens> {
    const user = await this.authRepository.findUserByEmail(dto.email);

    // Message générique — ne pas révéler si l'email existe ou non
    const invalidCredentialsMsg = 'Email ou mot de passe invalide';

    if (!user || !user.isActive) {
      throw new UnauthorizedException(invalidCredentialsMsg);
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException(invalidCredentialsMsg);
    }

    return this.generateTokens(user);
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const secret = this.configService.getOrThrow<string>('jwt.secret');

    // 1. Vérifier la signature et l'expiration du JWT refresh
    let payload: RefreshPayload;
    try {
      payload = this.jwtService.verify<RefreshPayload>(rawRefreshToken, { secret });
    } catch {
      throw new UnauthorizedException('Refresh token invalide ou expiré');
    }

    // 2. Vérifier que c'est bien un refresh token
    if (payload.type !== 'refresh') {
      throw new UnauthorizedException('Type de token invalide');
    }

    // 3. Charger l'utilisateur et vérifier qu'il est actif
    const user = await this.authRepository.findUserById(payload.sub);
    if (!user || !user.isActive || !user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token révoqué');
    }

    // 4. Valider le jti contre le hash stocké — détecte la réutilisation après révocation
    const jtiMatches = await bcrypt.compare(payload.jti, user.refreshTokenHash);
    if (!jtiMatches) {
      throw new UnauthorizedException('Refresh token révoqué');
    }

    // 5. Rotation : générer de nouveaux tokens (invalide automatiquement l'ancien jti)
    return this.generateTokens(user);
  }

  async logout(userId: string): Promise<void> {
    await this.authRepository.updateRefreshTokenHash(userId, null);
  }

  private async generateTokens(user: User): Promise<AuthTokens> {
    const secret = this.configService.getOrThrow<string>('jwt.secret');

    // Access token — JWT signé, expiration 15 min
    const accessPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      tenantId: user.tenantId,
      role: user.role,
      type: 'access',
    };

    const accessToken = this.jwtService.sign(accessPayload, {
      secret,
      expiresIn: ACCESS_TOKEN_TTL_S,
    });

    // Refresh token — JWT signé contenant un jti aléatoire pour la rotation
    const jti = crypto.randomBytes(20).toString('hex');

    const refreshPayload: RefreshPayload = {
      sub: user.id,
      jti,
      type: 'refresh',
    };

    const refreshToken = this.jwtService.sign(refreshPayload, {
      secret,
      expiresIn: REFRESH_TOKEN_TTL_S,
    });

    // Stocker le hash du jti en base — rotation détectée si jti ne matche pas
    const jtiHash = await bcrypt.hash(jti, 10);
    await this.authRepository.updateRefreshTokenHash(user.id, jtiHash);

    return { accessToken, refreshToken };
  }
}
