import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { UserRole } from '../users/user-role.enum';
import type { AuthenticatedRequest } from './authenticated-request.interface';

/**
 * Papel de negócio de quem faz o pedido, tal como o `RolesGuard` o confirmou
 * na base de dados.
 *
 * Só está preenchido em handlers que passem pelo `RolesGuard` (ou seja, que
 * tenham `@Roles(...)`). Vem `undefined` em qualquer outro sítio, e quem o usa
 * TEM de tratar esse caso a fechar — nunca a assumir corpo clínico.
 */
export const CurrentRole = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserRole | undefined => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.roleUtilizador;
  },
);
