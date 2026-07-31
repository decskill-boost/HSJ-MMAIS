import { NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Repository } from 'typeorm';
import { ROLES_KEY } from '../../auth/decorators/roles.decorator';
import { Prescricao } from '../../entities/prescricao.entity';
import type { PrescricaoExercicio } from '../../entities/prescricao-exercicio.entity';
import type { SessaoRealizada } from '../../entities/sessao-realizada.entity';
import { UserRole } from '../../users/user-role.enum';
import { PrescricoesController } from '../prescricoes.controller';
import { PrescricoesService } from '../prescricoes.service';

const CRIANCA = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const OUTRA_CRIANCA = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
const CLINICO = 'cccccccc-3333-4333-8333-cccccccccccc';
const PLANO = '11111111-1111-4111-8111-111111111111';
const EXERCICIO = 'e1111111-1111-4111-8111-111111111111';

/**
 * A criança passou a poder montar planos seus (PR #76). A forma como isso foi
 * aberto foi pôr `@Roles(CORPO_CLINICO, PACIENTE)` na CLASSE do controlador —
 * o que abriu, de uma vez, o `PUT`, o `DELETE` e o cancelamento de QUALQUER
 * plano a qualquer token de criança. Bastava o id da prescrição de outra
 * criança para lha apagar.
 *
 * Estes testes prendem as duas metades da correção: que rotas cada papel
 * alcança, e o que o serviço faz com o pedido depois de lá chegar.
 */
describe('Planos montados pela própria criança', () => {
  describe('que rotas é que um token de criança alcança', () => {
    const reflector = new Reflector();
    const papeisDe = (handler: string): UserRole[] | undefined =>
      reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
        PrescricoesController.prototype[handler] as () => unknown,
        PrescricoesController,
      ]);

    it('a predefinição da classe é corpo clínico', () => {
      expect(
        reflector.get<UserRole[]>(ROLES_KEY, PrescricoesController),
      ).toEqual([UserRole.CORPO_CLINICO]);
    });

    it.each(['create', 'cancel'])(
      '%s está aberto à criança (é dela o plano)',
      (handler) => {
        expect(papeisDe(handler)).toContain(UserRole.PACIENTE);
      },
    );

    it.each(['update', 'remove'])(
      '%s continua fechado ao corpo clínico',
      (handler) => {
        expect(papeisDe(handler)).toEqual([UserRole.CORPO_CLINICO]);
      },
    );
  });

  describe('o que o serviço faz com o pedido', () => {
    let servico: PrescricoesService;
    let guardado: Partial<Prescricao> | undefined;
    let planoNaBase: Partial<Prescricao> | null;

    beforeEach(() => {
      guardado = undefined;
      planoNaBase = null;

      const prescricaoRepo = {
        create: (dados: Partial<Prescricao>) => dados,
        save: (dados: Partial<Prescricao>) => {
          guardado = dados;
          return Promise.resolve({ ...dados, id_prescricao: PLANO });
        },
        findOne: () => Promise.resolve(planoNaBase),
      } as unknown as Repository<Prescricao>;

      const prescricaoExercicioRepo = {
        create: (dados: unknown) => dados,
        save: () => Promise.resolve([]),
      } as unknown as Repository<PrescricaoExercicio>;

      servico = new PrescricoesService(
        prescricaoRepo,
        prescricaoExercicioRepo,
        {} as unknown as Repository<SessaoRealizada>,
      );
    });

    const corpo = {
      // O que uma criança podia mandar para criar um plano em nome de outra.
      id_paciente: OUTRA_CRIANCA,
      frequencia_semanal: 3,
      is_standard: true,
      exercicios: [EXERCICIO],
    };

    it('uma criança só cria planos PARA SI, seja qual for o id_paciente enviado', async () => {
      await servico.create(corpo, CRIANCA, UserRole.PACIENTE);

      expect(guardado?.id_paciente).toEqual({ id_user: CRIANCA });
      expect(guardado?.id_medico).toEqual({ id_user: CRIANCA });
    });

    it('uma criança não consegue pôr um plano seu no catálogo standard', async () => {
      await servico.create(corpo, CRIANCA, UserRole.PACIENTE);

      expect(guardado?.is_standard).toBe(false);
    });

    it('o corpo clínico continua a prescrever a quem indicar', async () => {
      await servico.create(corpo, CLINICO, UserRole.CORPO_CLINICO);

      expect(guardado?.id_paciente).toEqual({ id_user: OUTRA_CRIANCA });
      expect(guardado?.id_medico).toEqual({ id_user: CLINICO });
      expect(guardado?.is_standard).toBe(true);
    });

    it('a criança arquiva um plano que montou', async () => {
      planoNaBase = {
        id_prescricao: PLANO,
        ativo: true,
        data_fim: null,
        id_paciente: { id_user: CRIANCA },
        id_medico: { id_user: CRIANCA },
      } as unknown as Partial<Prescricao>;

      await servico.cancel(PLANO, CRIANCA, UserRole.PACIENTE);

      expect(guardado?.ativo).toBe(false);
    });

    it('a criança NÃO cancela a prescrição que o médico lhe fez', async () => {
      planoNaBase = {
        id_prescricao: PLANO,
        ativo: true,
        data_fim: null,
        id_paciente: { id_user: CRIANCA },
        id_medico: { id_user: CLINICO },
      } as unknown as Partial<Prescricao>;

      await expect(
        servico.cancel(PLANO, CRIANCA, UserRole.PACIENTE),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(guardado).toBeUndefined();
    });

    it('a criança NÃO cancela o plano de outra criança (e não fica a saber que existe)', async () => {
      planoNaBase = {
        id_prescricao: PLANO,
        ativo: true,
        data_fim: null,
        id_paciente: { id_user: OUTRA_CRIANCA },
        id_medico: { id_user: OUTRA_CRIANCA },
      } as unknown as Partial<Prescricao>;

      await expect(
        servico.cancel(PLANO, CRIANCA, UserRole.PACIENTE),
      ).rejects.toThrow('Prescrição não encontrada.');
      expect(guardado).toBeUndefined();
    });

    it('o corpo clínico cancela qualquer plano', async () => {
      planoNaBase = {
        id_prescricao: PLANO,
        ativo: true,
        data_fim: null,
        id_paciente: { id_user: CRIANCA },
        id_medico: { id_user: CLINICO },
      } as unknown as Partial<Prescricao>;

      await servico.cancel(PLANO, CLINICO, UserRole.CORPO_CLINICO);

      expect(guardado?.ativo).toBe(false);
    });
  });
});
