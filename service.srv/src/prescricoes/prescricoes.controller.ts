import { Controller, Post, Body, Patch, Param, Put } from '@nestjs/common';
import { PrescricoesService } from './prescricoes.service';
import { CreatePrescricaoDto } from './create-prescricao.dto';
import { UpdatePrescricaoDto } from './update-prescricao.dto';

@Controller('prescricoes')
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
