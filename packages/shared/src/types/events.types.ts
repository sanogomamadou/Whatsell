// Types partagés pour les événements SSE temps réel
// Utilisés par apps/api (EventsService) et apps/web (useAgentEvents)

export type AgentEventType =
  | 'order.created'
  | 'order.status_changed'
  | 'stock.alert'
  | 'agent.status_changed'
  | 'conversation.handoff_required';

export interface AgentEventData {
  tenantId: string;
  payload: unknown;
  timestamp: string;
}
