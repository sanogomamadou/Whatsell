import { Controller, Sse } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { MessageEvent } from '@nestjs/common';
import { EventsService } from './events.service';
import { CurrentTenant } from '../../common/decorators';

@SkipThrottle()
@ApiTags('events')
@ApiBearerAuth()
@Controller('events')
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Sse('stream')
  stream(@CurrentTenant() tenantId: string): Observable<MessageEvent> {
    return this.eventsService.getStream(tenantId);
  }
}
