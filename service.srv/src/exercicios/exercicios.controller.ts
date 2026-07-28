import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Post,
  UseGuards,
  NotFoundException,
  ParseUUIDPipe,
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

  /**
   * GET /api/exercicios/:id
   *
   * O `:id` vem da barra de endereços, logo é texto escolhido pelo cliente. Sem
   * o `ParseUUIDPipe`, um valor que não seja UUID viajava até ao Postgres e
   * voltava como 500 (`invalid input syntax for type uuid`); agora é um 400
   * antes de se tocar na base de dados.
   *
   * Um id válido mas inexistente devolvia 200 com corpo vazio, porque o serviço
   * devolve `null`. Passa a 404, que é o que o cliente consegue distinguir.
   */
  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    const exercicio = await this.exerciciosService.findOne(id);

    if (!exercicio) {
      throw new NotFoundException('Exercício não encontrado.');
    }

    return exercicio;
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
  // O `:id` é validado como UUID pelo mesmo motivo do GET: sem isso um id
  // inválido só era rejeitado pelo Postgres, já dentro do pedido de escrita.
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dados: UpdateExercicioDto,
  ) {
    return this.exerciciosService.update(id, dados);
  }

  // DELETE /api/exercicios/:id
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.CORPO_CLINICO)
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.exerciciosService.remove(id);
  }
}
