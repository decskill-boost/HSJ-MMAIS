import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { ExerciciosModule } from '../../exercicios/exercicios.module';
import { PacientesModule } from '../../pacientes/pacientes.module';
import { PrescricoesModule } from '../../prescricoes/prescricoes.module';
import { SessoesModule } from '../../sessoes/sessoes.module';
import { Exercicio } from '../../entities/exercicio.entity';
import { Perfil } from '../../entities/perfil.entity';
import { Permissao } from '../../entities/permissao.entity';
import { Prescricao } from '../../entities/prescricao.entity';
import { Recompensa } from '../../entities/recompensa.entity';
import { PrescricaoExercicio } from '../../entities/prescricao-exercicio.entity';
import { SessaoRealizada } from '../../entities/sessao-realizada.entity';
import { Utilizador } from '../../entities/utilizador.entity';
import { RolesGuard } from '../guards/roles.guard';
import { SupabaseAuthGuard } from '../supabase-auth.guard';

/**
 * Pôr `@UseGuards(...)` num controlador não chega: o módulo tem de importar o
 * `AuthModule` **e** o `UsersModule` — o `RolesGuard` injeta o `UsersService` e
 * o Nest resolve-o no contexto de quem usa a guarda. Sem isso o Nest não
 * consegue resolver as guardas e a aplicação INTEIRA deixa de arrancar — todas
 * as rotas passam a 500, incluindo as que não têm guardas nenhumas.
 *
 * Isto compila sem qualquer erro (o TypeScript não verifica injeção de
 * dependências) e passou despercebido até chegar a produção. Este teste monta
 * o grafo de módulos a sério, que é onde a falha aparece.
 *
 * TODOS os módulos que usam guardas têm de estar na lista abaixo. Um módulo
 * novo que fique de fora não está coberto por nada.
 */

/**
 * O `SessoesService` injeta a `DataSource` (transações da conclusão de treino)
 * e aqui não há `TypeOrmModule.forRoot()`. Uma falsa, global, fecha o grafo
 * sem ligação a base de dados nenhuma.
 */
@Global()
@Module({
  providers: [{ provide: getDataSourceToken(), useValue: {} }],
  exports: [getDataSourceToken()],
})
class DataSourceFalsaModule {}

describe('Módulos que usam guardas conseguem arrancar', () => {
  const REPOSITORIOS = [
    Exercicio,
    Perfil,
    Permissao,
    Prescricao,
    PrescricaoExercicio,
    Recompensa,
    SessaoRealizada,
    Utilizador,
  ];

  const compilar = (modulo: new () => unknown) => {
    // Na aplicação o ConfigModule é global (AppModule); aqui tem de ser
    // registado à mão para o grafo ficar igual ao real.
    let construtor = Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }),
        DataSourceFalsaModule,
        modulo,
      ],
    })
      .overrideProvider(ConfigService)
      .useValue({
        get: () => undefined,
        getOrThrow: () => 'https://exemplo.supabase.co',
      });

    for (const entidade of REPOSITORIOS) {
      construtor = construtor
        .overrideProvider(getRepositoryToken(entidade))
        .useValue({});
    }

    return construtor.compile();
  };

  it.each([
    ['PrescricoesModule', PrescricoesModule],
    ['ExerciciosModule', ExerciciosModule],
    ['SessoesModule', SessoesModule],
    ['PacientesModule', PacientesModule],
  ])('%s resolve as guardas do seu controlador', async (_nome, modulo) => {
    const compilado = await compilar(modulo);

    // Se o módulo não importar o AuthModule/UsersModule, o compile() acima já
    // teria rebentado; estas asserções tornam o motivo explícito.
    expect(compilado.get(SupabaseAuthGuard, { strict: false })).toBeDefined();
    expect(compilado.get(RolesGuard, { strict: false })).toBeDefined();

    await compilado.close();
  });
});
