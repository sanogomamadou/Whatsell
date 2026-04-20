'use client';

interface CelebrationToastContentProps {
  message: string;
  emoji?: string;
  subMessage?: string;
}

export function CelebrationToast({ message, emoji = '🎉', subMessage }: CelebrationToastContentProps) {
  return (
    <div className="flex flex-col items-center text-center gap-space-2 py-space-2">
      <span
        className="text-3xl animate-in zoom-in-50 duration-200"
        role="img"
        aria-label="Célébration"
      >
        {emoji}
      </span>
      <p className="text-heading-md font-bold text-text-primary">{message}</p>
      {subMessage && (
        <p className="text-body-sm text-text-secondary">{subMessage}</p>
      )}
    </div>
  );
}

export const CELEBRATION_TRIGGERS = {
  FIRST_ORDER: 'celebration_first_order',
  FIRST_AGENT_ACTIVATION: 'celebration_first_agent_activation',
  TENTH_ORDER: 'celebration_tenth_order',
  FIRST_VIP_CUSTOMER: 'celebration_first_vip_customer',
} as const;

export type CelebrationTrigger = (typeof CELEBRATION_TRIGGERS)[keyof typeof CELEBRATION_TRIGGERS];
