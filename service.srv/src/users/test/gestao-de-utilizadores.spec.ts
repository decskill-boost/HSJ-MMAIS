import { ROLES_KEY } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import { UserRole } from '../user-role.enum';
import { UsersController } from '../users.controller';

/** Chave que o `@UseGuards` do Nest usa para guardar as guardas. */
const CHAVE_GUARDAS = '__guards__';

const guardasDe = (alvo: object): unknown[] =>
  (Reflect.getMetadata(CHAVE_GUARDAS, alvo) as unknown[] | undefined) ?? [];

const handler = (nome: string): object =>
  (UsersController.prototype as unknown as Record<string, object>)[nome];

/**
 * O que o `RolesGuard` veria: o `@Roles` do handler manda sobre o da classe.
 * Lido com `Reflect` e não com o `Reflector` do Nest porque este último exige
 * `Function | Type` nos alvos e um método do protótipo não satisfaz o tipo.
 */
const papeisDe = (nome: string): UserRole[] | undefined =>
  (Reflect.getMetadata(ROLES_KEY, handler(nome)) as UserRole[] | undefined) ??
  (Reflect.getMetadata(ROLES_KEY, UsersController) as UserRole[] | undefined);

/**
 * Requisito de produto: a gestão de utilizadores vive no corpo clínico — quem é
 * clínico é também administrador da plataforma. Não é uma escolha de
 * implementação que se possa apertar sem se dar por isso: se alguém puser
 * `@Roles(ADMIN)` outra vez, o ecrã continua a aparecer no menu do clínico e a
 * falhar com 403 só quando ele o abrir.
 *
 * O contrário — o admin entrar nos ecrãs clínicos — não faz parte do pedido e
 * fica de fora de propósito: são dados de crianças em tratamento.
 */
describe('Gestão de utilizadores (UsersController)', () => {
  const ESCRITAS_E_LEITURA = ['findAll', 'create', 'update', 'remove'];

  it.each(ESCRITAS_E_LEITURA)(
    '%s está aberto ao corpo clínico e ao admin',
    (nome) => {
      const papeis = papeisDe(nome);
      expect(papeis).toContain(UserRole.CORPO_CLINICO);
      expect(papeis).toContain(UserRole.ADMIN);
    },
  );

  it.each(ESCRITAS_E_LEITURA)('%s não fica aberto a mais ninguém', (nome) => {
    expect(papeisDe(nome)?.slice().sort()).toEqual(
      [UserRole.ADMIN, UserRole.CORPO_CLINICO].sort(),
    );
  });

  it.each(ESCRITAS_E_LEITURA)(
    '%s tem o RolesGuard que faz o @Roles cumprir',
    (nome) => {
      // `@Roles` sem `RolesGuard` não dá erro nenhum: falha ABERTA, em
      // silêncio, e qualquer sessão iniciada passa.
      expect(guardasDe(handler(nome))).toContain(RolesGuard);
    },
  );

  it('toda a gente que chega aqui tem sessão iniciada', () => {
    expect(guardasDe(UsersController)).toContain(SupabaseAuthGuard);
  });

  it('o próprio perfil não exige papel nenhum — só sessão', () => {
    // `GET /users/me` e `/me/progresso` servem qualquer utilizador
    // autenticado: o id sai do token e ninguém consegue pedir o de outro.
    expect(papeisDe('getMe')).toBeUndefined();
    expect(papeisDe('getProgresso')).toBeUndefined();
  });
});
