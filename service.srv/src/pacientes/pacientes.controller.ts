import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { UserRole } from '../users/user-role.enum';
import { PacientesService } from './pacientes.service';
import { CurrentUser } from '../auth/current-user.decorator';
import type { SupabaseJwtPayload } from '../auth/supabase-jwt-payload.interface';

/**
 * Tudo o que este controlador serve são dados clínicos de crianças.
 *
 * As guardas estão ao NÍVEL DA CLASSE de propósito: `@Roles(...)` sem
 * `RolesGuard` na cadeia falha ABERTO e em silêncio — compila, não dá aviso
 * nenhum, e devolve 200 a quem não devia. Ao ficarem na classe, um método novo
 * nasce protegido por omissão em vez de nascer aberto. Não acrescentar aqui
 * rotas com cadeias de guardas próprias; qualquer exceção teria de ser
 * explícita e testada (ver `test/pacientes.controller.guardas.spec.ts`).
 */
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
  //
  // O `:id` é validado como UUID como nas rotas irmãs: sem o pipe, um id que
  // não seja UUID só era recusado pelo Postgres e voltava ao cliente como 500,
  // com a mensagem de erro do driver, em vez de 400.
  @Get(':id/historico')
  getHistorico(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() payload: SupabaseJwtPayload,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.pacientesService.getHistorico(id, from, to, payload.sub);
  }

  /**
   * GET /api/pacientes/:id/sessoes — treinos concluídos de uma criança.
   *
   * O `:id` vem da barra de endereços, ou seja, é escolhido por quem pede: daí
   * o papel ser confirmado contra a base de dados (`RolesGuard`) e o UUID ser
   * validado antes de chegar à consulta. O serviço verifica ainda que o `:id`
   * corresponde mesmo a um paciente antes de o usar como filtro.
   */
  @Get(':id/sessoes')
  getSessoesConcluidas(@Param('id', ParseUUIDPipe) id: string) {
    return this.pacientesService.getSessoesConcluidas(id);
  }

  /** GET /api/pacientes/:id — cabeçalho do perfil (nome, nível, XP, sequência). */
  @Get(':id')
  getPacientePorId(@Param('id', ParseUUIDPipe) id: string) {
    return this.pacientesService.getPacientePorId(id);
  }
}
