import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Exercicio } from '../entities/exercicio.entity';
import { Prescricao } from '../entities/prescricao.entity';
import { PrescricaoExercicio } from '../entities/prescricao-exercicio.entity';
import { Utilizador } from '../entities/utilizador.entity';
import { UserRole } from '../users/user-role.enum';
import {
  paraNumero,
  paraNumeroOuNulo,
  paraTimestampSemFuso,
} from './data.util';
import {
  LinhaPlano,
  LinhaPlanoGerido,
  agruparPlanos,
  estaAtivo,
  paraPlanoDoHistorico,
  paraPlanoDoPaciente,
  paraPlanoGerido,
  paraPlanoStandard,
} from './planos.mapper';
import type {
  PlanoGerido,
  PlanoParaEdicao,
  PlanoPublico,
  PlanoStandard,
  PlanosDoPaciente,
} from './planos.types';

/**
 * Planos de demonstração da página "Experimentar", que é servida SEM sessão
 * iniciada (a rota /experimentar está fora do ProtectedRoute).
 *
 * A lista vive AQUI, no servidor, e nunca em query string: numa rota sem
 * qualquer guarda, esta constante é a única coisa entre dois planos de
 * demonstração e as prescrições reais das crianças. Antes estava no bundle do
 * frontend, onde qualquer pessoa a podia trocar.
 */
export const IDS_PLANOS_PUBLICOS: readonly string[] = [
  '050a0dc5-f3bf-48c2-ab0d-8558b10f0daf',
  '2f22e589-e54e-497f-9ac3-d85953a8ce73',
];

@Injectable()
export class PlanosLeituraService {
  constructor(
    @InjectRepository(Prescricao)
    private readonly prescricaoRepo: Repository<Prescricao>,
  ) {}

  /**
   * Base comum a E1/E2/E3: prescrições com os respetivos exercícios numa só
   * consulta.
   *
   * `Prescricao` não tem `@OneToMany` para `PrescricaoExercicio` (só existe o
   * lado `ManyToOne`), por isso o JOIN é escrito à mão. Sem isto o caminho
   * natural seria um `find` por prescrição — um N+1 no servidor, precisamente
   * onde antes havia 3 viagens fixas do browser.
   *
   * As colunas são referidas em SQL citado ("p"."x") para não depender de como
   * o TypeORM resolve nomes de propriedades de relações.
   */
  private queryPlanosComExercicios(): SelectQueryBuilder<Prescricao> {
    return (
      this.prescricaoRepo
        .createQueryBuilder('p')
        .leftJoin(
          PrescricaoExercicio,
          'pe',
          '"pe"."id_prescricao" = "p"."id_prescricao"',
        )
        .leftJoin(Exercicio, 'e', '"e"."id_exercicio" = "pe"."id_exercicio"')
        .select('"p"."id_prescricao"', 'id_prescricao')
        .addSelect('"p"."nome"', 'nome')
        .addSelect('"p"."frequencia_semanal"', 'frequencia_semanal')
        .addSelect('"p"."notas_medicas"', 'notas_medicas')
        .addSelect('"p"."data_inicio"', 'data_inicio')
        .addSelect('"p"."data_validade"', 'data_validade')
        .addSelect('"p"."data_fim"', 'data_fim')
        .addSelect('"p"."ativo"', 'ativo')
        .addSelect('"p"."dificuldade"', 'dificuldade')
        .addSelect('"p"."condicao_paciente"', 'condicao_paciente')
        .addSelect('"p"."condicao_clinica"', 'condicao_clinica')
        .addSelect('"p"."is_standard"', 'is_standard')
        .addSelect('"p"."id_paciente"', 'id_paciente')
        // Serve para saber quem montou o plano: se o autor é o próprio
        // paciente, foi a criança. Ver `criadoPeloPaciente` no mapper.
        .addSelect('"p"."id_medico"', 'id_medico')
        .addSelect('"e"."id_exercicio"', 'ex_id_exercicio')
        .addSelect('"e"."nome_exercicio"', 'ex_nome_exercicio')
        // A duração da prescrição manda sobre a do catálogo; sem valor próprio
        // vale a do exercício. É o mesmo COALESCE que o frontend fazia à mão.
        .addSelect(
          'COALESCE("pe"."duracao_segundos", "e"."duracao_segundos")',
          'ex_duracao_segundos',
        )
        .addSelect('"e"."dificuldade_clinica"', 'ex_dificuldade_clinica')
        .addSelect('"e"."recompensa_xp"', 'ex_recompensa_xp')
        .addSelect('"e"."url_video"', 'ex_url_video')
        .addSelect('"e"."repeticoes"', 'ex_repeticoes')
        .addSelect('"e"."materiais_necessarios"', 'ex_materiais_necessarios')
        // As instruções escritas: em modo plano o leitor abre sem passar pela
        // pré-visualização, e este é o único sítio onde uma criança que não
        // ouça o vídeo consegue ler o que tem de fazer.
        .addSelect('"e"."descricao"', 'ex_descricao')
        // Sem ordenação dos planos, "o mais recente" seria o que a base de dados
        // calhasse devolver primeiro.
        .orderBy('"p"."data_inicio"', 'DESC')
    );
  }

