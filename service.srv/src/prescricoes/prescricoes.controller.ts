import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
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
  create(@Body() dados: CreatePrescricaoDto) {
    return this.prescricoesService.create(dados);
  }

  // PUT /api/prescricoes/:id — editar um plano ja criado
  @Put(':id')
  update(@Param('id') id: string, @Body() dados: UpdatePrescricaoDto) {
    return this.prescricoesService.update(id, dados);
  }

  // PATCH /api/prescricoes/:id/cancel
  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.prescricoesService.cancel(id);
  }
}
