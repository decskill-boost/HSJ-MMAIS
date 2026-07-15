import {
  Controller,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Post,
} from '@nestjs/common';
import { ExerciciosService } from './exercicios.service';
import { Exercicio } from '../entities/exercicio.entity';

@Controller('exercicios')
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

  @Post()
  create(@Body() body: Exercicio) {
    return this.exerciciosService.create(body);
  }
  // PUT /api/exercicios/:id
  @Put(':id')
  update(@Param('id') id: string, @Body() dados: Partial<Exercicio>) {
    return this.exerciciosService.update(id, dados);
  }

  // DELETE /api/exercicios/:id
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.exerciciosService.remove(id);
  }
}
