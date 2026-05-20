'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { connectWhatsappSchema, type ConnectWhatsappDto } from '@whatsell/shared';
import { apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { OnboardingStep } from '@/components/shared/OnboardingStep';

type ConnectResponse = { data: { whatsappBusinessAccountId: string } };

export default function OnboardingWhatsappPage() {
  const router = useRouter();
  const [connected, setConnected] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<ConnectWhatsappDto>({ resolver: zodResolver(connectWhatsappSchema) });

  useEffect(() => {
    if (!connected) return;
    const id = setTimeout(() => router.push('/onboarding/catalogue'), 1500);
    return () => clearTimeout(id);
  }, [connected, router]);

  const onSubmit = async (data: ConnectWhatsappDto) => {
    try {
      await apiPost<ConnectResponse>('/api/v1/onboarding/whatsapp-connect', data);
      setConnected(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('400')) {
        setError('root', { message: 'Les informations saisies sont invalides. Vérifiez votre identifiant et votre token.' });
      } else if (message.includes('401')) {
        setError('root', { message: 'Session expirée. Veuillez vous reconnecter.' });
      } else {
        setError('root', { message: 'Une erreur est survenue. Vérifiez vos informations ou contactez le support.' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-8 px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Indicateur d'étape */}
        <OnboardingStep
          stepNumber={2}
          total={5}
          title="Connexion WhatsApp Business"
          status="active"
        />

        {/* Tutoriel vidéo */}
        <Card className="p-4">
          <p className="text-sm font-medium text-text-primary mb-3">
            Guide de connexion Meta Business Manager
          </p>
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-neutral-100">
            <iframe
              src="https://www.youtube.com/embed/JY9SDMwbuyc"
              title="Guide de connexion WhatsApp Business"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope"
              allowFullScreen
              className="absolute inset-0 w-full h-full"
            />
          </div>
        </Card>

        {/* Formulaire */}
        <Card className="p-6">
          <div className="mb-5">
            <h1 className="text-xl font-semibold text-text-primary">
              Connectez votre WhatsApp Business
            </h1>
            <p className="text-sm text-text-muted mt-1">
              Récupérez ces informations depuis Meta Business Manager.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {/* Champ WABA ID */}
            <div className="space-y-1">
              <label htmlFor="whatsappBusinessAccountId" className="text-sm font-medium text-text-primary">
                WhatsApp Business Account ID <span aria-hidden="true" className="text-destructive">*</span>
              </label>
              <Input
                id="whatsappBusinessAccountId"
                type="text"
                placeholder="Ex : 123456789012345"
                autoComplete="off"
                disabled={isSubmitting || connected}
                className={`h-12 ${errors.whatsappBusinessAccountId ? 'border-destructive' : ''}`}
                {...register('whatsappBusinessAccountId')}
                aria-describedby={errors.whatsappBusinessAccountId ? 'waba-error' : undefined}
                aria-required="true"
              />
              {errors.whatsappBusinessAccountId && (
                <p id="waba-error" className="text-sm text-destructive" role="alert">
                  {errors.whatsappBusinessAccountId.message}
                </p>
              )}
            </div>

            {/* Champ token */}
            <div className="space-y-1">
              <label htmlFor="whatsappToken" className="text-sm font-medium text-text-primary">
                Token d&apos;accès <span aria-hidden="true" className="text-destructive">*</span>
              </label>
              <Input
                id="whatsappToken"
                type="password"
                placeholder="Votre token d'accès permanent"
                autoComplete="new-password"
                disabled={isSubmitting || connected}
                className={`h-12 ${errors.whatsappToken ? 'border-destructive' : ''}`}
                {...register('whatsappToken')}
                aria-describedby={errors.whatsappToken ? 'token-error' : undefined}
                aria-required="true"
              />
              {errors.whatsappToken && (
                <p id="token-error" className="text-sm text-destructive" role="alert">
                  {errors.whatsappToken.message}
                </p>
              )}
            </div>

            {/* Badge succès */}
            {connected && (
              <div
                className="flex items-center gap-2 text-sm font-medium text-success bg-success/10 border border-success rounded-lg px-4 py-2.5"
                role="status"
                aria-live="polite"
              >
                <span>✓ Connecté</span>
                <span className="text-text-muted">— Redirection en cours…</span>
              </div>
            )}

            {/* Erreur globale */}
            {errors.root && (
              <p role="alert" className="text-sm text-destructive">
                {errors.root.message}
              </p>
            )}

            {/* Bouton soumission */}
            <Button
              type="submit"
              className="w-full h-12"
              disabled={isSubmitting || connected}
            >
              {isSubmitting ? 'Connexion en cours…' : 'Connecter'}
            </Button>
          </form>
        </Card>

        {/* Bouton SOS — visible en permanence */}
        <div className="flex justify-center pb-8">
          <a
            href="mailto:support@whatsell.io"
            className="inline-flex items-center gap-2 text-sm font-medium text-destructive border border-destructive rounded-lg px-4 py-2.5 hover:bg-destructive/5 transition-colors min-h-[44px]"
          >
            SOS — Contacter le support
          </a>
        </div>
      </div>
    </div>
  );
}
