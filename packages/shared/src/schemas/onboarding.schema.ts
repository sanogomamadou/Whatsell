import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z
    .string({ required_error: 'Le nom de la boutique est obligatoire' })
    .trim()
    .min(1, 'Le nom de la boutique est obligatoire')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;

export const connectWhatsappSchema = z.object({
  whatsappBusinessAccountId: z
    .string({ required_error: "L'identifiant du compte WhatsApp Business est obligatoire" })
    .trim()
    .min(1, "L'identifiant du compte WhatsApp Business est obligatoire"),
  whatsappToken: z
    .string({ required_error: "Le token d'accès WhatsApp Business est obligatoire" })
    .trim()
    .min(1, "Le token d'accès WhatsApp Business est obligatoire"),
});

export type ConnectWhatsappDto = z.infer<typeof connectWhatsappSchema>;
