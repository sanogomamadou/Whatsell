'use client';

import { useToast } from '@/components/ui/use-toast';
import { CelebrationToast, CELEBRATION_TRIGGERS, CelebrationTrigger } from '@/components/shared/CelebrationToast';
import React from 'react';

const GLOBAL_CELEBRATION_KEY = 'celebration_any';

interface CelebrationOptions {
  emoji?: string;
  subMessage?: string;
  triggerKey?: CelebrationTrigger;
}

export function useCelebrationToast() {
  const { toast } = useToast();

  function triggerCelebration(message: string, options: CelebrationOptions = {}) {
    const { emoji = '🎉', subMessage, triggerKey } = options;
    const sessionKey = triggerKey ?? GLOBAL_CELEBRATION_KEY;

    const alreadyShown = sessionStorage.getItem(sessionKey);
    if (alreadyShown) return;

    toast({
      description: React.createElement(CelebrationToast, { message, emoji, subMessage }),
    });

    sessionStorage.setItem(sessionKey, '1');
  }

  return { triggerCelebration, CELEBRATION_TRIGGERS };
}
