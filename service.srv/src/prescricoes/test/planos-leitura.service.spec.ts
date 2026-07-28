import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Prescricao } from '../../entities/prescricao.entity';
import {
  IDS_PLANOS_PUBLICOS,
  PlanosLeituraService,
} from '../planos-leitura.service';
import type { LinhaPlano } from '../planos.mapper';

const CRIANCA_A = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const CRIANCA_B = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
const PLANO_1 = '11111111-1111-4111-8111-111111111111';
const PLANO_2 = '22222222-2222-4222-8222-222222222222';
const EXERCICIO_1 = 'e1111111-1111-4111-8111-111111111111';
const EXERCICIO_2 = 'e2222222-2222-4222-8222-222222222222';

interface Chamada {
  metodo: string;
  args: unknown[];
}

/**
 * QueryBuilder falso que devolve linhas e grava o SQL que lhe foi pedido.
 * Serve sobretudo para verificar os filtros de autorização: quais as condições
 * WHERE e que parâmetros lhes foram ligados.
 */
const criarQueryBuilder = (linhas: unknown[]) => {
  const chamadas: Chamada[] = [];
  const qb: Record<string, unknown> = {};

  for (const metodo of [
    'leftJoin',
    'select',
    'addSelect',
    'orderBy',
    'where',
    'andWhere',
    'groupBy',
    'addGroupBy',
  ]) {
    qb[metodo] = (...args: unknown[]) => {
      chamadas.push({ metodo, args });
      return qb;
    };
  }
  qb.getRawMany = () => Promise.resolve(linhas);

  return { qb, chamadas };
};

const criarServico = (linhas: unknown[]) => {
  const { qb, chamadas } = criarQueryBuilder(linhas);
  const repo = {
    createQueryBuilder: jest.fn(() => qb),
  } as unknown as Repository<Prescricao>;
  return { servico: new PlanosLeituraService(repo), chamadas };
};

/** Todas as condições SQL pedidas ao construtor de consultas, concatenadas. */
const sql = (chamadas: Chamada[]) =>
  chamadas
    .filter((c) => c.metodo === 'where' || c.metodo === 'andWhere')
    .map((c) => String(c.args[0]))
    .join(' && ');

/** Todos os parâmetros ligados às condições WHERE. */
const parametros = (chamadas: Chamada[]) =>
  chamadas
    .filter((c) => c.metodo === 'where' || c.metodo === 'andWhere')
    .reduce<
      Record<string, unknown>
    >((acc, c) => ({ ...acc, ...((c.args[1] as object) ?? {}) }), {});

const linha = (over: Partial<LinhaPlano>): LinhaPlano => ({
  id_prescricao: PLANO_1,
  frequencia_semanal: 3,
  notas_medicas: 'Começar devagar.',
  data_inicio: new Date(2025, 5, 1, 10, 0, 0),
  data_validade: null,
  data_fim: null,
  ativo: true,
  dificuldade: 'facil',
  condicao_paciente: 'A',
  condicao_clinica: null,
  is_standard: false,
  id_paciente: CRIANCA_A,
  ex_id_exercicio: null,
  ex_nome_exercicio: null,
  ex_duracao_segundos: null,
  ex_dificuldade_clinica: null,
  ex_recompensa_xp: null,
  ex_url_video: null,
  ex_repeticoes: null,
  ex_materiais_necessarios: null,
  ...over,
});

