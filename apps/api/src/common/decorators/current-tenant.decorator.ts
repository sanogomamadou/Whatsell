import { createParamDecorator, ExecutionContext, InternalServerErrorException } from '@nestjs/common';
import { Request } from 'express';

/**
 * Décorateur de paramètre — retourne le tenantId depuis la requête courante.
 * Le TenantMiddleware doit avoir été appliqué avant l'appel du handler.
 *
 * Usage : async getOrders(@CurrentTenant() tenantId: string) { ... }
 *
 * Note : Pour les services et repositories (hors contexte HTTP),
 * utiliser TenantContextService.getTenantId() directement.
 */
export const CurrentTenant = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest<Request & { tenantId?: string }>();
    const tenantId = request.tenantId;
    if (!tenantId) {
      throw new InternalServerErrorException('tenantId non disponible — TenantMiddleware non appliqué sur cette route');
    }
    return tenantId;
  },
);
