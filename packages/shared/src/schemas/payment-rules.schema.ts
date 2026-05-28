import { z } from 'zod';

const PAYMENT_MODES = ['orange_money', 'moov_money', 'cash_on_delivery'] as const;

export const paymentRulesSchema = z.object({
  advancePercentage: z.preprocess(
    (val) => {
      const n = Number(val);
      return Number.isNaN(n) ? undefined : n;
    },
    z.number({
      required_error: "Le pourcentage d'avance est obligatoire",
      invalid_type_error: "Le pourcentage d'avance est obligatoire",
    })
      .int('Le pourcentage doit être un entier')
      .min(0, 'Le pourcentage ne peut pas être négatif')
      .max(100, 'Le pourcentage ne peut pas dépasser 100'),
  ),
  acceptedPaymentModes: z
    .array(z.enum(PAYMENT_MODES), {
      required_error: 'Sélectionnez au moins un mode de paiement',
    })
    .min(1, 'Sélectionnez au moins un mode de paiement')
    .refine(
      (modes) => new Set(modes).size === modes.length,
      'Les modes de paiement ne doivent pas contenir de doublons',
    ),
});

export type PaymentRulesDto = z.infer<typeof paymentRulesSchema>;
export type PaymentMode = (typeof PAYMENT_MODES)[number];
