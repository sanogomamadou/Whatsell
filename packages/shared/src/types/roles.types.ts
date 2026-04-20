// Rôles RBAC — partagés entre NestJS guards et types frontend
// Doit correspondre exactement à l'enum Role dans le schéma Prisma (Story 1.2)

export enum Role {
  OWNER = 'OWNER',
  CO_MANAGER = 'CO_MANAGER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
}
