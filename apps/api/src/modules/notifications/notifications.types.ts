import { AgentEventType } from '@whatsell/shared';

export interface PushPayload {
  title: string;
  body: string;
  icon: string;
  badge: string;
  data: {
    url: string;
    event: AgentEventType;
  };
}

// Mapping événement → titre de notification
export const PUSH_EVENT_TITLES: Partial<Record<AgentEventType, string>> = {
  'order.created': 'Nouvelle commande 🎉',
  'conversation.handoff_required': 'Intervention requise ⚠️',
  'stock.alert': 'Stock bas 📦',
};

// Seuls ces événements déclenchent une Web Push (NFR3)
export const PUSH_TRIGGER_EVENTS: AgentEventType[] = [
  'order.created',
  'conversation.handoff_required',
  'stock.alert',
];

export function buildPushPayload(
  event: AgentEventType,
  eventPayload: unknown,
): PushPayload {
  const title = PUSH_EVENT_TITLES[event] ?? 'Nouvelle notification';
  let body = '';
  let url = '/';

  if (event === 'order.created') {
    const p = eventPayload as { orderId?: string; productName?: string; totalAmount?: number };
    body = p.productName ? `${p.productName} — ${p.totalAmount ?? 0} FCFA` : 'Une nouvelle commande a été passée';
    url = p.orderId ? `/orders/${p.orderId}` : '/orders';
  } else if (event === 'conversation.handoff_required') {
    const p = eventPayload as { conversationId?: string; customerPhone?: string };
    body = p.customerPhone ? `Client : ${p.customerPhone}` : 'Un client attend votre intervention';
    url = p.conversationId ? `/conversations/${p.conversationId}` : '/conversations';
  } else if (event === 'stock.alert') {
    const p = eventPayload as { productName?: string; quantity?: number };
    body = p.productName ? `${p.productName} : ${p.quantity ?? 0} unité(s) restante(s)` : 'Un produit est en rupture de stock imminente';
    url = '/catalogue';
  }

  return {
    title,
    body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    data: { url, event },
  };
}
