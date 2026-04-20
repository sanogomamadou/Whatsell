'use client';

import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type BubbleType = 'client' | 'agent' | 'vendor';

interface ConversationBubbleProps {
  type: BubbleType;
  message: string;
  timestamp: Date;
  imageUrl?: string;
  isLoading?: boolean;
  className?: string;
}

function formatTime(date: Date): string {
  const d = date instanceof Date && !isNaN(date.getTime()) ? date : new Date(date as unknown as string);
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

const bubbleConfig: Record<BubbleType, { align: string; bubble: string; badge: string | null }> = {
  client: {
    align: 'items-start',
    bubble: 'bg-white text-text-primary border border-border rounded-tl-none',
    badge: null,
  },
  agent: {
    align: 'items-end',
    bubble: 'bg-primary text-white rounded-tr-none',
    badge: 'IA',
  },
  vendor: {
    align: 'items-end',
    bubble: 'bg-primary-dark text-white rounded-tr-none',
    badge: 'Vous',
  },
};

export function ConversationBubble({
  type,
  message,
  timestamp,
  imageUrl,
  isLoading = false,
  className,
}: ConversationBubbleProps) {
  const config = bubbleConfig[type];
  const isRight = type === 'agent' || type === 'vendor';

  if (isLoading) {
    return (
      <div className={cn('flex flex-col', config.align, className)}>
        <Skeleton
          role="status"
          aria-label="Chargement du message..."
          className="h-16 w-48 rounded-card"
        />
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col', config.align, 'max-w-[85%]', isRight ? 'self-end' : 'self-start', className)}>
      {/* Badge source */}
      {config.badge && (
        <span className="text-label text-text-muted mb-1 px-1">
          {config.badge}
        </span>
      )}

      {/* Bulle */}
      <div className={cn('rounded-card px-space-3 py-space-2 shadow-sm', config.bubble)}>
        {/* Image reçu */}
        {imageUrl && (
          <div className="mb-2 rounded overflow-hidden">
            <Image
              src={imageUrl}
              alt="Reçu de paiement"
              width={200}
              height={150}
              className="object-cover"
            />
          </div>
        )}

        {/* Message */}
        <p className="text-body-md break-words">{message}</p>
      </div>

      {/* Horodatage */}
      <span className={cn('text-body-sm text-text-muted mt-1 px-1', isRight ? 'text-right' : 'text-left')}>
        {formatTime(timestamp)}
      </span>
    </div>
  );
}
