'use client';

import { CheckCircle, Circle, Lock } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

type StepStatus = 'completed' | 'active' | 'upcoming' | 'locked';

interface OnboardingStepProps {
  stepNumber: number;
  total: number;
  title: string;
  status: StepStatus;
  onClick?: () => void;
  className?: string;
}

const statusConfig: Record<
  StepStatus,
  { border: string; bg: string; numberBg: string; numberText: string; icon: React.ReactNode; textColor: string }
> = {
  completed: {
    border: 'border-success',
    bg: 'bg-success/5',
    numberBg: 'bg-success',
    numberText: 'text-white',
    icon: <CheckCircle size={20} className="text-success" aria-hidden />,
    textColor: 'text-text-primary',
  },
  active: {
    border: 'border-primary',
    bg: 'bg-white',
    numberBg: 'bg-primary',
    numberText: 'text-white',
    icon: <Circle size={20} className="text-primary" aria-hidden />,
    textColor: 'text-text-primary',
  },
  upcoming: {
    border: 'border-border',
    bg: 'bg-neutral-50',
    numberBg: 'bg-neutral-200',
    numberText: 'text-text-muted',
    icon: <Circle size={20} className="text-neutral-300" aria-hidden />,
    textColor: 'text-text-muted',
  },
  locked: {
    border: 'border-border',
    bg: 'bg-neutral-50',
    numberBg: 'bg-neutral-200',
    numberText: 'text-text-muted',
    icon: <Lock size={20} className="text-neutral-300" aria-hidden />,
    textColor: 'text-text-muted',
  },
};

export function OnboardingStep({
  stepNumber,
  total,
  title,
  status,
  onClick,
  className,
}: OnboardingStepProps) {
  const config = statusConfig[status];
  const progressValue = Math.round((stepNumber / (total || 1)) * 100);
  const isClickable = status === 'completed' && onClick !== undefined;
  const isDisabled = status === 'locked' || status === 'upcoming';

  return (
    <Card
      className={cn(
        'border-2 p-space-4 transition-colors',
        config.border,
        config.bg,
        isClickable && 'cursor-pointer hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:rounded-card',
        isDisabled && 'opacity-60 cursor-not-allowed',
        className
      )}
      onClick={isClickable ? onClick : undefined}
      tabIndex={isClickable ? 0 : undefined}
      role={isClickable ? 'button' : undefined}
      aria-label={isClickable ? `Revenir à l'étape ${stepNumber} : ${title}` : undefined}
      onKeyDown={
        isClickable
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      <div className="flex items-center gap-space-3 mb-space-3">
        {/* Numéro dans cercle */}
        <div
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0',
            config.numberBg,
            config.numberText
          )}
          aria-hidden="true"
        >
          <span className="text-label font-semibold">{stepNumber}</span>
        </div>

        {/* Titre + icône statut */}
        <div className="flex-1 flex items-center justify-between gap-2">
          <span className={cn('text-body-lg font-medium', config.textColor)}>{title}</span>
          {config.icon}
        </div>
      </div>

      {/* Barre de progression */}
      <Progress
        value={progressValue}
        className="h-1.5"
        aria-label={`Progression : étape ${stepNumber} sur ${total}`}
      />
      <p className="text-body-sm text-text-muted mt-1">
        Étape {stepNumber}/{total}
      </p>
    </Card>
  );
}
