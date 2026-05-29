'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiGet } from '@/lib/api';

type SubscriptionStatusResponse = {
  data: {
    tier: string;
    isTrialExpired: boolean;
    trialEndsAt: string | null;
    ordersUsed: number;
    ordersLimit: number;
  };
};

export function TrialExpiryBanner() {
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    apiGet<SubscriptionStatusResponse>('/api/v1/subscriptions/status')
      .then((res) => {
        if (!controller.signal.aborted) {
          setIsExpired(res.data.isTrialExpired);
        }
      })
      .catch(() => {
        // Dégradation silencieuse — ne pas bloquer l'UI si l'endpoint échoue
      });

    return () => controller.abort();
  }, []);

  if (!isExpired) return null;

  return (
    <div
      role="alert"
      className="w-full bg-warning/10 border border-warning rounded-lg px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
    >
      <p className="text-sm text-text-primary">
        Votre essai Pro est terminé. Passez en Pro pour continuer à profiter de toutes les
        fonctionnalités.
      </p>
      <Link
        href="/settings"
        className="shrink-0 inline-flex items-center justify-center min-h-[36px] px-4 rounded-lg bg-warning text-white text-sm font-medium hover:bg-warning/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-warning"
      >
        Passer en Pro
      </Link>
    </div>
  );
}
