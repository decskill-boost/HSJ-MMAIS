import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Post,
  UseGuards,
} from '@nestjs/common';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import { UserRole } from '../users/user-role.enum';
import { ExerciciosService } from './exercicios.service';
import { Exercicio } from '../entities/exercicio.entity';

/**
 * A biblioteca lê-se com sessão iniciada (as crianças precisam dela); criar,
 * alterar e apagar exercícios fica reservado ao corpo clínico. Antes disto,
 * qualquer pedido anónimo podia apagar a biblioteca inteira.
 */
@Controller('exercicios')
@UseGuards(SupabaseAuthGuard)
export class ExerciciosController {
  constructor(private readonly exerciciosService: ExerciciosService) {}

  // GET /api/exercicios
  @Get()
  findAll() {
    return this.exerciciosService.findAll();
  }

  // GET /api/exercicios/:id
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.exerciciosService.findOne(id);
  }

  // POST /api/exercicios
  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.CORPO_CLINICO)
  create(@Body() body: Exercicio) {
    return this.exerciciosService.create(body);
  }

  // PUT /api/exercicios/:id
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CORPO_CLINICO)
  update(@Param('id') id: string, @Body() dados: Partial<Exercicio>) {
    return this.exerciciosService.update(id, dados);
  }

  // DELETE /api/exercicios/:id
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CORPO_CLINICO)
  remove(@Param('id') id: string) {
    return this.exerciciosService.remove(id);
  }
}
