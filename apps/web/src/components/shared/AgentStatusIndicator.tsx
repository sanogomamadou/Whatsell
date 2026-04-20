'use client';

import { cn } from '@/lib/utils';

type AgentStatus = 'active' | 'busy' | 'warning' | 'offline' | 'paused';
type Size = 'sm' | 'md' | 'lg';

interface AgentStatusIndicatorProps {
  status: AgentStatus;
  conversationCount?: number;
  size?: Size;
  onClick?: () => void;
  className?: string;
}

const dotSize: Record<Size, string> = {
  sm: 'w-2 h-2',
  md: 'w-2.5 h-2.5',
  lg: 'w-3 h-3',
};

const textSize: Record<Size, string> = {
  sm: 'text-body-sm',
  md: 'text-body-md',
  lg: 'text-body-lg',
};

const statusConfig: Record<AgentStatus, { dotClass: string; label: (count?: number) => string; pulse: boolean }> = {
  active: {
    dotClass: 'bg-agent',
    label: () => 'Agent actif',
    pulse: true,
  },
  busy: {
    dotClass: 'bg-agent',
    label: (count) => (count !== undefined ? `En conversation (${count})` : 'En conversation'),
    pulse: false,
  },
  warning: {
    dotClass: 'bg-warning',
    label: () => 'Attention requise',
    pulse: false,
  },
  offline: {
    dotClass: 'bg-error',
    label: () => 'Hors ligne',
    pulse: false,
  },
  paused: {
    dotClass: 'bg-neutral-400',
    label: () => 'En pause',
    pulse: false,
  },
};

export function AgentStatusIndicator({
  status,
  conversationCount,
  size = 'md',
  onClick,
  className,
}: AgentStatusIndicatorProps) {
  const config = statusConfig[status];
  const label = config.label(conversationCount);
  const isOffline = status === 'offline';
  const isClickable = isOffline && onClick !== undefined;

  const Wrapper = isClickable ? 'button' : 'div';

  return (
    <Wrapper
      role={isClickable ? undefined : 'status'}
      aria-live={isOffline ? 'assertive' : 'polite'}
      aria-label={label}
      onClick={isClickable ? onClick : undefined}
      className={cn(
        'inline-flex items-center gap-2',
        isClickable && 'cursor-pointer hover:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-btn',
        className
      )}
    >
      <span
        className={cn(
          'rounded-full flex-shrink-0',
          dotSize[size],
          config.dotClass,
          config.pulse && 'animate-pulse'
        )}
      />
      <span className={cn(textSize[size], 'text-text-primary')}>{label}</span>
    </Wrapper>
  );
}
