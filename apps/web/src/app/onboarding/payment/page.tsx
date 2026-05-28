'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { paymentRulesSchema, type PaymentRulesDto } from '@whatsell/shared';
import { apiPatch } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { OnboardingStep } from '@/components/shared/OnboardingStep';

type PaymentRulesResponse = {
  data: { advancePercentage: number; acceptedPaymentModes: string[] };
};

const PAYMENT_MODES = [
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'moov_money', label: 'Moov Money' },
  { value: 'cash_on_delivery', label: 'Espèces à la livraison' },
] as const;

export default function OnboardingPaymentPage() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<PaymentRulesDto>({
    resolver: zodResolver(paymentRulesSchema),
    defaultValues: {
      advancePercentage: 50,
      acceptedPaymentModes: [],
    },
  });

  const selectedModes = watch('acceptedPaymentModes');

  useEffect(() => {
    if (!saved) return;
    const id = setTimeout(() => router.push('/onboarding/activate'), 1500);
    return () => clearTimeout(id);
  }, [saved, router]);

  const toggleMode = (mode: 'orange_money' | 'moov_money' | 'cash_on_delivery') => {
    const current = selectedModes ?? [];
    if (current.includes(mode)) {
      setValue('acceptedPaymentModes', current.filter((m) => m !== mode), { shouldValidate: true });
    } else {
      setValue('acceptedPaymentModes', [...current, mode], { shouldValidate: true });
    }
  };

  const onSubmit = async (data: PaymentRulesDto) => {
    try {
      await apiPatch<PaymentRulesResponse>('/api/v1/onboarding/payment-rules', data);
      setSaved(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('400')) {
        setError('root', { message: 'Les données saisies sont invalides.' });
      } else if (message.includes('401')) {
        setError('root', { message: 'Session expirée. Veuillez vous reconnecter.' });
      } else {
        setError('root', { message: 'Une erreur est survenue. Réessayez ou contactez le support.' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-8 px-4">
      <div className="w-full max-w-sm space-y-6">
        <OnboardingStep
          stepNumber={4}
          total={5}
          title="Règles de paiement"
          status="active"
        />

        <Card className="p-6">
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-text-primary">
              Configurez vos règles de paiement
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Définissez l&apos;avance demandée et les modes acceptés.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
            {/* Pourcentage d'avance */}
            <div className="space-y-1">
              <label htmlFor="advancePercentage" className="text-sm font-medium text-text-primary">
                Pourcentage d&apos;avance{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Input
                  id="advancePercentage"
                  type="number"
                  min={0}
                  max={100}
                  step={1}
                  placeholder="50"
                  disabled={isSubmitting || saved}
                  className={`h-12 pr-8 ${errors.advancePercentage ? 'border-destructive' : ''}`}
                  {...register('advancePercentage', { valueAsNumber: true })}
                  aria-describedby={errors.advancePercentage ? 'advance-error' : undefined}
                  aria-required="true"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-text-muted pointer-events-none">
                  %
                </span>
              </div>
              {errors.advancePercentage && (
                <p id="advance-error" className="text-sm text-destructive" role="alert">
                  {errors.advancePercentage.message}
                </p>
              )}
            </div>

            {/* Modes de paiement acceptés */}
            <fieldset className="space-y-3">
              <legend className="text-sm font-medium text-text-primary">
                Modes de paiement acceptés{' '}
                <span aria-hidden="true" className="text-destructive">*</span>
              </legend>
              <div className="space-y-2">
                {PAYMENT_MODES.map(({ value, label }) => (
                  <label
                    key={value}
                    className="flex items-center gap-3 cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      value={value}
                      checked={selectedModes?.includes(value) ?? false}
                      onChange={() => toggleMode(value)}
                      disabled={isSubmitting || saved}
                      className="h-4 w-4 rounded border-neutral-300 accent-primary"
                      aria-label={label}
                    />
                    <span className="text-sm text-text-primary">{label}</span>
                  </label>
                ))}
              </div>
              {errors.acceptedPaymentModes && (
                <p className="text-sm text-destructive" role="alert">
                  {errors.acceptedPaymentModes.message}
                </p>
              )}
            </fieldset>

            {/* Badge succès */}
            {saved && (
              <div
                className="flex items-center gap-2 text-sm font-medium text-success bg-success/10 border border-success rounded-lg px-4 py-2.5"
                role="status"
                aria-live="polite"
              >
                <span>✓ Enregistré</span>
                <span className="text-text-muted">— Redirection en cours…</span>
              </div>
            )}

            {/* Erreur globale */}
            {errors.root && (
              <p role="alert" className="text-sm text-destructive">
                {errors.root.message}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-12"
              disabled={isSubmitting || saved}
            >
              {isSubmitting ? 'Enregistrement…' : 'Continuer'}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
