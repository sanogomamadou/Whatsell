'use client';

import { useEffect, useRef } from 'react';
import type { AgentEventType, AgentEventData } from '@whatsell/shared';

export type { AgentEventType, AgentEventData };

export interface UseAgentEventsOptions {
  onOrderCreated?: (data: AgentEventData) => void;
  onOrderStatusChanged?: (data: AgentEventData) => void;
  onStockAlert?: (data: AgentEventData) => void;
  onAgentStatusChanged?: (data: AgentEventData) => void;
  onConversationHandoffRequired?: (data: AgentEventData) => void;
  /** Appelé après maxAuthRetries échecs consécutifs — indique probablement un token expiré */
  onAuthError?: () => void;
  /** Désactiver la connexion SSE (ex: utilisateur non authentifié). Défaut: true */
  enabled?: boolean;
  /** Nombre d'échecs consécutifs avant d'appeler onAuthError. Défaut: 3 */
  maxAuthRetries?: number;
}

function parseEventData(raw: string, eventType: string): AgentEventData | null {
  try {
    return JSON.parse(raw) as AgentEventData;
  } catch {
    console.error(`[useAgentEvents] Payload malformé pour l'événement "${eventType}":`, raw);
    return null;
  }
}

export function useAgentEvents(options: UseAgentEventsOptions = {}): void {
  const { enabled = true, maxAuthRetries = 3 } = options;
  // Stocker les handlers dans un ref pour éviter de relancer useEffect à chaque re-render
  const handlersRef = useRef(options);
  handlersRef.current = options;

  useEffect(() => {
    if (!enabled) return;

    let source: EventSource | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let isClosed = false;
    let consecutiveErrors = 0;

    function connect(): void {
      const baseUrl = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001';
      source = new EventSource(`${baseUrl}/api/v1/events/stream`, {
        withCredentials: true, // OBLIGATOIRE — envoie le cookie access_token httpOnly
      });

      source.addEventListener('order.created', (e: Event) => {
        const data = parseEventData((e as MessageEvent<string>).data, 'order.created');
        if (data) handlersRef.current.onOrderCreated?.(data);
      });

      source.addEventListener('order.status_changed', (e: Event) => {
        const data = parseEventData((e as MessageEvent<string>).data, 'order.status_changed');
        if (data) handlersRef.current.onOrderStatusChanged?.(data);
      });

      source.addEventListener('stock.alert', (e: Event) => {
        const data = parseEventData((e as MessageEvent<string>).data, 'stock.alert');
        if (data) handlersRef.current.onStockAlert?.(data);
      });

      source.addEventListener('agent.status_changed', (e: Event) => {
        const data = parseEventData((e as MessageEvent<string>).data, 'agent.status_changed');
        if (data) handlersRef.current.onAgentStatusChanged?.(data);
      });

      source.addEventListener('conversation.handoff_required', (e: Event) => {
        const data = parseEventData((e as MessageEvent<string>).data, 'conversation.handoff_required');
        if (data) handlersRef.current.onConversationHandoffRequired?.(data);
      });

      source.onopen = () => {
        consecutiveErrors = 0; // connexion réussie — reset compteur
      };

      source.onerror = () => {
        source?.close();
        consecutiveErrors += 1;

        if (consecutiveErrors >= maxAuthRetries) {
          // Plusieurs échecs consécutifs = probablement token expiré
          handlersRef.current.onAuthError?.();
          return; // ne pas reconnecter
        }

        if (!isClosed) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      };
    }

    connect();

    return () => {
      isClosed = true;
      source?.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, [enabled, maxAuthRetries]);
}
