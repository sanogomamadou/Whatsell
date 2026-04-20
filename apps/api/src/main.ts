// PREMIÈRE LIGNE OBLIGATOIRE — Sentry doit être initialisé avant NestFactory
import './instrument';

import { NestFactory } from '@nestjs/core';
import { Logger } from 'nestjs-pino';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // bufferLogs: true permet à nestjs-pino de capturer tous les logs du bootstrap
    bufferLogs: true,
  });

  // Remplace le logger NestJS par nestjs-pino (JSON structuré en production)
  app.useLogger(app.get(Logger));

  // Graceful shutdown — libère les connexions DB/Redis proprement
  app.enableShutdownHooks();

  // cookie-parser — requis pour lire req.cookies dans TenantMiddleware
  app.use(cookieParser());

  const configService = app.get(ConfigService);

  // Préfixe global : toutes les routes sont sous /api/v1
  app.setGlobalPrefix('/api/v1');

  // CORS obligatoire — l'auth repose sur des cookies httpOnly cross-origin
  app.enableCors({
    origin: configService.get<string>('frontendUrl'),
    credentials: true,
  });

  // Swagger — accessible uniquement hors production
  const nodeEnv = configService.get<string>('nodeEnv');
  if (nodeEnv !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Whatsell API')
      .setDescription('API backend Whatsell — Agent IA WhatsApp pour vendeurs')
      .setVersion('1.0')
      .addCookieAuth('access_token')
      .build();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = configService.get<number>('port') ?? 3001;
  await app.listen(port);
}

bootstrap().catch((err: unknown) => {
  console.error('Échec du démarrage du serveur :', err);
  process.exit(1);
});