describe('PlanosLeituraService', () => {
  describe('E1 — planosDoPaciente (o caso mais crítico)', () => {
    it('filtra sempre pelo id que recebe, e esse id é o único parâmetro ligado', async () => {
      const { servico, chamadas } = criarServico([]);

      await servico.planosDoPaciente(CRIANCA_A);

      expect(sql(chamadas)).toContain('"p"."id_paciente" = :idPaciente');
      // Nenhum outro valor entra na consulta: não há canal por onde o id de
      // outra criança possa chegar ao WHERE.
      expect(parametros(chamadas)).toEqual({ idPaciente: CRIANCA_A });
    });

    it('nunca devolve linhas de outra criança quando o id é o da criança A', async () => {
      // Mesmo que a base de dados devolvesse lixo, a asserção fica escrita:
      // com o filtro acima, tudo o que sai pertence a quem pediu.
      const { servico } = criarServico([
        linha({ id_prescricao: PLANO_1, id_paciente: CRIANCA_A }),
      ]);

      const resposta = await servico.planosDoPaciente(CRIANCA_A);

      const todos = [resposta.ativo, ...resposta.historico].filter(Boolean);
      expect(todos).toHaveLength(1);
      expect(resposta.ativo?.id_plano).toBe(PLANO_1);
      expect(JSON.stringify(resposta)).not.toContain(CRIANCA_B);
    });

    it('devolve o plano em vigor mesmo quando ele não tem exercícios', async () => {
      // Era aqui que o caminho antigo falhava: sem linhas na tabela de junção,
      // o plano em vigor desaparecia do ecrã da criança.
      const { servico } = criarServico([
        linha({ id_prescricao: PLANO_1, ativo: true }),
      ]);

      const resposta = await servico.planosDoPaciente(CRIANCA_A);

      expect(resposta.ativo).not.toBeNull();
      expect(resposta.ativo?.ativo).toBe(true);
      expect(resposta.ativo?.exercicios).toEqual([]);
    });

    it('junta os exercícios do plano e aplica a duração da prescrição', async () => {
      const { servico } = criarServico([
        linha({
          ex_id_exercicio: EXERCICIO_1,
          ex_nome_exercicio: 'Saltos',
          ex_duracao_segundos: 600,
          ex_dificuldade_clinica: 'facil',
          ex_recompensa_xp: 10,
          ex_url_video: 'video.mp4',
          ex_repeticoes: 12,
          ex_materiais_necessarios: 'Bola',
        }),
        linha({
          ex_id_exercicio: EXERCICIO_2,
          ex_nome_exercicio: 'Alongar',
          ex_duracao_segundos: 120,
          ex_recompensa_xp: 5,
        }),
      ]);

      const resposta = await servico.planosDoPaciente(CRIANCA_A);

      expect(resposta.ativo?.exercicios).toHaveLength(2);
      expect(resposta.ativo?.exercicios[0]).toEqual({
        id_exercicio: EXERCICIO_1,
        nome_exercicio: 'Saltos',
        duracao_segundos: 600,
        dificuldade_clinica: 'facil',
        recompensa_xp: 10,
        url_video: 'video.mp4',
        repeticoes: 12,
        materiais_necessarios: 'Bola',
      });
    });

    it('escolhe como plano em vigor o primeiro ativo da ordenação por data', async () => {
      const { servico } = criarServico([
        linha({ id_prescricao: PLANO_2, ativo: false }),
        linha({ id_prescricao: PLANO_1, ativo: true }),
      ]);

      const resposta = await servico.planosDoPaciente(CRIANCA_A);

      expect(resposta.ativo?.id_plano).toBe(PLANO_1);
      expect(resposta.historico.map((p) => p.id_plano)).toEqual([PLANO_2]);
    });

    it('não manda para o browser da criança as notas médicas de planos já cancelados', async () => {
      const { servico } = criarServico([
        linha({
          id_prescricao: PLANO_2,
          ativo: false,
          notas_medicas: 'Suspender por neutropenia.',
        }),
      ]);

      const resposta = await servico.planosDoPaciente(CRIANCA_A);

      expect(resposta.historico[0].notas_medicas).toBeNull();
      expect(JSON.stringify(resposta)).not.toContain('neutropenia');
    });

    it('as datas saem sem fuso, como o frontend as lia pelo PostgREST', async () => {
      const { servico } = criarServico([
        linha({ data_inicio: new Date(2025, 6, 1, 10, 30, 0) }),
      ]);

      const resposta = await servico.planosDoPaciente(CRIANCA_A);

      expect(resposta.ativo?.data_inicio).toBe('2025-07-01T10:30:00');
    });
  });

  describe('E2 — planosStandard', () => {
    it('impõe id_paciente IS NULL e ativo, sem parâmetros que o cliente possa mexer', async () => {
      const { servico, chamadas } = criarServico([]);

      await servico.planosStandard();

      expect(sql(chamadas)).toContain('"p"."id_paciente" IS NULL');
      expect(sql(chamadas)).toContain('"p"."ativo" = true');
      expect(parametros(chamadas)).toEqual({});
    });

    it('acrescenta condicao_clinica e is_standard à forma do plano', async () => {
      const { servico } = criarServico([
        linha({
          id_paciente: null,
          is_standard: true,
          condicao_clinica: 'Leucemia',
        }),
      ]);

      const [plano] = await servico.planosStandard();

      expect(plano.is_standard).toBe(true);
      expect(plano.condicao_clinica).toBe('Leucemia');
    });
  });

  describe('E3 — planosPublicos (rota anónima)', () => {
    it('usa a lista de ids do servidor e exige id_paciente IS NULL e ativo', async () => {
      const { servico, chamadas } = criarServico([]);

      await servico.planosPublicos();

      expect(sql(chamadas)).toContain('"p"."id_prescricao" IN (:...ids)');
      expect(sql(chamadas)).toContain('"p"."id_paciente" IS NULL');
      expect(sql(chamadas)).toContain('"p"."ativo" = true');
      expect(parametros(chamadas)).toEqual({ ids: [...IDS_PLANOS_PUBLICOS] });
    });

    it('não deixa sair notas médicas nem identificadores de crianças', async () => {
      const { servico } = criarServico([
        linha({
          id_paciente: null,
          notas_medicas: 'Texto clínico que não pode sair sem sessão.',
          ex_id_exercicio: EXERCICIO_1,
          ex_nome_exercicio: 'Saltos',
          ex_duracao_segundos: 60,
        }),
      ]);

      const planos = await servico.planosPublicos();

      expect(Object.keys(planos[0]).sort()).toEqual(['exercicios', 'id_plano']);
      expect(JSON.stringify(planos)).not.toContain('Texto clínico');
    });
  });

  describe('E4 — planosParaGestao', () => {
    it('agrega a contagem de exercícios e o nome do paciente numa consulta', async () => {
      const { servico, chamadas } = criarServico([
        {
          id_prescricao: PLANO_1,
          frequencia_semanal: 3,
          notas_medicas: null,
          data_inicio: new Date(2025, 6, 1, 9, 0, 0),
          data_validade: null,
          ativo: true,
          dificuldade: 'facil',
          condicao_paciente: 'A',
          is_standard: false,
          id_paciente: CRIANCA_A,
          nome_paciente: 'Criança A',
          // O COUNT do Postgres é bigint e chega como texto.
          total_exercicios: '3',
        },
      ]);

      const [plano] = await servico.planosParaGestao();

      expect(plano.total_exercicios).toBe(3);
      expect(plano.nome_paciente).toBe('Criança A');
      expect(plano.data_inicio).toBe('2025-07-01T09:00:00');
      // Uma consulta agregada: não há uma contagem por plano.
      expect(chamadas.filter((c) => c.metodo === 'groupBy')).toHaveLength(1);
    });

    it('só junta o nome quando a conta é mesmo de um paciente', async () => {
      const { servico, chamadas } = criarServico([]);

      await servico.planosParaGestao();

      const juncoes = chamadas
        .filter((c) => c.metodo === 'leftJoin')
        .map((c) => String(c.args[2]));
      expect(
        juncoes.some((j) =>
          j.includes('"u"."tipo_utilizador" = :tipoPaciente'),
        ),
      ).toBe(true);
    });
  });

  describe('E5 — planoParaEdicao', () => {
    it('responde 404 quando o plano não existe, em vez de rebentar', async () => {
      const { servico } = criarServico([]);

      await expect(servico.planoParaEdicao(PLANO_1)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('mantém a duração por personalizar a null (sem COALESCE)', async () => {
      // Se aqui viesse a duração do catálogo, o ecrã de edição passava a
      // gravá-la como personalização em todos os exercícios do plano.
      const { servico } = criarServico([
        {
          id_prescricao: PLANO_1,
          frequencia_semanal: 2,
          notas_medicas: 'Notas',
          data_validade: new Date(2025, 11, 31, 0, 0, 0),
          ativo: true,
          dificuldade: 'medio',
          condicao_paciente: 'B',
          condicao_clinica: null,
          is_standard: false,
          id_paciente: CRIANCA_A,
          ex_id_exercicio: EXERCICIO_1,
          ex_duracao_segundos: null,
        },
        {
          id_prescricao: PLANO_1,
          frequencia_semanal: 2,
          notas_medicas: 'Notas',
          data_validade: new Date(2025, 11, 31, 0, 0, 0),
          ativo: true,
          dificuldade: 'medio',
          condicao_paciente: 'B',
          condicao_clinica: null,
          is_standard: false,
          id_paciente: CRIANCA_A,
          ex_id_exercicio: EXERCICIO_2,
          ex_duracao_segundos: 90,
        },
      ]);

      const plano = await servico.planoParaEdicao(PLANO_1);

      expect(plano.exercicios).toEqual([
        { id_exercicio: EXERCICIO_1, duracao_segundos: null },
        { id_exercicio: EXERCICIO_2, duracao_segundos: 90 },
      ]);
      expect(plano.data_validade).toBe('2025-12-31T00:00:00');
      expect(plano.dificuldade).toBe('medio');
    });

    it('um plano sem exercícios devolve lista vazia e não 404', async () => {
      const { servico } = criarServico([
        {
          id_prescricao: PLANO_1,
          frequencia_semanal: 2,
          notas_medicas: null,
          data_validade: null,
          ativo: false,
          dificuldade: null,
          condicao_paciente: null,
          condicao_clinica: null,
          is_standard: true,
          id_paciente: null,
          ex_id_exercicio: null,
          ex_duracao_segundos: null,
        },
      ]);

      const plano = await servico.planoParaEdicao(PLANO_1);

      expect(plano.exercicios).toEqual([]);
      expect(plano.is_standard).toBe(true);
      expect(plano.dificuldade).toBe('facil');
    });

    it('filtra pelo id pedido', async () => {
      const { servico, chamadas } = criarServico([]);

      await servico.planoParaEdicao(PLANO_1).catch(() => undefined);

      expect(sql(chamadas)).toContain('"p"."id_prescricao" = :idPrescricao');
      expect(parametros(chamadas)).toEqual({ idPrescricao: PLANO_1 });
    });
  });
});
