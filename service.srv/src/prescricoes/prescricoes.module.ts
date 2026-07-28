import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { Exercicio } from '../entities/exercicio.entity';
import { Prescricao } from '../entities/prescricao.entity';
import { PrescricaoExercicio } from '../entities/prescricao-exercicio.entity';
import { SessaoRealizada } from '../entities/sessao-realizada.entity';
import { Utilizador } from '../entities/utilizador.entity';
import { PlanosLeituraService } from './planos-leitura.service';
import { PrescricoesController } from './prescricoes.controller';
import { PrescricoesLeituraController } from './prescricoes-leitura.controller';
import { PrescricoesPublicosController } from './prescricoes-publicos.controller';
import { PrescricoesService } from './prescricoes.service';

@Module({
  // AuthModule traz as guardas usadas no controlador. Sem isto o Nest não as
  // consegue resolver e a aplicação inteira deixa de arrancar.
  // UsersModule é igualmente obrigatório: o RolesGuard injeta o UsersService e
  // o Nest resolve-o no contexto de quem usa a guarda.
  //
  // `Exercicio`, `Utilizador` e `SessaoRealizada` entram no forFeature porque
  // as consultas de leitura fazem JOIN a essas tabelas e a eliminação de um
  // plano precisa de contar os treinos já feitos.
  imports: [
    TypeOrmModule.forFeature([
      Prescricao,
      PrescricaoExercicio,
      Exercicio,
      Utilizador,
      SessaoRealizada,
    ]),
    AuthModule,
    UsersModule,
  ],
  // A ORDEM IMPORTA. O Nest resolve as rotas pela ordem de registo:
  //   1. PrescricoesPublicosController — rota literal `publicos` (anónima);
  //   2. PrescricoesLeituraController  — `meus`, `standard`, `` e `:id`;
  //   3. PrescricoesController         — escritas.
  // Se `:id` fosse registado antes, `GET /prescricoes/publicos` passava pelo
  // handler protegido de `:id` (e dava 400 no ParseUUIDPipe) em vez de servir
  // os planos de demonstração.
  controllers: [
    PrescricoesPublicosController,
    PrescricoesLeituraController,
    PrescricoesController,
  ],
  providers: [PrescricoesService, PlanosLeituraService],
})
export class PrescricoesModule {}
