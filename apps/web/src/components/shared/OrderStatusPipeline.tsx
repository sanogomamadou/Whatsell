'use client';

import { Clock, CheckCircle, Package, Truck, CheckCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

export type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'shipped' | 'delivered';

interface Step {
  status: OrderStatus;
  label: string;
  Icon: React.ComponentType<{ size?: number; className?: string; 'aria-hidden'?: boolean | 'true' | 'false' }>;
  colorClass: string;
  bgClass: string;
}

const STEPS: Step[] = [
  { status: 'pending',   label: 'En attente',       Icon: Clock,       colorClass: 'text-status-pending',   bgClass: 'bg-status-pending' },
  { status: 'confirmed', label: 'Confirmée',         Icon: CheckCircle, colorClass: 'text-status-confirmed', bgClass: 'bg-status-confirmed' },
  { status: 'preparing', label: 'En préparation',    Icon: Package,     colorClass: 'text-status-preparing', bgClass: 'bg-status-preparing' },
  { status: 'shipped',   label: 'Expédiée',          Icon: Truck,       colorClass: 'text-status-shipped',   bgClass: 'bg-status-shipped' },
  { status: 'delivered', label: 'Livrée',            Icon: CheckCheck,  colorClass: 'text-status-delivered', bgClass: 'bg-status-delivered' },
];

const STATUS_ORDER: OrderStatus[] = ['pending', 'confirmed', 'preparing', 'shipped', 'delivered'];

interface OrderStatusPipelineProps {
  currentStatus: OrderStatus;
  variant?: 'compact' | 'full';
  onAdvance?: (next: OrderStatus) => void;
  className?: string;
}

export function OrderStatusPipeline({
  currentStatus,
  variant = 'full',
  onAdvance,
  className,
}: OrderStatusPipelineProps) {
  const currentIndex = STATUS_ORDER.indexOf(currentStatus);
  if (currentIndex === -1) return null;
  const nextStatus = currentIndex < STATUS_ORDER.length - 1 ? STATUS_ORDER[currentIndex + 1] : null;
  const iconSize = variant === 'compact' ? 16 : 20;

  return (
    <div
      className={cn('overflow-x-auto', className)}
      role="list"
      aria-label="Pipeline de statut de commande"
    >
      <div className={cn('flex items-center', variant === 'compact' ? 'gap-1' : 'gap-2 min-w-max')}>
        {STEPS.map((step, index) => {
          const stepIndex = STATUS_ORDER.indexOf(step.status);
          const isPast = stepIndex < currentIndex;
          const isActive = stepIndex === currentIndex;
          const isFuture = stepIndex > currentIndex;
          const isNext = step.status === nextStatus && onAdvance !== undefined;

          const nodeLabel = step.label;

          return (
            <div key={step.status} className="flex items-center" role="listitem">
              {/* Connecteur */}
              {index > 0 && (
                <div
                  className={cn(
                    'flex-shrink-0',
                    variant === 'compact' ? 'w-4 h-0.5' : 'w-6 h-0.5',
                    isPast || isActive ? step.bgClass : 'bg-neutral-200'
                  )}
                  aria-hidden="true"
                />
              )}

              {/* Nœud */}
              <div className="flex flex-col items-center gap-1">
                {isNext ? (
                  <button
                    onClick={() => onAdvance(step.status)}
                    className={cn(
                      'rounded-full p-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary transition-opacity hover:opacity-80',
                      isFuture && 'text-neutral-300',
                      isNext && step.colorClass
                    )}
                    aria-label={`Avancer au statut : ${nodeLabel}`}
                  >
                    <step.Icon
                      size={iconSize}
                      aria-hidden
                    />
                    <span className="sr-only">{nodeLabel}</span>
                  </button>
                ) : (
                  <div
                    className={cn(
                      'rounded-full p-1',
                      isPast && step.colorClass,
                      isActive && cn(step.colorClass, 'animate-pulse'),
                      isFuture && 'text-neutral-300'
                    )}
                    aria-label={isActive ? `Statut actuel : ${nodeLabel}` : nodeLabel}
                  >
                    <step.Icon
                      size={iconSize}
                      aria-hidden
                    />
                    <span className="sr-only">{nodeLabel}</span>
                  </div>
                )}

                {/* Label — uniquement en mode full */}
                {variant === 'full' && (
                  <span
                    className={cn(
                      'text-body-sm text-center whitespace-nowrap',
                      isPast && step.colorClass,
                      isActive && step.colorClass,
                      isFuture && 'text-neutral-300'
                    )}
                  >
                    {nodeLabel}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
