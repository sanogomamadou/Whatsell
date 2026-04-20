import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';
import { QueuesService } from './queues.service';
import { WhatsappMessagesProcessor } from './processors/whatsapp-messages.processor';
import { StockAlertsProcessor } from './processors/stock-alerts.processor';
import { AdvisorAlertsProcessor } from './processors/advisor-alerts.processor';
import { TrialExpiryProcessor } from './processors/trial-expiry.processor';
import { WhatsappHealthCheckProcessor } from './processors/whatsapp-health-check.processor';

@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        connection: {
          url: configService.getOrThrow<string>('redis.url'),
        },
        defaultJobOptions: {
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000, // 1s → 2s → 4s
          },
          removeOnComplete: { count: 100 },
          removeOnFail: { count: 50 },
        },
      }),
    }),
    BullModule.registerQueue(
      { name: 'whatsapp-messages' },
      { name: 'stock-alerts' },
      { name: 'advisor-alerts' },
      { name: 'trial-expiry' },
      { name: 'whatsapp-health-check' },
    ),
  ],
  providers: [
    QueuesService,
    WhatsappMessagesProcessor,
    StockAlertsProcessor,
    AdvisorAlertsProcessor,
    TrialExpiryProcessor,
    WhatsappHealthCheckProcessor,
  ],
  exports: [
    QueuesService,
    // Exporter BullModule pour que d'autres modules puissent injecter les queues individuellement
    BullModule,
  ],
})
export class QueuesModule {}