  /**
   * E1 — os planos DA PRÓPRIA criança.
   *
   * `idPaciente` vem sempre do `sub` do JWT verificado, nunca do pedido: este
   * método não tem forma de exprimir "os planos de outra criança". É a
   * diferença face ao acesso direto de antes, em que o id era um argumento
   * livre e só o RLS travava o resto.
   */
  async planosDoPaciente(idPaciente: string): Promise<PlanosDoPaciente> {
    const linhas = await this.queryPlanosComExercicios()
      .where('"p"."id_paciente" = :idPaciente', { idPaciente })
      .getRawMany<LinhaPlano>();

    const planos = agruparPlanos(linhas);

    // Já vêm ordenados por data_inicio DESC: o plano em vigor é o primeiro
    // ativo. Antes era `ativos[0]` sobre uma lista sem ordenação nenhuma.
    const indiceAtivo = planos.findIndex((plano) => estaAtivo(plano.linha));

    return {
      ativo: indiceAtivo >= 0 ? paraPlanoDoPaciente(planos[indiceAtivo]) : null,
      // Só o que já não está em vigor. Mantém-se o comportamento de hoje: se
      // por algum motivo existirem duas prescrições ativas, a criança continua
      // a ver apenas a mais recente.
      historico: planos
        .filter((_, idx) => idx !== indiceAtivo)
        .map(paraPlanoDoHistorico),
    };
  }

  /**
   * E2 — catálogo de planos standard.
   *
   * `id_paciente IS NULL` é imposto aqui e não há parâmetro que o altere: é
   * essa condição, e só ela, que garante que nenhuma prescrição de uma criança
   * concreta sai por esta rota.
   */
  async planosStandard(): Promise<PlanoStandard[]> {
    const linhas = await this.queryPlanosComExercicios()
      .where('"p"."id_paciente" IS NULL')
      .andWhere('"p"."ativo" = true')
      .getRawMany<LinhaPlano>();

    return agruparPlanos(linhas).map(paraPlanoStandard);
  }

  /**
   * E3 — planos de demonstração, servidos sem sessão.
   *
   * Além dos ids fixos do servidor, exige-se `id_paciente IS NULL`. É
   * redundância deliberada: se um dia um desses ids for reutilizado ou apontado
   * a uma prescrição real, continua a não sair nada de uma criança.
   *
   * A resposta leva apenas o id do plano e os exercícios — sem notas médicas,
   * sem datas, sem identificador de paciente. Nenhum texto clínico atravessa
   * uma rota sem sessão.
   */
  async planosPublicos(): Promise<PlanoPublico[]> {
    if (IDS_PLANOS_PUBLICOS.length === 0) {
      return [];
    }

    const linhas = await this.queryPlanosComExercicios()
      .where('"p"."id_prescricao" IN (:...ids)', {
        ids: [...IDS_PLANOS_PUBLICOS],
      })
      .andWhere('"p"."id_paciente" IS NULL')
      .andWhere('"p"."ativo" = true')
      .getRawMany<LinhaPlano>();

    return agruparPlanos(linhas).map((plano) => ({
      id_plano: plano.linha.id_prescricao,
      exercicios: plano.exercicios,
    }));
  }

  /**
   * E4 — lista de gestão do corpo clínico.
   *
   * Uma consulta só: os nomes vêm do JOIN a `utilizadores` e a contagem de
   * exercícios de um agregado. Antes, para obter os nomes, o frontend pedia a
   * coorte inteira ao backend (que calcula a adesão de todos os pacientes) e
   * deitava fora tudo menos o nome.
   *
   * O JOIN a `utilizadores` está preso a `tipo_utilizador = 'paciente'`: sem
   * isso, um plano apontado a uma conta clínica exporia o nome dessa conta.
   */
  async planosParaGestao(): Promise<PlanoGerido[]> {
    const linhas = await this.prescricaoRepo
      .createQueryBuilder('p')
      .leftJoin(
        Utilizador,
        'u',
        '"u"."id_user" = "p"."id_paciente" AND "u"."tipo_utilizador" = :tipoPaciente',
        { tipoPaciente: UserRole.PACIENTE },
      )
      .leftJoin(
        PrescricaoExercicio,
        'pe',
        '"pe"."id_prescricao" = "p"."id_prescricao"',
      )
      .select('"p"."id_prescricao"', 'id_prescricao')
      // O nome faltava aqui: a lista de gestão mostrava sempre o texto de
      // reserva («Modelo Geral») porque o nome nunca chegava a sair da base.
      .addSelect('"p"."nome"', 'nome')
      .addSelect('"p"."frequencia_semanal"', 'frequencia_semanal')
      .addSelect('"p"."notas_medicas"', 'notas_medicas')
      .addSelect('"p"."data_inicio"', 'data_inicio')
      .addSelect('"p"."data_validade"', 'data_validade')
      .addSelect('"p"."ativo"', 'ativo')
      .addSelect('"p"."dificuldade"', 'dificuldade')
      .addSelect('"p"."condicao_paciente"', 'condicao_paciente')
      .addSelect('"p"."is_standard"', 'is_standard')
      .addSelect('"p"."id_paciente"', 'id_paciente')
      .addSelect('"p"."id_medico"', 'id_medico')
      .addSelect('"u"."nome"', 'nome_paciente')
      .addSelect('COUNT("pe"."id_exercicio")', 'total_exercicios')
      // Os planos que as crianças montam para si próprias não são atos
      // clínicos e não entram na lista de gestão. O critério é o autor ser o
      // próprio paciente — e não o texto das notas, que qualquer edição
      // desfazia.
      .where(
        '("p"."id_paciente" IS NULL OR "p"."id_medico" <> "p"."id_paciente")',
      )
      .groupBy('"p"."id_prescricao"')
      .addGroupBy('"u"."id_user"')
      .addGroupBy('"u"."nome"')
      .orderBy('"p"."data_inicio"', 'DESC')
      .getRawMany<LinhaPlanoGerido>();

    return linhas.map(paraPlanoGerido);
  }

