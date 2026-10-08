import { Controller, Get, UseGuards } from '@nestjs/common';
import { GUARDS_METADATA, PATH_METADATA } from '@nestjs/common/constants';
import { Roles } from '../../auth/decorators/roles.decorator';
import { ROLES_KEY } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import { UserRole } from '../../users/user-role.enum';
import { ExerciciosController } from '../exercicios.controller';

/**
 * `@Roles(...)` sem o `RolesGuard` na cadeia falha ABERTO e em SILÊNCIO: o
 * decorador só escreve metadados, e se nenhuma guarda os for ler o handler
 * responde 200 a quem quer que esteja autenticado. Compila sem aviso nenhum e
 * o `modulos-com-guardas.spec.ts` também não apanha — esse só verifica que o
 * módulo arranca, não o que cada handler exige.
 *
 * Aqui a biblioteca de exercícios é escrita só pelo corpo clínico. Se alguém
 * acrescentar um método com `@Roles` e se esquecer do `@UseGuards(RolesGuard)`,
 * passa a poder escrevê-la qualquer criança com sessão iniciada.
 */

type Metodo = (...args: unknown[]) => unknown;

interface Handler {
  nome: string;
  guardas: unknown[];
  roles: UserRole[] | undefined;
}

/**
 * Lê, para cada rota de um controlador, a cadeia de guardas efetiva (as do
 * método MAIS as da classe) e as roles exigidas. É deliberadamente feito por
 * reflexão sobre os metadados reais do Nest, e não sobre o texto do ficheiro:
 * é assim que o Nest decide em produção.
 */
function lerHandlers(controlador: new (...args: never[]) => object): Handler[] {
  const prototipo = controlador.prototype as Record<string, unknown>;
  const guardasDaClasse: unknown[] =
    (Reflect.getMetadata(GUARDS_METADATA, controlador) as unknown[]) ?? [];
  const rolesDaClasse = Reflect.getMetadata(ROLES_KEY, controlador) as
    | UserRole[]
    | undefined;

  return Object.getOwnPropertyNames(prototipo)
    .filter((nome) => nome !== 'constructor')
    .map((nome) => ({ nome, metodo: prototipo[nome] }))
    .filter(
      (m): m is { nome: string; metodo: Metodo } =>
        typeof m.metodo === 'function' &&
        Reflect.hasMetadata(PATH_METADATA, m.metodo),
    )
    .map(({ nome, metodo }) => ({
      nome,
      guardas: [
        ...guardasDaClasse,
        ...((Reflect.getMetadata(GUARDS_METADATA, metodo) as unknown[]) ?? []),
      ],
      roles:
        (Reflect.getMetadata(ROLES_KEY, metodo) as UserRole[] | undefined) ??
        rolesDaClasse,
    }));
}

/** Handlers que pedem roles mas não têm quem as verifique. */
function handlersQueFalhamAberto(
  controlador: new (...args: never[]) => object,
): string[] {
  return lerHandlers(controlador)
    .filter((h) => h.roles !== undefined && h.roles.length > 0)
    .filter((h) => !h.guardas.includes(RolesGuard))
    .map((h) => h.nome);
}

describe('ExerciciosController: cadeia de guardas de cada rota', () => {
  const handlers = lerHandlers(ExerciciosController);

  it('a leitura por reflexão encontra as rotas todas', () => {
    // Se este teste passasse com zero handlers, os que se seguem eram vácuos.
    expect(handlers.map((h) => h.nome).sort()).toEqual([
      'create',
      'findAll',
      'findOne',
      'remove',
      'update',
    ]);
  });

  it('nenhuma rota da biblioteca fica sem autenticação', () => {
    const semAutenticacao = handlers
      .filter((h) => !h.guardas.includes(SupabaseAuthGuard))
      .map((h) => h.nome);

    expect(semAutenticacao).toEqual([]);
  });

  it('toda a rota que exige roles tem o RolesGuard a verificá-las', () => {
    expect(handlersQueFalhamAberto(ExerciciosController)).toEqual([]);
  });

  it('as escritas continuam reservadas ao corpo clínico', () => {
    const porNome = new Map(handlers.map((h) => [h.nome, h]));

    for (const nome of ['create', 'update', 'remove']) {
      expect(porNome.get(nome)?.roles).toEqual([UserRole.CORPO_CLINICO]);
    }
  });

  /**
   * As crianças precisam da biblioteca (BibliotecaExercicios, CriarPlano), por
   * isso a leitura é de qualquer autenticado. Fica escrito para que passe a ser
   * uma decisão e não um esquecimento.
   */
  it('a leitura não exige role nenhuma, de propósito', () => {
    const porNome = new Map(handlers.map((h) => [h.nome, h]));

    expect(porNome.get('findAll')?.roles).toBeUndefined();
    expect(porNome.get('findOne')?.roles).toBeUndefined();
  });
});

describe('O detetor de falha aberta deteta mesmo', () => {
  // Se o detetor acima estiver partido, os testes anteriores passam sempre.
  // Este controlador de mentira tem exatamente o deslize que se quer apanhar.
  @Controller('teste-deslize')
  @UseGuards(SupabaseAuthGuard)
  class ControladorComDeslize {
    @Get()
    @Roles(UserRole.CORPO_CLINICO) // falta o @UseGuards(RolesGuard)
    rotaAberta() {
      return null;
    }
  }

  @Controller('teste-correto')
  @UseGuards(SupabaseAuthGuard)
  class ControladorCorreto {
    @Get()
    @UseGuards(RolesGuard)
    @Roles(UserRole.CORPO_CLINICO)
    rotaFechada() {
      return null;
    }
  }

  it('assinala o handler com @Roles e sem RolesGuard', () => {
    expect(handlersQueFalhamAberto(ControladorComDeslize)).toEqual([
      'rotaAberta',
    ]);
  });

  it('não assinala o handler com a cadeia completa', () => {
    expect(handlersQueFalhamAberto(ControladorCorreto)).toEqual([]);
  });
});
