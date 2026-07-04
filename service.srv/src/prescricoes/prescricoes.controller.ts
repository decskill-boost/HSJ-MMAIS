import { Controller, Post, Body } from '@nestjs/common';
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
}