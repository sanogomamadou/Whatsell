import { Injectable, InternalServerErrorException, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class QueuesService implements OnModuleInit {
  private readonly logger = new Logger(QueuesService.name);

  constructor(
    @InjectQueue('whatsapp-messages') private readonly whatsappMessagesQueue: Queue,
    @InjectQueue('stock-alerts') private readonly stockAlertsQueue: Queue,
    @InjectQueue('advisor-alerts') private readonly advisorAlertsQueue: Queue,
    @InjectQueue('trial-expiry') private readonly trialExpiryQueue: Queue,
    @InjectQueue('whatsapp-health-check') private readonly whatsappHealthCheckQueue: Queue,
  ) {}

  async onModuleInit(): Promise<void> {
    try {
      // Planifier la vérification quotidienne des essais à 6h UTC (BullMQ v5 upsertJobScheduler — idempotent)
      await this.trialExpiryQueue.upsertJobScheduler(
        'daily-trial-check',
        { pattern: '0 6 * * *', tz: 'UTC' },
        { name: 'check-trials', data: {} },
      );
      this.logger.log({ event: 'trial-expiry-scheduler-registered', pattern: '0 6 * * *' });
    } catch (err) {
      // Ne pas bloquer le démarrage si Redis est temporairement indisponible
      this.logger.error({ event: 'trial-expiry-scheduler-failed', err });
    }
  }

  async enqueueWhatsappMessage(data: Record<string, unknown>): Promise<void> {
    try {
      await this.whatsappMessagesQueue.add('process', data);
    } catch (error: unknown) {
      this.logger.error({
        event: 'enqueue-failed',
        queue: 'whatsapp-messages',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      throw new InternalServerErrorException('Queue unavailable — whatsapp-messages');
    }
  }

  async enqueueStockAlert(data: Record<string, unknown>): Promise<void> {
    try {
      await this.stockAlertsQueue.add('check', data);
    } catch (error: unknown) {
      this.logger.error({
        event: 'enqueue-failed',
        queue: 'stock-alerts',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      throw new InternalServerErrorException('Queue unavailable — stock-alerts');
    }
  }

  async enqueueAdvisorAlert(data: Record<string, unknown>): Promise<void> {
    try {
      await this.advisorAlertsQueue.add('alert', data);
    } catch (error: unknown) {
      this.logger.error({
        event: 'enqueue-failed',
        queue: 'advisor-alerts',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      throw new InternalServerErrorException('Queue unavailable — advisor-alerts');
    }
  }

  async enqueueTrialExpiry(data: Record<string, unknown>): Promise<void> {
    try {
      await this.trialExpiryQueue.add('notify', data);
    } catch (error: unknown) {
      this.logger.error({
        event: 'enqueue-failed',
        queue: 'trial-expiry',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      throw new InternalServerErrorException('Queue unavailable — trial-expiry');
    }
  }

  async enqueueHealthCheck(data: Record<string, unknown>): Promise<void> {
    try {
      await this.whatsappHealthCheckQueue.add('check', data);
    } catch (error: unknown) {
      this.logger.error({
        event: 'enqueue-failed',
        queue: 'whatsapp-health-check',
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date().toISOString(),
      });
      throw new InternalServerErrorException('Queue unavailable — whatsapp-health-check');
    }
  }
}
