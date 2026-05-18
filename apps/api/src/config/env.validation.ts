import { z } from 'zod';

// Validation Zod des variables d'environnement critiques au démarrage
// Tout échec ici provoque un crash immédiat avec un message explicite
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  PORT: z.coerce.number().int().positive().default(3001),

  FRONTEND_URL: z.string().url('FRONTEND_URL doit être une URL valide'),

  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL est requis')
    .startsWith('postgresql', 'DATABASE_URL doit commencer par postgresql'),

  DIRECT_DATABASE_URL: z
    .string()
    .min(1, 'DIRECT_DATABASE_URL est requis')
    .startsWith('postgresql', 'DIRECT_DATABASE_URL doit commencer par postgresql'),

  // redis:// (local) ou rediss:// (Upstash TLS) — .url() de Zod ne supporte pas rediss://
  REDIS_URL: z
    .string()
    .min(1, 'REDIS_URL est requis')
    .refine(
      (val) => val.startsWith('redis://') || val.startsWith('rediss://'),
      'REDIS_URL doit commencer par redis:// ou rediss://',
    ),

  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET doit contenir au moins 32 caractères'),

  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  ENCRYPTION_KEY: z
    .string()
    .length(32, "ENCRYPTION_KEY doit être exactement 32 caractères (AES-256)"),

  SENTRY_DSN: z.preprocess(
    (val) => (val === '' ? undefined : val),
    z.string().url('SENTRY_DSN doit être une URL valide').optional(),
  ),

  R2_ACCOUNT_ID: z.string().optional().default(''),
  R2_ACCESS_KEY_ID: z.string().optional().default(''),
  R2_SECRET_ACCESS_KEY: z.string().optional().default(''),
  R2_BUCKET_RECEIPTS: z.string().optional().default('whatsell-receipts'),
  R2_BUCKET_LOGOS: z.string().optional().default('whatsell-logos'),
  R2_BUCKET_INVOICES: z.string().optional().default('whatsell-invoices'),

  // Web Push Notifications (VAPID) — optionnel, requis si notifications activées
  VAPID_PUBLIC_KEY: z.string().optional().default(''),
  VAPID_PRIVATE_KEY: z.string().optional().default(''),
  VAPID_SUBJECT: z.string().optional().default('mailto:admin@whatsell.io'),
});

export type EnvConfig = z.infer<typeof envSchema>;

export function validateEnv(config: Record<string, unknown>): EnvConfig {
  const result = envSchema.safeParse(config);

  if (!result.success) {
    const errors = result.error.issues
      .map((issue) => `  • ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(
      `Configuration invalide — arrêt du serveur :\n${errors}\n` +
        `Vérifiez votre fichier .env`,
    );
  }

  return result.data;
}
