import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('whatsapp-health-check')
export class WhatsappHealthCheckProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsappHealthCheckProcessor.name);

  // Stub — implémentation réelle en Story 9.1 (WhatsappHealthCheckProcessor)
  async process(_job: Job): Promise<void> {
    throw new Error('Not implemented — Story 9.1 required');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    // Dead-letter logging après épuisement de toutes les tentatives (NFR20)
    // data exclu intentionnellement — peut contenir des données tenant sensibles
    if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
      this.logger.error({
        event: 'dead-letter',
        queue: 'whatsapp-health-check',
        jobId: job.id,
        jobName: job.name,
        attemptsMade: job.attemptsMade,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
