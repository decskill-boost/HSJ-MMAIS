import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { Prescricao } from '../entities/prescricao.entity';
import { PrescricaoExercicio } from '../entities/prescricao-exercicio.entity';
import { PrescricoesController } from './prescricoes.controller';
import { PrescricoesService } from './prescricoes.service';

@Module({
  // AuthModule traz as guardas usadas no controlador. Sem isto o Nest não as
  // consegue resolver e a aplicação inteira deixa de arrancar.
  imports: [
    TypeOrmModule.forFeature([Prescricao, PrescricaoExercicio]),
    AuthModule,
    UsersModule,
  ],
  controllers: [PrescricoesController],
  providers: [PrescricoesService],
})
export class PrescricoesModule {}