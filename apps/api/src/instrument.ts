// Ce fichier DOIT être importé en première ligne de main.ts avant tout autre import NestJS
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: process.env['SENTRY_DSN'],
  integrations: [nodeProfilingIntegration()],
  tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,
  profilesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,
  environment: process.env['NODE_ENV'] ?? 'development',
});
