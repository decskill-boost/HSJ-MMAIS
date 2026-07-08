import { Controller, Post, Body, Patch, Param } from '@nestjs/common';
import { PrescricoesService } from './prescricoes.service';
import { CreatePrescricaoDto } from './create-prescricao.dto';

@Controller('prescricoes')
export class PrescricoesController {
  constructor(private readonly prescricoesService: PrescricoesService) {}

  // POST /api/prescricoes
  @Post()
  create(@Body() dados: CreatePrescricaoDto) {
    return this.prescricoesService.create(dados);
  }

  // PATCH /api/prescricoes/:id/cancel
  @Patch(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.prescricoesService.cancel(id);
  }
}
