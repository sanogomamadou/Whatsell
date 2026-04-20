import { TestingModule, Test } from '@nestjs/testing';
import { EventsService } from './events.service';
import { AgentEventType } from '@whatsell/shared';
import { MessageEvent } from '@nestjs/common';

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [EventsService],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  describe('emit / getStream', () => {
    it('should deliver an event to the correct tenant stream', (done) => {
      const received: MessageEvent[] = [];

      service.getStream('tenant-A').subscribe((msg) => {
        received.push(msg);
      });

      service.emit('order.created', 'tenant-A', { orderId: '123' });

      setTimeout(() => {
        expect(received).toHaveLength(1);
        expect(received[0].type).toBe('order.created');
        const data = JSON.parse(received[0].data as string) as {
          tenantId: string;
          payload: unknown;
          timestamp: string;
        };
        expect(data.tenantId).toBe('tenant-A');
        expect(data.payload).toEqual({ orderId: '123' });
        expect(typeof data.timestamp).toBe('string');
        done();
      }, 50);
    });

    it('should NOT deliver events of tenant A to tenant B stream', (done) => {
      const receivedByB: MessageEvent[] = [];

      service.getStream('tenant-B').subscribe((msg) => {
        receivedByB.push(msg);
      });

      service.emit('order.created', 'tenant-A', { orderId: '123' });

      setTimeout(() => {
        expect(receivedByB).toHaveLength(0);
        done();
      }, 50);
    });

    it('should deliver events to both tenants independently', (done) => {
      const receivedA: MessageEvent[] = [];
      const receivedB: MessageEvent[] = [];

      service.getStream('tenant-A').subscribe((msg) => receivedA.push(msg));
      service.getStream('tenant-B').subscribe((msg) => receivedB.push(msg));

      service.emit('stock.alert', 'tenant-A', { productId: 'p1' });
      service.emit('stock.alert', 'tenant-B', { productId: 'p2' });

      setTimeout(() => {
        expect(receivedA).toHaveLength(1);
        expect(receivedB).toHaveLength(1);

        const dataA = JSON.parse(receivedA[0].data as string) as { tenantId: string };
        const dataB = JSON.parse(receivedB[0].data as string) as { tenantId: string };

        expect(dataA.tenantId).toBe('tenant-A');
        expect(dataB.tenantId).toBe('tenant-B');
        done();
      }, 50);
    });

    it('should support all 5 AgentEventType values', (done) => {
      const eventTypes: AgentEventType[] = [
        'order.created',
        'order.status_changed',
        'stock.alert',
        'agent.status_changed',
        'conversation.handoff_required',
      ];
      const received: string[] = [];

      service.getStream('tenant-X').subscribe((msg) => {
        received.push(msg.type as string);
      });

      for (const eventType of eventTypes) {
        service.emit(eventType, 'tenant-X', {});
      }

      setTimeout(() => {
        expect(received).toHaveLength(5);
        for (const eventType of eventTypes) {
          expect(received).toContain(eventType);
        }
        done();
      }, 50);
    });

    it('should emit valid ISO 8601 UTC timestamp in each event', (done) => {
      service.getStream('tenant-ts').subscribe((msg) => {
        const data = JSON.parse(msg.data as string) as { timestamp: string };
        expect(new Date(data.timestamp).toISOString()).toBe(data.timestamp);
        done();
      });

      service.emit('order.created', 'tenant-ts', {});
    });

    it('should share the same timestamp across all subscribers for a single emit', (done) => {
      const tsA: string[] = [];
      const tsB: string[] = [];

      service.getStream('tenant-shared').subscribe((msg) => {
        const data = JSON.parse(msg.data as string) as { timestamp: string };
        tsA.push(data.timestamp);
      });
      service.getStream('tenant-shared').subscribe((msg) => {
        const data = JSON.parse(msg.data as string) as { timestamp: string };
        tsB.push(data.timestamp);
      });

      service.emit('order.created', 'tenant-shared', {});

      setTimeout(() => {
        expect(tsA).toHaveLength(1);
        expect(tsB).toHaveLength(1);
        expect(tsA[0]).toBe(tsB[0]); // même timestamp pour les deux subscribers
        done();
      }, 50);
    });

    it('should not cause memory leaks — unsubscribed streams stop receiving events', (done) => {
      const received: MessageEvent[] = [];
      const sub = service.getStream('tenant-leak').subscribe((msg) => received.push(msg));

      service.emit('order.created', 'tenant-leak', { step: 1 });

      setTimeout(() => {
        expect(received).toHaveLength(1);
        sub.unsubscribe();

        service.emit('order.created', 'tenant-leak', { step: 2 });

        setTimeout(() => {
          // After unsubscribe, no new events should arrive
          expect(received).toHaveLength(1);
          done();
        }, 50);
      }, 50);
    });
  });
});
