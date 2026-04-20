import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

interface PaginatedResult<T> {
  data: T[];
  meta: { total: number; page: number; limit: number };
}

function isPaginatedResult(value: unknown): value is PaginatedResult<unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'data' in value &&
    'meta' in value &&
    Array.isArray((value as PaginatedResult<unknown>).data)
  );
}

@Injectable()
export class ResponseWrapperInterceptor implements NestInterceptor {
  constructor(private readonly reflector: Reflector) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    // Les endpoints SSE (@Sse()) posent le metadata 'sse' = true sur le handler.
    // Sans ce bypass, le map() ci-dessous wrappe chaque MessageEvent dans { data }
    // ce qui casse le protocole SSE.
    const handler = context.getHandler?.();
    const isSse = handler ? Reflect.getMetadata('sse', handler) === true : false;
    if (isSse) return next.handle();

    return next.handle().pipe(
      map((result: unknown) => {
        // Les résultats paginés { data: T[], meta: {...} } passent sans double-wrapping
        if (isPaginatedResult(result)) {
          return result;
        }
        return { data: result };
      }),
    );
  }
}
