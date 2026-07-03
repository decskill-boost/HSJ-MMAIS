import { Controller, Get, UseGuards } from '@nestjs/common';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SupabaseJwtPayload } from '../auth/supabase-jwt-payload.interface';
import { UserRole } from './user-role.enum';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(SupabaseAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Qualquer utilizador autenticado pode ver o seu próprio perfil.
  @Get('me')
  getMe(@CurrentUser() payload: SupabaseJwtPayload) {
    return this.usersService.findById(payload.sub);
  }

  // Exemplo de rota restrita à role 'corpo_clinico', validada contra
  // a base de dados (nunca confia na role vinda do token).
  @Get('rota-protegida')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CORPO_CLINICO)
  testarPermissao(@CurrentUser() payload: SupabaseJwtPayload) {
    return this.usersService.findById(payload.sub);
  }
}
