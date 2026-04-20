import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { Role } from '../../../../generated/prisma/client';

export interface JwtPayload {
  sub: string;
  email: string;
  tenantId: string;
  role: Role;
  type: 'access' | 'refresh';
  iat?: number;
  exp?: number;
}

export interface AuthUser {
  id: string;
  email: string;
  tenantId: string;
  role: Role;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(configService: ConfigService) {
    super({
      // Extraction depuis le cookie httpOnly `access_token`
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: Request) => req?.cookies?.['access_token'] as string | null,
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
      passReqToCallback: false,
    });
  }

  validate(payload: JwtPayload): AuthUser {
    // Rejeter les refresh tokens utilisés comme access tokens
    if (payload.type !== 'access') {
      throw new UnauthorizedException('Type de token invalide');
    }

    return {
      id: payload.sub,
      email: payload.email,
      tenantId: payload.tenantId,
      role: payload.role,
    };
  }
}
