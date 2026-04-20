// Toutes les variables d'environnement centralisées ici
// JAMAIS de process.env.X directement dans un service — utiliser ConfigService
export default () => {
  const rawPort = process.env['PORT'] ?? '3001';
  const parsedPort = parseInt(rawPort, 10);
  const port = Number.isNaN(parsedPort) ? 3001 : parsedPort;

  return {
    nodeEnv: process.env['NODE_ENV'] ?? 'development',
    port,
    frontendUrl: process.env['FRONTEND_URL'] ?? 'http://localhost:3000',

    database: {
      url: process.env['DATABASE_URL'] ?? '',
    },

    redis: {
      url: process.env['REDIS_URL'] ?? 'redis://localhost:6379',
    },

    jwt: {
      secret: process.env['JWT_SECRET'] ?? 'dev-secret-change-in-production',
      accessExpiresIn: process.env['JWT_ACCESS_EXPIRES_IN'] ?? '15m',
      refreshExpiresIn: process.env['JWT_REFRESH_EXPIRES_IN'] ?? '7d',
    },

    r2: {
      accountId: process.env['R2_ACCOUNT_ID'] ?? '',
      accessKeyId: process.env['R2_ACCESS_KEY_ID'] ?? '',
      secretAccessKey: process.env['R2_SECRET_ACCESS_KEY'] ?? '',
      bucketReceipts: process.env['R2_BUCKET_RECEIPTS'] ?? 'whatsell-receipts',
      bucketLogos: process.env['R2_BUCKET_LOGOS'] ?? 'whatsell-logos',
      bucketInvoices: process.env['R2_BUCKET_INVOICES'] ?? 'whatsell-invoices',
    },

    sentry: {
      dsn: process.env['SENTRY_DSN'] ?? '',
    },

    encryption: {
      key: process.env['ENCRYPTION_KEY'] ?? '',
    },

    twilio: {
      accountSid: process.env['TWILIO_ACCOUNT_SID'] ?? '',
      authToken: process.env['TWILIO_AUTH_TOKEN'] ?? '',
      whatsappNumber: process.env['TWILIO_WHATSAPP_NUMBER'] ?? '',
    },

    llm: {
      apiKey: process.env['LLM_API_KEY'] ?? '',
      model: process.env['LLM_MODEL'] ?? 'claude-sonnet-4-6',
    },

    webPush: {
      vapidPublicKey: process.env['VAPID_PUBLIC_KEY'] ?? '',
      vapidPrivateKey: process.env['VAPID_PRIVATE_KEY'] ?? '',
      vapidSubject: process.env['VAPID_SUBJECT'] ?? 'mailto:admin@whatsell.io',
    },
  };
};
