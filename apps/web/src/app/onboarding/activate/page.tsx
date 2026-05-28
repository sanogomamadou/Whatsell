'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiGet, apiPost } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OnboardingStep } from '@/components/shared/OnboardingStep';
import { useCelebrationToast } from '@/hooks/useCelebrationToast';

type OnboardingSummaryResponse = {
  data: {
    shopName: string;
    whatsappNumber: string | null;
    productCount: number;
    advancePercentage: number;
    acceptedPaymentModes: string[];
  };
};

type ActivateResponse = {
  data: { activatedAt: string };
};

const PAYMENT_MODE_LABELS: Record<string, string> = {
  orange_money: 'Orange Money',
  moov_money: 'Moov Money',
  cash_on_delivery: 'Espèces à la livraison',
};

export default function OnboardingActivatePage() {
  const router = useRouter();
  const { triggerCelebration, CELEBRATION_TRIGGERS } = useCelebrationToast();

  const [summary, setSummary] = useState<OnboardingSummaryResponse['data'] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [activating, setActivating] = useState(false);
  const [activateError, setActivateError] = useState<string | null>(null);
  const [activated, setActivated] = useState(false);

  const loadSummary = async () => {
    setLoadError(null);
    try {
      const res = await apiGet<OnboardingSummaryResponse>('/api/v1/onboarding/summary');
      setSummary(res.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('401')) {
        setLoadError('Session expirée. Veuillez vous reconnecter.');
      } else {
        setLoadError('Impossible de charger le résumé. Réessayez.');
      }
    }
  };

  useEffect(() => {
    void loadSummary();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!activated) return;
    const id = setTimeout(() => router.push('/'), 3000);
    return () => clearTimeout(id);
  }, [activated, router]);

  const handleActivate = async () => {
    setActivateError(null);
    setActivating(true);
    try {
      await apiPost<ActivateResponse>('/api/v1/onboarding/activate', {});
      triggerCelebration('Votre agent est actif !', {
        emoji: '🚀',
        subMessage: 'Prêt à vendre pour vous 24h/24',
        triggerKey: CELEBRATION_TRIGGERS.FIRST_AGENT_ACTIVATION,
      });
      setActivated(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : '';
      if (message.includes('401')) {
        setActivateError('Session expirée. Veuillez vous reconnecter.');
      } else if (message.includes('403')) {
        setActivateError("Vous n'avez pas les droits pour cette action.");
      } else {
        setActivateError("Une erreur est survenue. Réessayez ou contactez le support.");
      }
    } finally {
      setActivating(false);
    }
  };

  if (activated) {
    return (
      <div
        className="min-h-screen bg-primary flex flex-col items-center justify-center px-4"
        role="status"
        aria-live="polite"
      >
        <div className="text-center space-y-4">
          <span className="text-6xl" role="img" aria-label="Fusée">🚀</span>
          <h1 className="text-2xl font-bold text-white">Votre agent est actif et prêt à vendre pour vous !</h1>
          <p className="text-white/60 text-xs mt-6">Redirection en cours…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-start pt-8 px-4">
      <div className="w-full max-w-sm space-y-6">
        <OnboardingStep
          stepNumber={5}
          total={5}
          title="Activation de l'agent"
          status="active"
        />

        <Card className="p-6 space-y-5">
          <div>
            <h1 className="text-xl font-semibold text-text-primary">Résumé de votre boutique</h1>
            <p className="text-sm text-text-muted mt-1">
              Vérifiez vos informations avant d&apos;activer votre agent.
            </p>
          </div>

          {/* Loading skeleton */}
          {!summary && !loadError && (
            <div className="space-y-3 animate-pulse" aria-label="Chargement…">
              <div className="h-4 bg-neutral-200 rounded w-3/4" />
              <div className="h-4 bg-neutral-200 rounded w-1/2" />
              <div className="h-4 bg-neutral-200 rounded w-2/3" />
              <div className="h-4 bg-neutral-200 rounded w-1/2" />
            </div>
          )}

          {/* Load error */}
          {loadError && (
            <div className="space-y-3">
              <p role="alert" className="text-sm text-destructive">{loadError}</p>
              <Button variant="outline" className="w-full h-10" onClick={() => void loadSummary()}>
                Réessayer
              </Button>
            </div>
          )}

          {/* Summary */}
          {summary && (
            <dl className="space-y-3 text-sm">
              <div className="flex justify-between items-center">
                <dt className="text-text-muted">Boutique</dt>
                <dd className="font-medium text-text-primary">{summary.shopName}</dd>
              </div>

              <div className="flex justify-between items-center">
                <dt className="text-text-muted">WhatsApp</dt>
                <dd>
                  {summary.whatsappNumber ? (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success border border-success/30">
                      ✓ Connecté
                    </span>
                  ) : (
                    <span className="text-text-muted italic">Non connecté</span>
                  )}
                </dd>
              </div>

              <div className="flex justify-between items-center">
                <dt className="text-text-muted">Produits</dt>
                <dd className="font-medium text-text-primary">{summary.productCount}</dd>
              </div>

              <div className="flex justify-between items-center">
                <dt className="text-text-muted">Avance demandée</dt>
                <dd className="font-medium text-text-primary">{summary.advancePercentage} %</dd>
              </div>

              <div>
                <dt className="text-text-muted mb-1.5">Modes de paiement</dt>
                <dd className="flex flex-wrap gap-1.5">
                  {summary.acceptedPaymentModes.map((mode) => (
                    <span
                      key={mode}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                    >
                      {PAYMENT_MODE_LABELS[mode] ?? mode}
                    </span>
                  ))}
                </dd>
              </div>
            </dl>
          )}
        </Card>

        {/* Activation error */}
        {activateError && (
          <p role="alert" className="text-sm text-destructive text-center">
            {activateError}
          </p>
        )}

        <Button
          className="w-full h-12"
          onClick={() => void handleActivate()}
          disabled={activating || !summary}
        >
          {activating ? 'Activation en cours…' : 'Activer mon agent'}
        </Button>
      </div>
    </div>
  );
}
