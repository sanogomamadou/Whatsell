import { Logger } from '@nestjs/common';
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { SubscriptionsService } from '../../modules/subscriptions/subscriptions.service';

@Processor('trial-expiry')
export class TrialExpiryProcessor extends WorkerHost {
  private readonly logger = new Logger(TrialExpiryProcessor.name);

  constructor(private readonly subscriptionsService: SubscriptionsService) {
    super();
  }

  async process(job: Job): Promise<void> {
    if (job.name !== 'check-trials') {
      this.logger.warn({ event: 'unknown-job', jobName: job.name });
      return;
    }
    this.logger.log({ event: 'trial-check-start', timestamp: new Date().toISOString() });
    await this.subscriptionsService.processTrialWarnings();
    await this.subscriptionsService.processTrialExpirations();
    this.logger.log({ event: 'trial-check-done', timestamp: new Date().toISOString() });
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job, error: Error): void {
    if (job.attemptsMade >= (job.opts.attempts ?? 3)) {
      this.logger.error({
        event: 'dead-letter',
        queue: 'trial-expiry',
        jobId: job.id,
        jobName: job.name,
        attemptsMade: job.attemptsMade,
        error: error.message,
        timestamp: new Date().toISOString(),
      });
    }
  }
}
