import { ExecutionContext, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../../../generated/prisma/client';
import { RolesGuard } from './roles.guard';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;

  beforeEach(() => {
    reflector = {
      getAllAndOverride: jest.fn(),
    } as unknown as jest.Mocked<Pick<Reflector, 'getAllAndOverride'>>;
    guard = new RolesGuard(reflector as unknown as Reflector);
  });

  const mockContext = (user?: {
    id: string;
    email: string;
    tenantId: string;
    role: Role;
  }): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  it('devrait autoriser si aucun rôle requis (pas de @Roles)', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('devrait autoriser si la liste de rôles est vide', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    expect(guard.canActivate(mockContext())).toBe(true);
  });

  it('devrait autoriser un OWNER sur un endpoint @Roles(OWNER)', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.OWNER]);
    const user = { id: '1', email: 'owner@test.com', tenantId: 't1', role: Role.OWNER };
    expect(guard.canActivate(mockContext(user))).toBe(true);
  });

  it('devrait autoriser un CO_MANAGER sur un endpoint @Roles(OWNER, CO_MANAGER)', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.OWNER, Role.CO_MANAGER]);
    const user = { id: '2', email: 'co@test.com', tenantId: 't1', role: Role.CO_MANAGER };
    expect(guard.canActivate(mockContext(user))).toBe(true);
  });

  it('devrait refuser (ForbiddenException) un SELLER sur @Roles(OWNER)', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.OWNER]);
    const user = { id: '3', email: 'seller@test.com', tenantId: 't1', role: Role.SELLER };
    expect(() => guard.canActivate(mockContext(user))).toThrow(ForbiddenException);
  });

  it('devrait refuser (ForbiddenException) un SELLER sur @Roles(OWNER, CO_MANAGER)', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.OWNER, Role.CO_MANAGER]);
    const user = { id: '3', email: 'seller@test.com', tenantId: 't1', role: Role.SELLER };
    expect(() => guard.canActivate(mockContext(user))).toThrow(ForbiddenException);
  });

  it('devrait autoriser un ADMIN sur @Roles(ADMIN)', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);
    const user = { id: '4', email: 'admin@test.com', tenantId: 't1', role: Role.ADMIN };
    expect(guard.canActivate(mockContext(user))).toBe(true);
  });

  it('devrait lever UnauthorizedException si request.user est absent (401, pas 403)', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.OWNER]);
    expect(() => guard.canActivate(mockContext(undefined))).toThrow(UnauthorizedException);
  });

  it('devrait refuser (ForbiddenException) un ADMIN sur @Roles(OWNER) — ADMIN est un rôle plat', () => {
    reflector.getAllAndOverride.mockReturnValue([Role.OWNER]);
    const user = { id: '5', email: 'admin@test.com', tenantId: 't1', role: Role.ADMIN };
    expect(() => guard.canActivate(mockContext(user))).toThrow(ForbiddenException);
  });
});
