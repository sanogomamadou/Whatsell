import { z } from 'zod';

export const createProductSchema = z.object({
  name: z
    .string({ required_error: 'Le nom du produit est obligatoire' })
    .trim()
    .min(1, 'Le nom du produit est obligatoire')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  basePrice: z
    .coerce
    .number({ invalid_type_error: 'Le prix est obligatoire' })
    .int('Le prix doit être un entier en FCFA')
    .positive('Le prix doit être supérieur à 0')
    .max(100_000_000, 'Le prix ne peut pas dépasser 100 000 000 FCFA'),
  description: z
    .string()
    .trim()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .optional(),
});

export type CreateProductDto = z.infer<typeof createProductSchema>;
