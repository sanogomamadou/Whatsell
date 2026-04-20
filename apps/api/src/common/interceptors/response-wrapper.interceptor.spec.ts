import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { of } from 'rxjs';
import { ResponseWrapperInterceptor } from './response-wrapper.interceptor';

describe('ResponseWrapperInterceptor', () => {
  let interceptor: ResponseWrapperInterceptor;

  const mockReflector = {} as Reflector;

  // Contexte non-SSE : getHandler retourne une fonction sans metadata 'sse'
  const plainHandler = function plainHandler() { return undefined; };
  const ctx = {
    getHandler: () => plainHandler,
  } as unknown as ExecutionContext;

  beforeEach(() => {
    interceptor = new ResponseWrapperInterceptor(mockReflector);
  });

  const mockNext = (result: unknown): CallHandler => ({
    handle: () => of(result),
  });

  it('should wrap plain object in { data }', (done) => {
    interceptor.intercept(ctx, mockNext({ id: 1, name: 'test' })).subscribe((res) => {
      expect(res).toEqual({ data: { id: 1, name: 'test' } });
      done();
    });
  });

  it('should wrap string value in { data }', (done) => {
    interceptor.intercept(ctx, mockNext('hello')).subscribe((res) => {
      expect(res).toEqual({ data: 'hello' });
      done();
    });
  });

  it('should wrap number value in { data }', (done) => {
    interceptor.intercept(ctx, mockNext(42)).subscribe((res) => {
      expect(res).toEqual({ data: 42 });
      done();
    });
  });

  it('should wrap null in { data: null }', (done) => {
    interceptor.intercept(ctx, mockNext(null)).subscribe((res) => {
      expect(res).toEqual({ data: null });
      done();
    });
  });

  it('should wrap plain array in { data }', (done) => {
    interceptor.intercept(ctx, mockNext([1, 2, 3])).subscribe((res) => {
      expect(res).toEqual({ data: [1, 2, 3] });
      done();
    });
  });

  it('should pass through paginated result unchanged', (done) => {
    const paginated = {
      data: [{ id: 1 }, { id: 2 }],
      meta: { total: 2, page: 1, limit: 10 },
    };
    interceptor.intercept(ctx, mockNext(paginated)).subscribe((res) => {
      expect(res).toEqual(paginated);
      done();
    });
  });

  it('should NOT double-wrap result that already has data and meta', (done) => {
    const paginated = {
      data: [{ id: 1 }],
      meta: { total: 1, page: 1, limit: 5 },
    };
    interceptor.intercept(ctx, mockNext(paginated)).subscribe((res) => {
      expect(res).not.toHaveProperty('data.data');
      done();
    });
  });

  it('should wrap object with data property but no meta in { data }', (done) => {
    const objectWithDataKey = { data: 'value', other: 'thing' };
    interceptor.intercept(ctx, mockNext(objectWithDataKey)).subscribe((res) => {
      expect(res).toEqual({ data: objectWithDataKey });
      done();
    });
  });

  it('should bypass wrapping for SSE endpoints (metadata sse = true)', (done) => {
    // Simule un handler décoré par @Sse() — NestJS pose 'sse' = true
    const sseHandler = function sseHandler() { return undefined; };
    Reflect.defineMetadata('sse', true, sseHandler);

    const sseCtx = {
      getHandler: () => sseHandler,
    } as unknown as ExecutionContext;

    const sseMessage = { data: '{"tenantId":"t1","payload":{}}', type: 'order.created' };

    interceptor.intercept(sseCtx, mockNext(sseMessage)).subscribe((res) => {
      // Doit passer tel quel — pas de wrapping dans { data }
      expect(res).toEqual(sseMessage);
      expect(res).not.toHaveProperty('data.data');
      done();
    });
  });

  it('should NOT bypass wrapping when handler has no sse metadata', (done) => {
    const regularHandler = function regularHandler() { return undefined; };
    // Pas de metadata 'sse' → Reflect.getMetadata retourne undefined

    const regularCtx = {
      getHandler: () => regularHandler,
    } as unknown as ExecutionContext;

    interceptor.intercept(regularCtx, mockNext({ value: 42 })).subscribe((res) => {
      expect(res).toEqual({ data: { value: 42 } });
      done();
    });
  });
});
