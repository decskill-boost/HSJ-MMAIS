import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { UserRole } from '../users/user-role.enum';
import { PacientesService } from './pacientes.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SupabaseJwtPayload } from '../auth/supabase-jwt-payload.interface';

@Controller('pacientes')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(UserRole.CORPO_CLINICO)
export class PacientesController {
  constructor(private readonly pacientesService: PacientesService) {}

  // GET /api/pacientes
  @Get()
  getPacientesComAdesao(@CurrentUser() payload: SupabaseJwtPayload) {
    return this.pacientesService.getPacientesComAdesao(payload.sub);
  }

  // GET /api/pacientes/:id/historico?from=YYYY-MM-DD&to=YYYY-MM-DD
  @Get(':id/historico')
  getHistorico(
    @Param('id') id: string,
    @CurrentUser() payload: SupabaseJwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.pacientesService.getHistorico(id, from, to, payload.sub);
  }
}
