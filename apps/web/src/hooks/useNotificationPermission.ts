'use client';

import { useState, useEffect, useCallback } from 'react';
import { apiClient } from '@/lib/api';

const STORAGE_KEY = 'whatsell_push_permission_asked';

type PermissionState = NotificationPermission | 'unsupported';

export interface UseNotificationPermissionReturn {
  permission: PermissionState;
  requestPermission: () => Promise<void>;
  isRegistering: boolean;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  return Uint8Array.from(rawData, (c) => c.charCodeAt(0));
}

export function useNotificationPermission(): UseNotificationPermissionReturn {
  const [permission, setPermission] = useState<PermissionState>('unsupported');
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission);

    // Écoute les changements de permission (révocation par l'utilisateur)
    if ('permissions' in navigator) {
      void navigator.permissions
        .query({ name: 'notifications' as PermissionName })
        .then((status) => {
          status.onchange = () => {
            setPermission(Notification.permission);
            // Si révoqué, signaler au backend (best-effort)
            if (Notification.permission === 'denied') {
              void unregisterCurrentSubscription();
            }
          };
        })
        .catch(() => {
          // API Permissions non supportée — pas critique
        });
    }
  }, []);

  const registerSubscription = useCallback(
    async (subscription: PushSubscription): Promise<void> => {
      const subJson = subscription.toJSON() as {
        endpoint: string;
        keys?: { p256dh?: string; auth?: string };
      };
      const response = await apiClient('/api/v1/notifications/register-push', {
        method: 'POST',
        body: JSON.stringify({
          endpoint: subJson.endpoint,
          keys: {
            p256dh: subJson.keys?.p256dh ?? '',
            auth: subJson.keys?.auth ?? '',
          },
          userAgent: navigator.userAgent,
        }),
      });
      if (!response.ok && response.status !== 204) {
        throw new Error(`Échec de l'enregistrement push : ${response.status}`);
      }
    },
    [],
  );

  const requestPermission = useCallback(async (): Promise<void> => {
    if (typeof window === 'undefined') return;
    if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

    setIsRegistering(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      localStorage.setItem(STORAGE_KEY, 'true');

      if (result !== 'granted') return;

      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) {
        console.warn('NEXT_PUBLIC_VAPID_PUBLIC_KEY non défini — push désactivé');
        return;
      }

      const registration = await Promise.race([
        navigator.serviceWorker.ready,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Service Worker non disponible après 10s')), 10000),
        ),
      ]);
      const keyBytes = urlBase64ToUint8Array(vapidKey);
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: keyBytes.buffer as ArrayBuffer,
      });

      await registerSubscription(subscription);
    } catch (err) {
      console.error('Erreur lors de l\'activation des notifications :', err);
    } finally {
      setIsRegistering(false);
    }
  }, [registerSubscription]);

  return { permission, requestPermission, isRegistering };
}

async function unregisterCurrentSubscription(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    if (!subscription) return;
    const endpoint = subscription.endpoint;
    await subscription.unsubscribe();
    await apiClient('/api/v1/notifications/unregister-push', {
      method: 'POST',
      body: JSON.stringify({ endpoint }),
    });
  } catch {
    // Best-effort — pas critique si ça échoue
  }
}
