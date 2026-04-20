import { Injectable } from '@nestjs/common';
import { AsyncLocalStorage } from 'async_hooks';

interface TenantStore {
  tenantId: string;
}

@Injectable()
export class TenantContextService {
  private readonly storage = new AsyncLocalStorage<TenantStore>();

  /**
   * Exécute le callback dans un contexte lié au tenantId donné.
   * Toujours appeler via le TenantMiddleware — ne pas appeler manuellement.
   */
  run<T>(tenantId: string, callback: () => T): T {
    return this.storage.run({ tenantId }, callback);
  }

  /**
   * Retourne le tenantId du contexte courant.
   * Retourne undefined si appelé hors contexte de requête (ex: cron, test unitaire).
   * JAMAIS passer le tenantId en paramètre de méthode — utiliser ce service.
   */
  getTenantId(): string | undefined {
    return this.storage.getStore()?.tenantId;
  }
}
