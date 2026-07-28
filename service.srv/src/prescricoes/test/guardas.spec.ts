import { ROLES_KEY } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import { PrescricoesModule } from '../prescricoes.module';
import { PrescricoesController } from '../prescricoes.controller';
import { PrescricoesLeituraController } from '../prescricoes-leitura.controller';
import { PrescricoesPublicosController } from '../prescricoes-publicos.controller';

/**
 * `@Roles(...)` sem `RolesGuard` NÃO dá erro de compilação nem aviso nenhum:
 * falha ABERTA, em silêncio. Um handler com `@UseGuards(SupabaseAuthGuard)` e
 * `@Roles(UserRole.CORPO_CLINICO)` responde 200 — com o corpo inteiro — a um
 * token de criança.
 *
 * O teste que já existe (`auth/test/modulos-com-guardas.spec.ts`) só verifica
 * que o módulo arranca, e por isso não apanha isto. Este percorre os handlers
 * dos controladores de prescrições e falha se a cadeia de guardas não fizer
 * sentido — é a rede que faltava agora que o domínio tem quatro rotas de
 * leitura com regras de papel diferentes.
 */

// Chave que o `@UseGuards` do Nest usa para guardar as guardas.
const CHAVE_GUARDAS = '__guards__';
const CHAVE_CAMINHO = 'path';

type Construtor = new (...args: never[]) => object;

const handlers = (
  controlador: Construtor,
): [string, (...a: never[]) => unknown][] => {
  const prototipo = controlador.prototype as Record<string, unknown>;
  return Object.getOwnPropertyNames(prototipo)
    .filter((nome) => nome !== 'constructor')
    .filter((nome) => typeof prototipo[nome] === 'function')
    .map((nome) => [nome, prototipo[nome] as (...a: never[]) => unknown]);
};

const guardasDe = (alvo: object): unknown[] =>
  (Reflect.getMetadata(CHAVE_GUARDAS, alvo) as unknown[] | undefined) ?? [];

const temGuarda = (
  controlador: Construtor,
  handler: object,
  guarda: unknown,
): boolean =>
  guardasDe(handler).includes(guarda) ||
  guardasDe(controlador).includes(guarda);

const temRoles = (controlador: Construtor, handler: object): boolean =>
  Reflect.getMetadata(ROLES_KEY, handler) !== undefined ||
  Reflect.getMetadata(ROLES_KEY, controlador) !== undefined;

const CONTROLADORES_PROTEGIDOS: [string, Construtor][] = [
  ['PrescricoesLeituraController', PrescricoesLeituraController],
  ['PrescricoesController', PrescricoesController],
];

describe('Cadeia de guardas dos controladores de prescrições', () => {
  describe.each(CONTROLADORES_PROTEGIDOS)('%s', (_nome, controlador) => {
    it('tem pelo menos um handler (o teste não passa por estar vazio)', () => {
      expect(handlers(controlador).length).toBeGreaterThan(0);
    });

    it('todos os handlers exigem sessão iniciada', () => {
      const semAuth = handlers(controlador)
        .filter(([, fn]) => !temGuarda(controlador, fn, SupabaseAuthGuard))
        .map(([nome]) => nome);

      expect(semAuth).toEqual([]);
    });

    it('nenhum handler tem @Roles sem o RolesGuard que o faz cumprir', () => {
      const falhaAberta = handlers(controlador)
        .filter(([, fn]) => temRoles(controlador, fn))
        .filter(([, fn]) => !temGuarda(controlador, fn, RolesGuard))
        .map(([nome]) => nome);

      expect(falhaAberta).toEqual([]);
    });

    it('todos os handlers exigem um papel — nenhum fica só em «autenticado»', () => {
      const semPapel = handlers(controlador)
        .filter(([, fn]) => !temRoles(controlador, fn))
        .map(([nome]) => nome);

      expect(semPapel).toEqual([]);
    });
  });

  it('a predefinição da classe de leitura é a mais restritiva', () => {
    // Assim, um método novo que se esqueça do `@Roles` fica fechado ao corpo
    // clínico em vez de aberto a qualquer criança autenticada.
    expect(
      Reflect.getMetadata(ROLES_KEY, PrescricoesLeituraController),
    ).toEqual(['corpo_clinico']);
  });

  describe('PrescricoesPublicosController (a exceção declarada)', () => {
    it('serve uma única rota, e é a dos planos públicos', () => {
      const rotas = handlers(PrescricoesPublicosController).map(
        ([, fn]) => Reflect.getMetadata(CHAVE_CAMINHO, fn) as string,
      );

      expect(rotas).toEqual(['publicos']);
    });

    it('não tem guardas nem papéis — é anónima de propósito', () => {
      expect(guardasDe(PrescricoesPublicosController)).toEqual([]);
      for (const [, fn] of handlers(PrescricoesPublicosController)) {
        expect(guardasDe(fn)).toEqual([]);
        expect(Reflect.getMetadata(ROLES_KEY, fn)).toBeUndefined();
      }
    });
  });

  it('o módulo regista a rota literal anónima antes do controlador com :id', () => {
    // Se `:id` viesse primeiro, `GET /prescricoes/publicos` caía no handler
    // protegido e a página "Experimentar" deixava de funcionar sem sessão.
    const controladores = Reflect.getMetadata(
      'controllers',
      PrescricoesModule,
    ) as Construtor[];

    expect(controladores.indexOf(PrescricoesPublicosController)).toBeLessThan(
      controladores.indexOf(PrescricoesLeituraController),
    );
  });
});
