import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { randomUUID } from 'crypto';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import configuration from './config/configuration';
import { validateEnv } from './config/env.validation';
import { PrismaModule } from './prisma/prisma.module';
import { CommonModule } from './common/common.module';
import { TenantMiddleware } from './common/middleware/tenant.middleware';
import { AllExceptionsFilter } from './common/filters';
import { ResponseWrapperInterceptor } from './common/interceptors';
import { JwtAuthGuard, RolesGuard } from './common/guards';
import { AuthModule } from './modules/auth/auth.module';
import { QueuesModule } from './queues/queues.module';
import { EventsModule } from './modules/events/events.module';
import { NotificationsModule } from './modules/notifications/notifications.module';

@Module({
  imports: [
    // Configuration globale — charge .env et expose ConfigService dans toute l'app
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
      validate: validateEnv,
    }),

    // Logging structuré JSON via nestjs-pino
    // Champs systématiques : tenantId, requestId, service, level, timestamp
    LoggerModule.forRootAsync({
      useFactory: () => ({
        pinoHttp: {
          customProps: (req) => {
            const r = req as unknown as Record<string, unknown>;
            return {
              service: 'whatsell-api',
              tenantId: (r['tenantId'] as string | undefined) ?? 'anonymous',
              requestId: r['id'] != null ? String(r['id']) : undefined,
            };
          },
          // timestamp ISO 8601 — le champ pino natif est "time" (epoch), on le renomme en "timestamp"
          timestamp: () => `,"timestamp":"${new Date().toISOString()}"`,
          genReqId: () => randomUUID(),
          transport:
            process.env['NODE_ENV'] !== 'production'
              ? { target: 'pino-pretty', options: { colorize: true } }
              : undefined,
          serializers: {
            req(req: { method: string; url: string }) {
              return { method: req.method, url: req.url };
            },
          },
        },
      }),
    }),

    // Rate limiting global — 100 req/min par défaut
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // PrismaModule global — injectable partout sans re-import
    PrismaModule,

    // CommonModule global — TenantContextService + guards/filters/interceptors
    CommonModule,

    // Modules domaines
    AuthModule,
    QueuesModule,
    EventsModule,
    NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,

    // Filtre global — format unifié pour toutes les exceptions
    { provide: APP_FILTER, useClass: AllExceptionsFilter },

    // Intercepteur global — enveloppe toutes les réponses dans { data: ... }
    { provide: APP_INTERCEPTOR, useClass: ResponseWrapperInterceptor },

    // Guards globaux — ordre critique : throttling en premier (bloquer avant logique JWT),
    // puis auth, puis rôles
    { provide: APP_GUARD, useClass: ThrottlerGuard }, // ← ordre 1 : rate limit avant tout
    { provide: APP_GUARD, useClass: JwtAuthGuard },   // ← ordre 2 : authentification
    { provide: APP_GUARD, useClass: RolesGuard },     // ← ordre 3 : autorisation par rôle
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        // Routes auth exclues — pas de token lors de la connexion/inscription
        { path: 'api/v1/auth/login', method: RequestMethod.POST },
        { path: 'api/v1/auth/register', method: RequestMethod.POST },
        { path: 'api/v1/auth/refresh', method: RequestMethod.POST },
        // Health check public
        { path: 'api/v1/health', method: RequestMethod.GET },
      )
      .forRoutes({ path: 'api/v1/*path', method: RequestMethod.ALL });
  }
}
