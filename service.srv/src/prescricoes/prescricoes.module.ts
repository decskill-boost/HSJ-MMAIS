import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Prescricao } from '../entities/prescricao.entity';
import { PrescricaoExercicio } from '../entities/prescricao-exercicio.entity';
import { PrescricoesController } from './prescricoes.controller';
import { PrescricoesService } from './prescricoes.service';

@Module({
  imports: [TypeOrmModule.forFeature([Prescricao, PrescricaoExercicio])],
  controllers: [PrescricoesController],
  providers: [PrescricoesService],
})
export class PrescricoesModule {}