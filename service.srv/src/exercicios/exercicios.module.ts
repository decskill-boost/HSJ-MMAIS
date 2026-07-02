import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercicio } from '../entities/exercicio.entity';
import { ExerciciosController } from './exercicios.controller';
import { ExerciciosService } from './exercicios.service';

@Module({
  imports: [TypeOrmModule.forFeature([Exercicio])],
  controllers: [ExerciciosController],
  providers: [ExerciciosService],
})
export class ExerciciosModule {}