import * as crypto from 'node:crypto';
import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Subscription } from 'rxjs';
import * as webpush from 'web-push';
import { RegisterPushDto, UnregisterPushDto } from '@whatsell/shared';
import { AgentEventType } from '@whatsell/shared';
import { EventsService } from '../events/events.service';
import { NotificationsRepository } from './notifications.repository';
import {
  PUSH_TRIGGER_EVENTS,
  buildPushPayload,
} from './notifications.types';

@Injectable()
export class NotificationsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(NotificationsService.name);
  private vapidConfigured = false;
  private eventSubscription: Subscription | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly notificationsRepository: NotificationsRepository,
    private readonly eventsService: EventsService,
  ) {}

  onModuleInit(): void {
    const publicKey = this.configService.get<string>('webPush.vapidPublicKey', '');
    const privateKey = this.configService.get<string>('webPush.vapidPrivateKey', '');
    const subject = this.configService.get<string>('webPush.vapidSubject', '');

    if (publicKey && privateKey) {
      if (!subject) {
        this.logger.error('VAPID_SUBJECT manquant — Web Push non activé (subject obligatoire)');
      } else {
        webpush.setVapidDetails(subject, publicKey, privateKey);
        this.vapidConfigured = true;
      }
    } else {
      this.logger.warn('VAPID keys non configurées — Web Push désactivé');
    }

    this.eventSubscription = this.eventsService.subscribeToAll().subscribe((internalEvent) => {
      const eventType = internalEvent.event as AgentEventType;
      if (PUSH_TRIGGER_EVENTS.includes(eventType)) {
        void this.sendPushToTenant(
          internalEvent.tenantId,
          eventType,
          internalEvent.payload,
        );
      }
    });
  }

  onModuleDestroy(): void {
    this.eventSubscription?.unsubscribe();
  }

  async registerPush(
    tenantId: string,
    userId: string,
    dto: RegisterPushDto,
  ): Promise<void> {
    await this.notificationsRepository.storeToken(
      tenantId,
      userId,
      dto.endpoint,
      dto.keys,
      dto.userAgent,
    );
  }

  async unregisterPush(tenantId: string, dto: UnregisterPushDto): Promise<void> {
    await this.notificationsRepository.deleteToken(tenantId, dto.endpoint);
  }

  async sendPushToTenant(
    tenantId: string,
    event: AgentEventType,
    payload: unknown,
  ): Promise<void> {
    if (!this.vapidConfigured) return;

    const tokens = await this.notificationsRepository.getTokensByTenant(tenantId);
    if (tokens.length === 0) return;

    const pushPayload = buildPushPayload(event, payload);
    const payloadString = JSON.stringify(pushPayload);

    await Promise.all(
      tokens.map(async (token) => {
        try {
          await webpush.sendNotification(
            { endpoint: token.endpoint, keys: token.keys },
            payloadString,
          );
        } catch (err: unknown) {
          const status = (err as { statusCode?: number }).statusCode;
          if (status === 410 || status === 404) {
            // Token révoqué — supprimer silencieusement
            const endpointHash = crypto
              .createHash('sha256')
              .update(token.endpoint)
              .digest('hex');
            await this.notificationsRepository.deleteByEndpointHash(
              tenantId,
              endpointHash,
            );
          } else {
            this.logger.warn({ err, tenantId, event }, 'Web Push failed');
          }
        }
      }),
    );
  }
}
