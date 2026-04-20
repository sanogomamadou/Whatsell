import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtAuthGuard } from './jwt-auth.guard';

const mockContext = (): ExecutionContext =>
  ({
    getHandler: jest.fn(),
    getClass: jest.fn(),
    switchToHttp: jest.fn(),
  }) as unknown as ExecutionContext;

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: jest.Mocked<Reflector>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Reflector>;
    guard = new JwtAuthGuard(reflector);
  });

  describe('@Public() routes', () => {
    it('should allow access when route is marked @Public()', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const result = guard.canActivate(mockContext());
      expect(result).toBe(true);
    });

    it('should call Reflector with IS_PUBLIC_KEY', () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const ctx = mockContext();
      guard.canActivate(ctx);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [
        ctx.getHandler(),
        ctx.getClass(),
      ]);
    });
  });

  describe('Protected routes', () => {
    it('should delegate to AuthGuard when route is NOT @Public()', () => {
      reflector.getAllAndOverride.mockReturnValue(false);
      // Spy sur super.canActivate pour vérifier la délégation
      const superCanActivate = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true as unknown as ReturnType<typeof guard.canActivate>);

      guard.canActivate(mockContext());

      expect(superCanActivate).toHaveBeenCalled();
      superCanActivate.mockRestore();
    });

    it('should delegate to AuthGuard when isPublic is undefined', () => {
      reflector.getAllAndOverride.mockReturnValue(undefined);
      const superCanActivate = jest
        .spyOn(Object.getPrototypeOf(JwtAuthGuard.prototype), 'canActivate')
        .mockReturnValue(true as unknown as ReturnType<typeof guard.canActivate>);

      guard.canActivate(mockContext());

      expect(superCanActivate).toHaveBeenCalled();
      superCanActivate.mockRestore();
    });
  });
});
