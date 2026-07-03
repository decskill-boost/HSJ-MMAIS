import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UsersService } from '../../users/users.service';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { UserRole } from '../../users/user-role.enum';
import type { AuthenticatedRequest } from '../authenticated-request.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Sem @Roles() no handler/controller -> não há restrição de role,
    // basta estar autenticado (o SupabaseAuthGuard já garantiu isso).
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const userId = request.user?.sub;
    if (!userId) {
      throw new ForbiddenException('Utilizador não autenticado');
    }

    // O token do Supabase só traz role: "authenticated" - não traz a
    // role de negócio (médico/paciente/etc). Por isso vamos à BD
    // confirmar a role real e atual do utilizador, em vez de confiar
    // em qualquer claim customizada que pudesse vir do token.
    const user = await this.usersService.findById(userId);

    const hasRequiredRole = requiredRoles.some(
      (role) => role === (user.role as UserRole),
    );

    if (!hasRequiredRole) {
      throw new ForbiddenException(
        'Não tens permissão para aceder a este recurso',
      );
    }

    return true;
  }
}
