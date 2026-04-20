import { Test, TestingModule } from '@nestjs/testing';
import { of, Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';

describe('EventsController', () => {
  let controller: EventsController;
  let eventsService: jest.Mocked<EventsService>;

  beforeEach(async () => {
    const mockEventsService: jest.Mocked<Partial<EventsService>> = {
      getStream: jest.fn(),
      emit: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [EventsController],
      providers: [
        { provide: EventsService, useValue: mockEventsService },
      ],
    }).compile();

    controller = module.get<EventsController>(EventsController);
    eventsService = module.get(EventsService);
  });

  describe('stream()', () => {
    it('should call eventsService.getStream with the provided tenantId', () => {
      const tenantId = 'tenant-test-123';
      const mockStream: Observable<MessageEvent> = of({
        data: '{}',
        type: 'order.created',
      });

      eventsService.getStream.mockReturnValue(mockStream);

      const result = controller.stream(tenantId);

      expect(eventsService.getStream).toHaveBeenCalledWith(tenantId);
      expect(result).toBe(mockStream);
    });

    it('should return the Observable from eventsService.getStream', () => {
      const tenantId = 'tenant-xyz';
      const mockStream: Observable<MessageEvent> = of({
        data: JSON.stringify({ tenantId, payload: {}, timestamp: new Date().toISOString() }),
        type: 'stock.alert',
      });

      eventsService.getStream.mockReturnValue(mockStream);

      const result = controller.stream(tenantId);

      expect(result).toBeInstanceOf(Observable);
    });
  });
});
