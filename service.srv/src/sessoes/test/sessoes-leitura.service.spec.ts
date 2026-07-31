import { BadRequestException } from '@nestjs/common';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { Test } from '@nestjs/testing';
import { Exercicio } from '../../entities/exercicio.entity';
import { Prescricao } from '../../entities/prescricao.entity';
import {
  SessaoRealizada,
  SessaoStatus,
} from '../../entities/sessao-realizada.entity';
import { Utilizador } from '../../entities/utilizador.entity';
import { SessoesService } from '../sessoes.service';

type FindOptions = {
  where: {
    id_paciente?: { id_user?: string };
    status?: SessaoStatus;
  };
  order?: Record<string, unknown>;
  take?: number;
};

/**
 * A data é construída a partir de componentes LOCAIS de propósito: é assim que
 * o controlador de `pg` devolve um `timestamp` sem fuso, e é o que torna a
 * asserção do formato independente do fuso de quem corre os testes.
 */
const DATA_DO_TREINO = new Date(2026, 6, 20, 10, 30, 0, 0);

const linha = (overrides: Partial<SessaoRealizada> = {}): SessaoRealizada =>
  ({
    id_sessao: 'sessao-1',
    data_hora: DATA_DO_TREINO,
    duracao: 600,
    esforco_1_a_10: 4,
    id_exercicio: { nome_exercicio: 'Braços', recompensa_xp: 10 } as Exercicio,
    ...overrides,
  }) as SessaoRealizada;

