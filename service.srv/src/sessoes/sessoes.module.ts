import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Exercicio } from '../entities/exercicio.entity';
import { Prescricao } from '../entities/prescricao.entity';
import { SessaoRealizada } from '../entities/sessao-realizada.entity';
import { Utilizador } from '../entities/utilizador.entity';
import { UsersModule } from '../users/users.module';
import { SessoesController } from './sessoes.controller';
import { SessoesService } from './sessoes.service';

/**
 * `AuthModule` **e** `UsersModule` são obrigatórios: o `RolesGuard` injeta o
 * `UsersService` e o Nest resolve-o no contexto de quem usa a guarda. Até
 * agora este módulo safava-se sem eles porque só usava o `SupabaseAuthGuard`
 * (que depende apenas do `ConfigService`, global). A partir do momento em que
 * `GET /sessoes/minhas` e `GET /sessoes/estatisticas` passam pelo
 * `RolesGuard`, esquecer estes imports faz a aplicação INTEIRA deixar de
 * arrancar — todas as rotas a 500, não só as deste módulo. Ver
 * `test/sessoes.module.spec.ts`.
 */
@Module({
  imports: [
    TypeOrmModule.forFeature([
      SessaoRealizada,
      Exercicio,
      Utilizador,
      Prescricao,
    ]),
    AuthModule,
    UsersModule,
  ],
  providers: [SessoesService],
  controllers: [SessoesController],
})
export class SessoesModule {}
