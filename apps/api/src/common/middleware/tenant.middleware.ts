import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';
import { TenantContextService } from '../services/tenant-context.service';

interface JwtPayload {
  tenantId: string;
  sub: string;
  role: string;
  iat?: number;
  exp?: number;
}

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly configService: ConfigService,
  ) {}

  use(req: Request & { tenantId?: string }, res: Response, next: NextFunction): void {
    const token = (req.cookies as Record<string, string> | undefined)?.['access_token'];

    if (!token) {
      res.status(401).json({ statusCode: 401, message: "Token d'accès manquant" });
      return;
    }

    const jwtSecret = this.configService.get<string>('jwt.secret');
    if (!jwtSecret) {
      res.status(500).json({ statusCode: 500, message: 'Configuration JWT invalide' });
      return;
    }

    let payload: JwtPayload;
    try {
      payload = jwt.verify(token, jwtSecret) as JwtPayload;
    } catch {
      res.status(401).json({ statusCode: 401, message: "Token d'accès invalide ou expiré" });
      return;
    }

    if (!payload.tenantId) {
      res.status(401).json({ statusCode: 401, message: 'tenantId absent du token JWT' });
      return;
    }

    // Enrichir la request pour les décorateurs HTTP (@CurrentTenant())
    req.tenantId = payload.tenantId;

    // Injecter dans AsyncLocalStorage pour les services/repositories
    this.tenantContext.run(payload.tenantId, () => next());
  }
}
