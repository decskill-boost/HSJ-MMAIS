import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ExerciciosService } from './exercicios.service';
import { ExerciciosController } from './exercicios.controller';

// 1. Importas as entidades necessárias
import { Exercicio } from '../entities/exercicio.entity';
import { Prescricao } from '../entities/prescricao.entity';
import { SessaoRealizada } from '../entities/sessao-realizada.entity';

@Module({
  imports: [
    // 2. Registá-las no forFeature
    TypeOrmModule.forFeature([Exercicio, Prescricao, SessaoRealizada]),
  ],
  providers: [ExerciciosService],
  controllers: [ExerciciosController],
})
export class ExerciciosModule {}
