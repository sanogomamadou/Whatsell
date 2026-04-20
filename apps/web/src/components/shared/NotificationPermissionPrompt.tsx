'use client';

import React, { useEffect, useState } from 'react';
import { useNotificationPermission } from '@/hooks';

const DISMISSED_KEY = 'whatsell_push_prompt_dismissed';

export function NotificationPermissionPrompt(): React.JSX.Element | null {
  const { permission, requestPermission, isRegistering } = useNotificationPermission();
  const [dismissed, setDismissed] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setDismissed(localStorage.getItem(DISMISSED_KEY) === 'true');
  }, []);

  // Ne rien rendre côté serveur ou si déjà décidé
  if (!mounted) return null;
  if (dismissed) return null;
  if (permission !== 'default') return null;

  function handleDismiss(): void {
    localStorage.setItem(DISMISSED_KEY, 'true');
    setDismissed(true);
  }

  async function handleActivate(): Promise<void> {
    await requestPermission();
    // Le hook met à jour `permission` — si !== 'default', le composant se masque automatiquement.
    // On ne setDismissed que si l'utilisateur a explicitement refusé (pour éviter de re-demander).
    if (Notification.permission === 'denied') {
      setDismissed(true);
    }
  }

  return (
    <div
      role="dialog"
      aria-labelledby="notif-prompt-title"
      aria-describedby="notif-prompt-desc"
      className="fixed bottom-20 left-4 right-4 z-50 rounded-card bg-surface shadow-lg border border-border p-space-4 sm:left-auto sm:right-space-6 sm:w-80"
    >
      <p
        id="notif-prompt-title"
        className="text-body-md font-semibold text-text-primary mb-1"
      >
        Activez les notifications
      </p>
      <p
        id="notif-prompt-desc"
        className="text-body-sm text-text-secondary mb-space-4"
      >
        Pour ne manquer aucune commande, même quand le dashboard est fermé.
      </p>

      <div className="flex gap-space-2">
        <button
          type="button"
          onClick={handleActivate}
          disabled={isRegistering}
          className="flex-1 rounded-btn bg-primary px-space-3 py-space-2 text-button text-white hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-50 min-h-[44px]"
        >
          {isRegistering ? 'Activation…' : 'Activer'}
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-btn border border-border px-space-3 py-space-2 text-button text-text-secondary hover:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary min-h-[44px]"
        >
          Plus tard
        </button>
      </div>
    </div>
  );
}