describe('SessoesService — leituras (E10 e E11)', () => {
  let service: SessoesService;
  let sessaoRepo: { find: jest.Mock; createQueryBuilder: jest.Mock };
  let queryBuilder: {
    select: jest.Mock;
    addSelect: jest.Mock;
    where: jest.Mock;
    setParameter: jest.Mock;
    getRawOne: jest.Mock;
  };

  beforeEach(async () => {
    queryBuilder = {
      select: jest.fn().mockReturnThis(),
      addSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      setParameter: jest.fn().mockReturnThis(),
      getRawOne: jest.fn(),
    };

    const module = await Test.createTestingModule({
      providers: [
        SessoesService,
        {
          provide: getRepositoryToken(SessaoRealizada),
          useValue: {
            find: jest.fn().mockResolvedValue([]),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(() => queryBuilder),
          },
        },
        {
          provide: getRepositoryToken(Exercicio),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Utilizador),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(Prescricao),
          useValue: { findOne: jest.fn() },
        },
        { provide: getDataSourceToken(), useValue: { transaction: jest.fn() } },
      ],
    }).compile();

    service = module.get(SessoesService);
    sessaoRepo = module.get(getRepositoryToken(SessaoRealizada));
  });

  describe('listarMinhasSessoes (E10)', () => {
    const opcoesDaConsulta = (): FindOptions => {
      const chamadas = sessaoRepo.find.mock.calls as unknown as FindOptions[][];
      return chamadas[0][0];
    };

    /**
     * A regra que mais importa neste ficheiro: o histórico é sempre o de quem
     * pediu. O id chega de `payload.sub` e não há caminho por onde o cliente
     * possa substituí-lo — mas convém que fique um teste a dizê-lo, porque
     * hoje quem impede a criança A de ler as sessões de B é apenas o RLS.
     */
    it('filtra sempre pelo paciente autenticado', async () => {
      await service.listarMinhasSessoes('paciente-A');

      expect(opcoesDaConsulta().where.id_paciente).toEqual({
        id_user: 'paciente-A',
      });
    });

    it('nunca aceita um id de paciente diferente do autenticado — não há por onde o passar', async () => {
      // A assinatura só tem (idPaciente, limite): o segundo argumento é um
      // número. Se algum dia alguém acrescentar aqui um filtro de paciente
      // vindo do cliente, este teste deixa de fazer sentido — e é esse o
      // aviso que se quer.
      expect(service.listarMinhasSessoes.length).toBe(2);

      await service.listarMinhasSessoes('paciente-A', 5);
      expect(opcoesDaConsulta().where.id_paciente).toEqual({
        id_user: 'paciente-A',
      });
    });

    it('devolve apenas sessões concluídas, da mais recente para a mais antiga', async () => {
      await service.listarMinhasSessoes('paciente-A');

      const opcoes = opcoesDaConsulta();
      expect(opcoes.where.status).toBe(SessaoStatus.CONCLUIDO);
      expect(opcoes.order).toEqual({ data_hora: 'DESC' });
    });

    it('aplica o limite quando é pedido e não o aplica quando não é', async () => {
      await service.listarMinhasSessoes('paciente-A', 1);
      expect(opcoesDaConsulta().take).toBe(1);

      sessaoRepo.find.mockClear();
      await service.listarMinhasSessoes('paciente-A');
      expect(opcoesDaConsulta().take).toBeUndefined();
    });

    /**
     * O formato da data não é detalhe: o ecrã inicial da criança faz
     * `new Date(data_hora).toLocaleString(...)`. Com «Z», o instante só sai
     * certo enquanto o fuso do servidor for igual ao do browser — e em
     * produção o servidor corre em UTC e a criança está em Lisboa. Tem de ser
     * hora de parede, a mesma que `GET /pacientes/:id/sessoes` devolve.
     */
    it('achata o nome e o XP do exercício e serializa a data como hora de parede (sem Z)', async () => {
      sessaoRepo.find.mockResolvedValue([linha()]);

      const resultado = await service.listarMinhasSessoes('paciente-A');

      expect(resultado).toEqual([
        {
          id_sessao: 'sessao-1',
          data_hora: '2026-07-20T10:30:00.000',
          duracao: 600,
          esforco_1_a_10: 4,
          nome_exercicio: 'Braços',
          recompensa_xp: 10,
        },
      ]);
    });

    it('a data faz ida e volta sem desvio, seja qual for o fuso do servidor', async () => {
      sessaoRepo.find.mockResolvedValue([linha()]);

      const [sessao] = await service.listarMinhasSessoes('paciente-A');

      expect(sessao.data_hora).not.toMatch(/Z$/);
      expect(new Date(sessao.data_hora).getTime()).toBe(
        DATA_DO_TREINO.getTime(),
      );
    });

    it('não rebenta quando o exercício associado desapareceu', async () => {
      sessaoRepo.find.mockResolvedValue([
        linha({ id_exercicio: null as unknown as Exercicio }),
      ]);

      const resultado = await service.listarMinhasSessoes('paciente-A');

      expect(resultado[0]).toMatchObject({
        nome_exercicio: 'Exercício',
        recompensa_xp: 0,
      });
    });

    it('recusa um identificador de paciente vazio em vez de listar o hospital inteiro', async () => {
      await expect(service.listarMinhasSessoes('   ')).rejects.toThrow(
        BadRequestException,
      );
      expect(sessaoRepo.find).not.toHaveBeenCalled();
    });
  });

  describe('getEstatisticas (E11)', () => {
    it('conta só as sessões concluídas e devolve números, não texto', async () => {
      queryBuilder.getRawOne.mockResolvedValue({
        total: '1234',
        ultimos7dias: '56',
      });

      const resultado = await service.getEstatisticas();

      expect(resultado).toEqual({
        totalConcluidas: 1234,
        concluidasUltimos7Dias: 56,
      });
      expect(queryBuilder.where).toHaveBeenCalledWith('s.status = :status', {
        status: SessaoStatus.CONCLUIDO,
      });
    });

    it('calcula a fronteira dos 7 dias no servidor, não a recebe de fora', async () => {
      queryBuilder.getRawOne.mockResolvedValue({
        total: '0',
        ultimos7dias: '0',
      });
      const antes = Date.now();

      await service.getEstatisticas();

      expect(service.getEstatisticas.length).toBe(0);
      const [, valor] = queryBuilder.setParameter.mock.calls[0] as [
        string,
        Date,
      ];
      const distanciaEmDias = (antes - valor.getTime()) / (24 * 60 * 60 * 1000);
      expect(distanciaEmDias).toBeGreaterThanOrEqual(7);
      expect(distanciaEmDias).toBeLessThan(7.001);
    });

    it('não devolve qualquer identificador de criança', async () => {
      queryBuilder.getRawOne.mockResolvedValue({
        total: '3',
        ultimos7dias: '1',
      });

      const resultado = await service.getEstatisticas();

      expect(Object.keys(resultado).sort()).toEqual([
        'concluidasUltimos7Dias',
        'totalConcluidas',
      ]);
    });

    it('devolve zeros em vez de NaN quando a tabela está vazia', async () => {
      queryBuilder.getRawOne.mockResolvedValue(undefined);

      await expect(service.getEstatisticas()).resolves.toEqual({
        totalConcluidas: 0,
        concluidasUltimos7Dias: 0,
      });
    });
  });
});
