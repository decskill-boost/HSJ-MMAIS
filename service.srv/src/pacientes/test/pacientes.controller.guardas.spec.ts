import 'reflect-metadata';
import { ROLES_KEY } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import { PacientesController } from '../pacientes.controller';

/**
 * Detetor do modo de falha ABERTA das guardas.
 *
 * `@Roles(...)` num método sem `RolesGuard` na cadeia não dá erro de compilação
 * nem aviso nenhum — a rota simplesmente responde 200 a quem não devia. Foi
 * medido contra o servidor real: um handler com `@UseGuards(SupabaseAuthGuard)`
 * e `@Roles(UserRole.CORPO_CLINICO)` devolveu a resposta inteira a um token de
 * `paciente`.
 *
 * O `auth/test/modulos-com-guardas.spec.ts` não apanha isto (só verifica que o
 * módulo arranca). Este teste percorre TODOS os handlers do controlador e falha
 * quando um deles pede um papel que ninguém verifica — ou quando um método novo
 * nasce sem autenticação.
 *
 * Nota: o ideal é este detetor correr sobre todos os controladores da
 * aplicação, num ficheiro em `src/auth/test/`. Aqui cobre o que este módulo
 * serve, que são dados clínicos de crianças.
 */
const GUARDS_KEY = '__guards__';

type Alvo = object;

function guardasDe(alvo: Alvo): unknown[] {
  return (Reflect.getMetadata(GUARDS_KEY, alvo) as unknown[] | undefined) ?? [];
}

function papeisDe(alvo: Alvo): unknown {
  return Reflect.getMetadata(ROLES_KEY, alvo);
}

describe('PacientesController — cadeia de guardas de cada rota', () => {
  const prototipo = PacientesController.prototype as unknown as Record<
    string,
    unknown
  >;

  const handlers = Object.getOwnPropertyNames(PacientesController.prototype)
    .filter((nome) => nome !== 'constructor')
    .filter((nome) => typeof prototipo[nome] === 'function')
    .map((nome) => [nome, prototipo[nome] as Alvo] as const);

  const guardasDaClasse = guardasDe(PacientesController);
  const papeisDaClasse = papeisDe(PacientesController);

  it('o controlador tem handlers (o teste não está a passar por vazio)', () => {
    expect(handlers.length).toBeGreaterThan(0);
  });

  it.each(handlers.map(([nome]) => nome))('%s exige autenticação', (nome) => {
    const handler = prototipo[nome] as Alvo;
    const cadeia = [...guardasDaClasse, ...guardasDe(handler)];
    expect(cadeia).toContain(SupabaseAuthGuard);
  });

  it.each(handlers.map(([nome]) => nome))(
    '%s: se pede um papel, tem o RolesGuard que o verifica',
    (nome) => {
      const handler = prototipo[nome] as Alvo;
      const papeis = papeisDe(handler) ?? papeisDaClasse;
      if (!papeis) {
        return;
      }
      const cadeia = [...guardasDaClasse, ...guardasDe(handler)];
      expect(cadeia).toContain(RolesGuard);
    },
  );

  it('nenhuma rota deste controlador dispensa o papel corpo_clinico', () => {
    // Se um dia for preciso abrir uma rota daqui a outro papel, esta asserção
    // obriga a que a exceção seja escrita de propósito, não herdada por
    // distração.
    expect(papeisDaClasse).toEqual(['corpo_clinico']);
    for (const [, handler] of handlers) {
      const papeisDoHandler = papeisDe(handler);
      if (papeisDoHandler !== undefined) {
        expect(papeisDoHandler).toEqual(['corpo_clinico']);
      }
    }
  });
});
