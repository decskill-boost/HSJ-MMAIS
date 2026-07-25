import { ConfigModule, ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ExerciciosModule } from '../../exercicios/exercicios.module';
import { PrescricoesModule } from '../../prescricoes/prescricoes.module';
import { Exercicio } from '../../entities/exercicio.entity';
import { Perfil } from '../../entities/perfil.entity';
import { Permissao } from '../../entities/permissao.entity';
import { Prescricao } from '../../entities/prescricao.entity';
import { PrescricaoExercicio } from '../../entities/prescricao-exercicio.entity';
import { SessaoRealizada } from '../../entities/sessao-realizada.entity';
import { Utilizador } from '../../entities/utilizador.entity';
import { RolesGuard } from '../guards/roles.guard';
import { SupabaseAuthGuard } from '../supabase-auth.guard';

/**
 * Pôr `@UseGuards(...)` num controlador não chega: o módulo tem de importar o
 * `AuthModule`, senão o Nest não consegue resolver as guardas e a aplicação
 * INTEIRA deixa de arrancar — todas as rotas passam a 500, incluindo as que
 * não têm guardas nenhumas.
 *
 * Isto compila sem qualquer erro (o TypeScript não verifica injeção de
 * dependências) e passou despercebido até chegar a produção. Este teste monta
 * o grafo de módulos a sério, que é onde a falha aparece.
 */
describe('Módulos que usam guardas conseguem arrancar', () => {
  const REPOSITORIOS = [
    Exercicio,
    Perfil,
    Permissao,
    Prescricao,
    PrescricaoExercicio,
    SessaoRealizada,
    Utilizador,
  ];

  const compilar = (modulo: new () => unknown) => {
    // Na aplicação o ConfigModule é global (AppModule); aqui tem de ser
    // registado à mão para o grafo ficar igual ao real.
    let construtor = Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true }), modulo],
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
  ])('%s resolve as guardas do seu controlador', async (_nome, modulo) => {
    const compilado = await compilar(modulo as new () => unknown);

    // Se o módulo não importar o AuthModule, o compile() acima já teria
    // rebentado; estas asserções tornam o motivo explícito.
    expect(compilado.get(SupabaseAuthGuard, { strict: false })).toBeDefined();
    expect(compilado.get(RolesGuard, { strict: false })).toBeDefined();

    await compilado.close();
  });
});
