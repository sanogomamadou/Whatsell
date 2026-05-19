'use client';

import dynamic from 'next/dynamic';

const NotificationPermissionPrompt = dynamic(
  () =>
    import('@/components/shared/NotificationPermissionPrompt').then(
      (m) => ({ default: m.NotificationPermissionPrompt }),
    ),
  { ssr: false },
);

export function NotificationLoader() {
  return <NotificationPermissionPrompt />;
}
