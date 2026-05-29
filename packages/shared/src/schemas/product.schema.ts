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

export const updateProductSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Le nom ne peut pas être vide')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .optional(),
  basePrice: z
    .coerce
    .number({ invalid_type_error: 'Le prix doit être un entier en FCFA' })
    .int('Le prix doit être un entier en FCFA')
    .positive('Le prix doit être supérieur à 0')
    .max(100_000_000, 'Le prix ne peut pas dépasser 100 000 000 FCFA')
    .optional(),
  description: z
    .string()
    .trim()
    .max(500, 'La description ne peut pas dépasser 500 caractères')
    .nullable()
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Au moins un champ doit être fourni' },
);

export type UpdateProductDto = z.infer<typeof updateProductSchema>;

// Clé de variante libre — ex: "Standard", "Taille:L,Couleur:Rouge", "Volume:500ml"
export const variantKeySchema = z.string().trim().min(1).max(200);

export const createStockLevelSchema = z.object({
  variantKey: variantKeySchema,
  quantity: z.coerce.number().int().min(0, 'Le stock ne peut pas être négatif').max(2_147_483_647, 'Quantité trop élevée'),
});
export type CreateStockLevelDto = z.infer<typeof createStockLevelSchema>;

export const updateStockLevelSchema = z.object({
  quantity: z.coerce.number().int().min(0, 'Le stock ne peut pas être négatif').max(2_147_483_647, 'Quantité trop élevée'),
});
export type UpdateStockLevelDto = z.infer<typeof updateStockLevelSchema>;

export const updateAlertThresholdSchema = z.object({
  alertThreshold: z.coerce.number().int().min(0).max(9999),
});
export type UpdateAlertThresholdDto = z.infer<typeof updateAlertThresholdSchema>;