  /**
   * E5 — um plano para pré-preencher o ecrã de edição.
   *
   * Ou a resposta vem completa (plano + exercícios) ou rebenta: com uma
   * consulta única deixa de ser possível abrir o editor com a lista de
   * exercícios vazia por causa de um erro engolido e, ao guardar, apagar os
   * exercícios que a criança tinha prescritos.
   */
  async planoParaEdicao(idPrescricao: string): Promise<PlanoParaEdicao> {
    const linhas = await this.prescricaoRepo
      .createQueryBuilder('p')
      .leftJoin(
        PrescricaoExercicio,
        'pe',
        '"pe"."id_prescricao" = "p"."id_prescricao"',
      )
      .select('"p"."id_prescricao"', 'id_prescricao')
      // Sem isto, o ecrã de edição abria sempre com o nome vazio e ao guardar
      // gravava `nome: null` — editar a frequência de um plano apagava-lhe o
      // nome sem ninguém dar por isso.
      .addSelect('"p"."nome"', 'nome')
      .addSelect('"p"."frequencia_semanal"', 'frequencia_semanal')
      .addSelect('"p"."notas_medicas"', 'notas_medicas')
      .addSelect('"p"."data_validade"', 'data_validade')
      .addSelect('"p"."ativo"', 'ativo')
      .addSelect('"p"."dificuldade"', 'dificuldade')
      .addSelect('"p"."condicao_paciente"', 'condicao_paciente')
      .addSelect('"p"."condicao_clinica"', 'condicao_clinica')
      .addSelect('"p"."is_standard"', 'is_standard')
      .addSelect('"p"."id_paciente"', 'id_paciente')
      .addSelect('"pe"."id_exercicio"', 'ex_id_exercicio')
      // Sem COALESCE, ao contrário de E1/E2/E3: aqui interessa saber se a
      // duração foi personalizada nesta prescrição (ver PlanoParaEdicao).
      .addSelect('"pe"."duracao_segundos"', 'ex_duracao_segundos')
      .where('"p"."id_prescricao" = :idPrescricao', { idPrescricao })
      .getRawMany<{
        id_prescricao: string;
        nome: string | null;
        frequencia_semanal: number | string | null;
        notas_medicas: string | null;
        data_validade: Date | string | null;
        ativo: boolean | null;
        dificuldade: string | null;
        condicao_paciente: string | null;
        condicao_clinica: string | null;
        is_standard: boolean | null;
        id_paciente: string | null;
        ex_id_exercicio: string | null;
        ex_duracao_segundos: number | string | null;
      }>();

    if (linhas.length === 0) {
      // Antes o `.single()` do PostgREST rebentava com uma mensagem opaca.
      throw new NotFoundException('Plano não encontrado.');
    }

    const cabecalho = linhas[0];
    const exercicios = linhas
      .filter((linha) => linha.ex_id_exercicio !== null)
      .map((linha) => ({
        id_exercicio: linha.ex_id_exercicio as string,
        duracao_segundos: paraNumeroOuNulo(linha.ex_duracao_segundos),
      }));

    return {
      id_prescricao: cabecalho.id_prescricao,
      nome: cabecalho.nome ?? null,
      frequencia_semanal: paraNumero(cabecalho.frequencia_semanal),
      notas_medicas: cabecalho.notas_medicas ?? null,
      data_validade: paraTimestampSemFuso(cabecalho.data_validade),
      ativo: cabecalho.ativo === true,
      dificuldade: cabecalho.dificuldade ?? 'facil',
      condicao_paciente: cabecalho.condicao_paciente ?? 'A',
      condicao_clinica: cabecalho.condicao_clinica ?? null,
      is_standard: cabecalho.is_standard === true,
      id_paciente: cabecalho.id_paciente ?? null,
      exercicios,
    };
  }
}
