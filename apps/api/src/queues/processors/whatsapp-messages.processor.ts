import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';

@Processor('whatsapp-messages')
export class WhatsappMessagesProcessor extends WorkerHost {
  private readonly logger = new Logger(WhatsappMessagesProcessor.name);

  // Stub — implémentation réelle en Story 4.3 (WebhooksProcessor)
  async process(_job: Job): Promise<void> {
    throw new Error('Not implemented — Story 4.3 required');
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    // Dead-letter logging après épuisement de toutes les tentatives (NFR20)
    // data exclu intentionnellement — contient des données PII (numéros de téléphone, messages)
    if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
      this.logger.error({
        event: 'dead-letter',
        queue: 'whatsapp-messages',
        jobId: job.id,
        jobName: job.name,
        attemptsMade: job.attemptsMade,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
