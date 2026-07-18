import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Prescricao } from '../entities/prescricao.entity';
import { SessaoRealizada } from '../entities/sessao-realizada.entity';
import { Utilizador } from '../entities/utilizador.entity';
import { UsersModule } from '../users/users.module';
import { PacientesController } from './pacientes.controller';
import { PacientesService } from './pacientes.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Utilizador, Prescricao, SessaoRealizada]),
    AuthModule,
    UsersModule,
  ],
  controllers: [PacientesController],
  providers: [PacientesService],
})
export class PacientesModule {}
