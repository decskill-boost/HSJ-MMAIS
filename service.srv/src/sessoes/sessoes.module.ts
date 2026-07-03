import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercicio } from '../entities/exercicio.entity';
import { SessaoRealizada } from '../entities/sessao-realizada.entity';
import { Utilizador } from '../entities/utilizador.entity';
import { SessoesController } from './sessoes.controller';
import { SessoesService } from './sessoes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([SessaoRealizada, Exercicio, Utilizador]),
  ],
  providers: [SessoesService],
  controllers: [SessoesController],
})
export class SessoesModule {}