import { Injectable, Logger } from '@nestjs/common';
import { AuditRepository, type AuditLogData } from './audit.repository';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private readonly auditRepository: AuditRepository) {}

  async log(data: AuditLogData): Promise<void> {
    try {
      await this.auditRepository.log(data);
    } catch (err) {
      this.logger.warn('Audit log write failed (non-blocking)', {
        action: data.action,
        tenantId: data.tenantId,
        err,
      });
    }
  }
}
