import {
  Controller,
  Post,
  Body,
  Delete,
  Patch,
  Param,
  ParseUUIDPipe,
  Put,
  UseGuards,
} from '@nestjs/common';
import { CurrentRole } from '../auth/current-role.decorator';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { SupabaseJwtPayload } from '../auth/supabase-jwt-payload.interface';
import { UserRole } from '../users/user-role.enum';
import { PrescricoesService } from './prescricoes.service';
import { CreatePrescricaoDto } from './create-prescricao.dto';
import { UpdatePrescricaoDto } from './update-prescricao.dto';

/**
 * Prescrever, alterar ou cancelar um plano é ato clínico. A PREDEFINIÇÃO DA
 * CLASSE é por isso a mais restritiva — corpo clínico — e cada exceção fica
 * declarada no seu próprio handler, à vista.
 *
 * Desde que a criança passou a poder montar planos seus (PR #76) há duas
 * exceções, e só duas: criar um plano e arquivá-lo depois de o terminar. Ambas
 * ficam presas ao próprio: o `@Roles` abre a porta, mas é o serviço que
 * confirma de quem é o plano. Enquanto `@Roles(CORPO_CLINICO, PACIENTE)`
 * esteve na CLASSE, um token de criança chegava também ao `PUT`, ao `DELETE` e
 * ao cancelamento de QUALQUER plano — bastava o id de outra criança para lhe
 * apagar a prescrição.
 */
@Controller('prescricoes')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(UserRole.CORPO_CLINICO)
export class PrescricoesController {
  constructor(private readonly prescricoesService: PrescricoesService) {}

  /**
   * POST /api/prescricoes
   *
   * O corpo clínico prescreve a quem quiser; a criança só a si própria — e é o
   * serviço que o garante, ignorando o `id_paciente` que venha no pedido.
   */
  @Post()
  @Roles(UserRole.CORPO_CLINICO, UserRole.PACIENTE)
  create(
    @Body() dados: CreatePrescricaoDto,
    @CurrentUser() payload: SupabaseJwtPayload,
    @CurrentRole() role: UserRole | undefined,
  ) {
    // Quem prescreve é quem está autenticado — ver CreatePrescricaoDto.
    return this.prescricoesService.create(dados, payload.sub, role);
  }

  // PUT /api/prescricoes/:id — editar um plano ja criado
  //
  // O `:id` é validado como UUID pelo mesmo motivo do DELETE abaixo: sem o
  // pipe, um id que não seja UUID só era recusado pelo Postgres — já dentro do
  // pedido de escrita e devolvido ao cliente como 500 em vez de 400.
  @Put(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: UpdatePrescricaoDto,
  ) {
    return this.prescricoesService.update(id, dados);
  }

  /**
   * PATCH /api/prescricoes/:id/cancel
   *
   * Aberto também à criança porque é assim que um plano montado por ela sai da
   * lista de ativos quando o termina. O serviço só deixa passar planos de que
   * ela seja dona E autora — cancelar a prescrição do médico não é decisão sua.
   */
  @Patch(':id/cancel')
  @Roles(UserRole.CORPO_CLINICO, UserRole.PACIENTE)
  cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() payload: SupabaseJwtPayload,
    @CurrentRole() role: UserRole | undefined,
  ) {
    return this.prescricoesService.cancel(id, payload.sub, role);
  }

  /**
   * E6 — DELETE /api/prescricoes/:id
   *
   * Substitui o `.delete()` que o browser fazia direto ao Supabase. Herda as
   * guardas da classe (corpo clínico); o id vem da barra de endereços, por isso
   * é validado como UUID.
   *
   * Devolve 409 (com a mensagem em português) quando o plano já tem treinos
   * associados, e 404 quando não existe.
   */
  @Delete(':id')
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.prescricoesService.remove(id);
  }
}
