import { z } from 'zod';

// Schéma d'inscription — sera utilisé dans Story 1.3 (Auth JWT)
export const registerSchema = z.object({
  // toLowerCase().trim() : normalisation avant comparaison en base
  email: z.string().email('Email invalide').toLowerCase().trim(),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    // max 128 : protection contre les attaques DoS via bcrypt sur longs inputs
    .max(128, 'Le mot de passe ne peut pas dépasser 128 caractères'),
});

export type RegisterDto = z.infer<typeof registerSchema>;

// Schéma de connexion
export const loginSchema = z.object({
  email: z.string().email('Email invalide').toLowerCase().trim(),
  password: z.string().min(1, 'Mot de passe requis'),
});

export type LoginDto = z.infer<typeof loginSchema>;
