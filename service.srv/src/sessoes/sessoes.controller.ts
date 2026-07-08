import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { SupabaseJwtPayload } from '../auth/supabase-jwt-payload.interface';
import type { ConcluirExercicioDto } from './dto/concluir-exercicio.dto';
import type { IniciarExercicioDto } from './dto/iniciar-exercicio.dto';
import { SessoesService } from './sessoes.service';

@Controller('sessoes')
export class SessoesController {
  constructor(private readonly sessoesService: SessoesService) {}

  // POST /api/sessoes/iniciar
  @Post('iniciar')
  @UseGuards(SupabaseAuthGuard)
  iniciar(
    @CurrentUser() payload: SupabaseJwtPayload,
    @Body() dto: IniciarExercicioDto,
  ) {
    return this.sessoesService.iniciarExercicio(payload.sub, dto);
  }

  // POST /api/sessoes/concluir
  @Post('concluir')
  @UseGuards(SupabaseAuthGuard)
  concluir(
    @CurrentUser() payload: SupabaseJwtPayload,
    @Body() dto: ConcluirExercicioDto,
  ) {
    return this.sessoesService.concluirExercicio(payload.sub, dto);
  }
}