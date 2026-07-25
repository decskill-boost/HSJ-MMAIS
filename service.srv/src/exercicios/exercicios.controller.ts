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
import { CreateExercicioDto } from './dto/create-exercicio.dto';
import { UpdateExercicioDto } from './dto/update-exercicio.dto';

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
  // O tipo tem de ser o DTO, não a entidade: ver CreateExercicioDto.
  create(@Body() body: CreateExercicioDto) {
    return this.exerciciosService.create(body);
  }

  // PUT /api/exercicios/:id
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CORPO_CLINICO)
  // Tal como no create, o tipo tem de ser o DTO: `Partial<Exercicio>` chega
  // ao ValidationPipe como `Object` e o pipe ignora-o.
  update(@Param('id') id: string, @Body() dados: UpdateExercicioDto) {
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
