import { Injectable } from '@nestjs/common';
import { MessageEvent } from '@nestjs/common';
import { Subject, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { AgentEventType } from '@whatsell/shared';

export { AgentEventType };

export interface InternalEvent {
  tenantId: string;
  event: AgentEventType;
  payload: unknown;
  timestamp: string;
}

@Injectable()
export class EventsService {
  private readonly stream$ = new Subject<InternalEvent>();

  getStream(tenantId: string): Observable<MessageEvent> {
    return this.stream$.pipe(
      filter((e) => e.tenantId === tenantId),
      map(
        (e): MessageEvent => ({
          data: JSON.stringify({
            tenantId: e.tenantId,
            payload: e.payload,
            timestamp: e.timestamp,
          }),
          type: e.event,
        }),
      ),
    );
  }

  emit(event: AgentEventType, tenantId: string, payload: unknown): void {
    this.stream$.next({
      tenantId,
      event,
      payload,
      timestamp: new Date().toISOString(), // capturé à l'émission, partagé par tous les subscribers
    });
  }

  // Expose le flux brut (non filtré par tenant) — utilisé par NotificationsService pour les Web Push
  subscribeToAll(): Observable<InternalEvent> {
    return this.stream$.asObservable();
  }
}
