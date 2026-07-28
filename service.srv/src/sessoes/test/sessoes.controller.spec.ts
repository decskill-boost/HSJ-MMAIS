import 'reflect-metadata';
import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { ROLES_KEY } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../../auth/supabase-auth.guard';
import { UserRole } from '../../users/user-role.enum';
import { ConcluirExercicioDto } from '../dto/concluir-exercicio.dto';
import { ListarMinhasSessoesQueryDto } from '../dto/listar-minhas-sessoes.dto';
import { SessoesController } from '../sessoes.controller';

const GUARDS_METADATA = '__guards__';

const metodos = ['minhas', 'estatisticas', 'iniciar', 'concluir'] as const;

const handlerDe = (nome: string): object =>
  (SessoesController.prototype as unknown as Record<string, object>)[nome];

const guardasDe = (nome: string): unknown[] => [
  ...((Reflect.getMetadata(GUARDS_METADATA, SessoesController) as unknown[]) ??
    []),
  ...((Reflect.getMetadata(GUARDS_METADATA, handlerDe(nome)) as unknown[]) ??
    []),
];

const tiposDosParametros = (nome: string): unknown[] =>
  (Reflect.getMetadata(
    'design:paramtypes',
    SessoesController.prototype,
    nome,
  ) as unknown[]) ?? [];

describe('SessoesController — cadeia de guardas', () => {
  it('todas as rotas exigem autenticação', () => {
    for (const metodo of metodos) {
      expect(guardasDe(metodo)).toContain(SupabaseAuthGuard);
    }
  });

  /**
   * Detetor do modo de falha ABERTA: `@Roles(...)` sem `RolesGuard` na cadeia
   * não dá erro de compilação nem aviso nenhum — o handler limita-se a
   * responder 200 a quem não devia. Foi medido: um método com
   * `@UseGuards(SupabaseAuthGuard)` e `@Roles(CORPO_CLINICO)` devolveu a
   * resposta inteira a um token de paciente.
   */
  it('nenhum método declara @Roles sem ter o RolesGuard na cadeia', () => {
    const emFalta = metodos.filter((metodo) => {
      const papeis = Reflect.getMetadata(ROLES_KEY, handlerDe(metodo)) as
        | UserRole[]
        | undefined;
      if (!papeis || papeis.length === 0) return false;
      return !guardasDe(metodo).includes(RolesGuard);
    });

    expect(emFalta).toEqual([]);
  });

  it('o histórico da criança é só para pacientes e as estatísticas só para o corpo clínico', () => {
    expect(Reflect.getMetadata(ROLES_KEY, handlerDe('minhas'))).toEqual([
      UserRole.PACIENTE,
    ]);
    expect(Reflect.getMetadata(ROLES_KEY, handlerDe('estatisticas'))).toEqual([
      UserRole.CORPO_CLINICO,
    ]);
  });
});

describe('SessoesController — os DTOs chegam mesmo ao ValidationPipe', () => {
  /**
   * Regressão do furo mais silencioso deste módulo: os DTOs estavam
   * importados com `import type`, o TypeScript elidia a referência e emitia
   * `design:paramtypes: [Object, Function]`. O ValidationPipe global via
   * `Object`, concluía que não havia nada a validar e saltava a classe
   * inteira — `@IsUUID`, `@Max(10)`, os limites de frequência cardíaca e o
   * `whitelist: true` ficavam todos inertes, sem um único aviso.
   */
  it('o tipo do corpo de POST /concluir é a classe do DTO, não Object', () => {
    expect(tiposDosParametros('concluir')[1]).toBe(ConcluirExercicioDto);
  });

  it('o tipo da query de GET /minhas é a classe do DTO, não Object', () => {
    expect(tiposDosParametros('minhas')[1]).toBe(ListarMinhasSessoesQueryDto);
  });

  describe('com o pipe global real e o metatype tirado do controlador', () => {
    // Exatamente a configuração de main.ts.
    const pipe = new ValidationPipe({ whitelist: true, transform: true });
    const metatype = tiposDosParametros('concluir')[1] as new () => object;
    const metatypeQuery = tiposDosParametros('minhas')[1] as new () => object;

    const validarCorpo = (body: unknown): Promise<unknown> =>
      pipe.transform(body, { type: 'body', metatype });

    const validarQuery = (query: unknown): Promise<unknown> =>
      pipe.transform(query, { type: 'query', metatype: metatypeQuery });

    const corpoValido = {
      id_exercicio: '050a0dc5-0000-4000-8000-000000000001',
      id_prescricao: '2f22e589-0000-4000-8000-000000000002',
    };

    it('recusa um esforço de 99999', async () => {
      await expect(
        validarCorpo({ ...corpoValido, esforco_1_a_10: 99999 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('recusa uma frequência cardíaca implausível', async () => {
      await expect(
        validarCorpo({ ...corpoValido, fc_media: 100000 }),
      ).rejects.toThrow(BadRequestException);
    });

    it('recusa um identificador de exercício que não é UUID', async () => {
      await expect(
        validarCorpo({ ...corpoValido, id_exercicio: 'NAO-E-UUID' }),
      ).rejects.toThrow(BadRequestException);
    });

    it('descarta campos que o DTO não declara', async () => {
      const limpo = await validarCorpo({
        ...corpoValido,
        campo_injectado: 'sobrevivi ao whitelist',
      });

      expect(limpo).not.toHaveProperty('campo_injectado');
    });

    it('continua a aceitar um treino sem plano (string vazia), como a página de demonstração envia', async () => {
      await expect(
        validarCorpo({ ...corpoValido, id_prescricao: '' }),
      ).resolves.toMatchObject({ id_prescricao: '' });
    });

    it('converte o limite para número e recusa fora de 1..200', async () => {
      await expect(validarQuery({ limite: '5' })).resolves.toEqual({
        limite: 5,
      });
      await expect(validarQuery({ limite: '0' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(validarQuery({ limite: '500' })).rejects.toThrow(
        BadRequestException,
      );
      await expect(validarQuery({ limite: 'muitas' })).rejects.toThrow(
        BadRequestException,
      );
    });

    it('descarta um id_paciente improvisado na query em vez de o deixar chegar ao serviço', async () => {
      const limpo = await validarQuery({ id_paciente: 'outra-crianca' });

      expect(limpo).not.toHaveProperty('id_paciente');
    });
  });
});
