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
 * Prescrever, alterar ou cancelar um plano é ato clínico: só o corpo clínico.
 * Sem estas guardas, qualquer pedido anónimo criava e cancelava planos de
 * crianças em tratamento.
 */
@Controller('prescricoes')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(UserRole.CORPO_CLINICO)
export class PrescricoesController {
  constructor(private readonly prescricoesService: PrescricoesService) {}

  // POST /api/prescricoes
  @Post()
  create(
    @Body() dados: CreatePrescricaoDto,
    @CurrentUser() payload: SupabaseJwtPayload,
  ) {
    // Quem prescreve é quem está autenticado — ver CreatePrescricaoDto.
    return this.prescricoesService.create(dados, payload.sub);
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

  // PATCH /api/prescricoes/:id/cancel
  @Patch(':id/cancel')
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.prescricoesService.cancel(id);
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
