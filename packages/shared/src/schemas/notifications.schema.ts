import { z } from 'zod';

export const RegisterPushSchema = z.object({
  endpoint: z.string().url('endpoint doit être une URL valide'),
  keys: z.object({
    p256dh: z.string().min(1, 'p256dh requis'),
    auth: z.string().min(1, 'auth requis'),
  }),
  userAgent: z.string().optional(),
});

export type RegisterPushDto = z.infer<typeof RegisterPushSchema>;

export const UnregisterPushSchema = z.object({
  endpoint: z.string().url('endpoint doit être une URL valide'),
});

export type UnregisterPushDto = z.infer<typeof UnregisterPushSchema>;
