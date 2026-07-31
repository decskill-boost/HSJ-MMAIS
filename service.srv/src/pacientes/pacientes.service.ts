import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOptionsWhere,
  In,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { Prescricao } from '../entities/prescricao.entity';
import { PrescricaoExercicio } from '../entities/prescricao-exercicio.entity';
import {
  SessaoRealizada,
  SessaoStatus,
} from '../entities/sessao-realizada.entity';
import { Utilizador } from '../entities/utilizador.entity';
import { getEffectiveStreak, toLisbonDateKey } from '../sessoes/streak.util';
import { UserRole } from '../users/user-role.enum';
import { paraData, toTimestampSemFuso } from '../utils/data-hora.util';
import {
  calcularAdesao,
  deriveHistorico,
  HistoricoResultado,
  PrescricaoWindow,
  SessaoParaHistorico,
} from './historico.util';

export interface PacienteComAdesao {
  idUser: string;
  nome: string;
  email: string;
  adesaoPercentual: number | null;
  /** Hora de parede da sessão concluída mais recente (sem fuso, ver data-hora.util). */
  ultimoTreino: string | null;
  totalSessoesConcluidas: number;
}

/** Cabeçalho do perfil de uma criança, para o corpo clínico. */
export interface PacientePerfil {
  idUser: string;
  nome: string;
  email: string;
  nivel: number;
  xp: number;
  streakAtual: number;
}

/**
 * Uma sessão concluída, achatada. As chaves ficam em `snake_case` de propósito:
 * são as que o ecrã de detalhe do paciente já lê hoje do PostgREST. A única
 * diferença é que `nome_exercicio` deixa de vir embebido em
 * `exercicios: { nome_exercicio }`.
 */
export interface SessaoConcluidaResumo {
  id_sessao: string;
  data_hora: string;
  duracao: number | null;
  esforco_1_a_10: number | null;
  diversao_1_a_5: number | null;
  fc_media: number | null;
  fc_maxima: number | null;
  teve_problemas: boolean;
  nome_exercicio: string;
  id_prescricao?: string | null;
  nome_plano?: string | null;
  total_exercicios_plano?: number | null;
  exercicios_plano?: { id_exercicio: string; nome_exercicio: string; duracao_segundos?: number }[];
}

interface AgregadoSessoes {
  ultimoTreino: string | null;
  totalSessoesConcluidas: number;
}

const MAX_DIAS_INTERVALO = 92;

@Injectable()
export class PacientesService {
  private readonly logger = new Logger(PacientesService.name);

  constructor(
    @InjectRepository(Utilizador)
    private readonly utilizadorRepo: Repository<Utilizador>,
    @InjectRepository(Prescricao)
    private readonly prescricaoRepo: Repository<Prescricao>,
    @InjectRepository(SessaoRealizada)
    private readonly sessaoRepo: Repository<SessaoRealizada>,
    @InjectRepository(PrescricaoExercicio)
    private readonly prescricaoExercicioRepo: Repository<PrescricaoExercicio>,
  ) {}

  private defaultRange(): { from: string; to: string } {
    const hoje = new Date();
    const primeiroDiaDoMes = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
    return {
      from: toLisbonDateKey(primeiroDiaDoMes),
      to: toLisbonDateKey(hoje),
    };
  }

  /**
   * Confirma que `idPaciente` é mesmo uma criança antes de o usar como filtro.
   *
   * Sem esta condição, qualquer rota `/pacientes/:id` viraria um leitor
   * genérico da tabela `utilizadores` e permitiria enumerar contas de clínicos
   * e de administradores com um UUID escrito na barra de endereços. É a mesma
   * condição que a consulta direta que estamos a substituir já tinha
   * (`.eq("tipo_utilizador", "paciente")`).
   *
   * Devolve 404 — e não 403 — para não confirmar a existência da conta.
   */
  private async obterPacienteOuFalhar(idPaciente: string): Promise<Utilizador> {
    const paciente = await this.utilizadorRepo.findOne({
      where: { id_user: idPaciente },
    });
    // `tipo_utilizador` é uma coluna de texto; a comparação é feita com o valor
    // do enum, não com o enum, para o TypeScript não a dar por sempre falsa.
    if (
      !paciente ||
      paciente.tipo_utilizador !== (UserRole.PACIENTE as string)
    ) {
      throw new NotFoundException('Paciente não encontrado');
    }
    return paciente;
  }

  async getHistorico(
    idPaciente: string,
    from?: string,
    to?: string,
    medicoId?: string,
  ): Promise<HistoricoResultado> {
    await this.obterPacienteOuFalhar(idPaciente);

    if (medicoId) {
      const doctor = await this.utilizadorRepo.findOne({
        where: { id_user: medicoId },
      });
      if (!doctor) {
        throw new NotFoundException('Médico não encontrado');
      }
    }

    const range = {
      ...this.defaultRange(),
      ...(from && { from }),
      ...(to && { to }),
    };

    const fromDate = new Date(`${range.from}T00:00:00`);
    const toDate = new Date(`${range.to}T23:59:59.999`);
    if (
      Number.isNaN(fromDate.getTime()) ||
      Number.isNaN(toDate.getTime()) ||
      fromDate > toDate
    ) {
      throw new BadRequestException('Intervalo de datas inválido');
    }

    const totalDias = Math.round(
      (toDate.getTime() - fromDate.getTime()) / (24 * 60 * 60 * 1000),
    );
    if (totalDias > MAX_DIAS_INTERVALO) {
      throw new BadRequestException(
        `Intervalo máximo permitido é de ${MAX_DIAS_INTERVALO} dias`,
      );
    }

    const prescricoes = await this.prescricaoRepo.find({
      where: { id_paciente: { id_user: idPaciente } },
    });

    const prescricaoWindows: PrescricaoWindow[] = prescricoes.map((p) => ({
      inicio: toLisbonDateKey(p.data_inicio),
      fim: toLisbonDateKey(p.data_validade ?? toDate),
      frequenciaSemanal: p.frequencia_semanal,
    }));

    const sessoesRaw = await this.sessaoRepo.find({
      where: {
        id_paciente: { id_user: idPaciente },
        data_hora: Between(fromDate, toDate),
      },
      relations: { id_exercicio: true },
      order: { data_hora: 'ASC' },
    });

    const sessoes: SessaoParaHistorico[] = sessoesRaw.map((s) => ({
      idSessao: s.id_sessao,
      nomeExercicio: s.id_exercicio?.nome_exercicio ?? 'Exercício',
      status: s.status,
      esforco: s.esforco_1_a_10 ?? null,
      diversao: s.diversao_1_a_5 ?? null,
      duracaoSegundos: s.duracao ?? null,
      dataHora: s.data_hora,
      teveProblemas: s.teve_problemas ?? false,
      participacaoFamiliares: s.participacao_familiares ?? false,
      fcMaxima: s.fc_maxima ?? null,
      fcMedia: s.fc_media ?? null,
    }));

    const hoje = toLisbonDateKey(new Date());

    return deriveHistorico(
      sessoes,
      prescricaoWindows,
      range.from,
      range.to,
      hoje,
    );
  }

  /**
   * E7 — cabeçalho do perfil de uma criança.
   *
   * Autorização: o papel (`corpo_clinico`) é imposto pelo `RolesGuard` no
   * controlador; aqui garante-se a regra de linha — só linhas cujo
   * `tipo_utilizador` é `paciente`. A regra em vigor no hospital é «qualquer
   * clínico vê qualquer criança» (é o que o RLS e o `getPacientesComAdesao` já
   * fazem hoje); não existe no esquema vínculo médico↔doente que permita
   * restringir mais sem inventar.
   *
   * Não devolve `tipo_utilizador`, `permissoesDirectas` nem `url_foto_perfil`:
   * só o que o cabeçalho do ecrã mostra.
   */
  async getPacientePorId(idPaciente: string): Promise<PacientePerfil> {
    const paciente = await this.obterPacienteOuFalhar(idPaciente);

    return {
      idUser: paciente.id_user,
      nome: paciente.nome,
      email: paciente.email,
      nivel: paciente.nivel,
      xp: paciente.xp,
      // O mesmo cálculo que o `GET /users/me` faz: a coluna `streak_atual`
      // crua fica desatualizada até haver nova escrita e mostraria ao clínico
      // uma sequência que já se quebrou.
      streakAtual: getEffectiveStreak(
        paciente.streak_atual,
        paciente.streak_ultima_atividade,
        new Date(),
      ),
    };
  }

  /**
   * E8 — treinos concluídos de uma criança, do mais recente para o mais antigo.
   *
   * Autorização: papel `corpo_clinico` (controlador) e, antes de o `:id` ser
   * usado como filtro, a confirmação de que corresponde mesmo a um paciente.
   * O filtro `status = 'concluido'` é imposto aqui, no servidor: sessões
   * `iniciado`/`falhado` não são treinos feitos e inflacionavam as médias que o
   * corpo clínico lê para decidir.
   */
  async getSessoesConcluidas(
    idPaciente: string,
  ): Promise<SessaoConcluidaResumo[]> {
    await this.obterPacienteOuFalhar(idPaciente);

    const sessoes = await this.sessaoRepo.find({
      where: {
        id_paciente: { id_user: idPaciente },
        status: SessaoStatus.CONCLUIDO,
      },
      relations: {
        id_exercicio: true,
        id_prescricao: true,
      },
      order: { data_hora: 'DESC' },
    });

    const idsPrescricao = Array.from(
      new Set(
        sessoes
          .map((s) => s.id_prescricao?.id_prescricao)
          .filter((id): id is string => !!id),
      ),
    );

    const exerciciosPorPrescricao = new Map<
      string,
      { id_exercicio: string; nome_exercicio: string; duracao_segundos?: number }[]
    >();

    if (idsPrescricao.length > 0) {
      const peLinhas = await this.prescricaoExercicioRepo.find({
        where: { id_prescricao: In(idsPrescricao) },
        relations: { exercicio: true },
      });

      for (const pe of peLinhas) {
        const idP = pe.id_prescricao;
        if (!idP) continue;
        const lista = exerciciosPorPrescricao.get(idP) ?? [];
        lista.push({
          id_exercicio: pe.id_exercicio ?? pe.exercicio?.id_exercicio ?? '',
          nome_exercicio: pe.exercicio?.nome_exercicio ?? 'Exercício',
          duracao_segundos: pe.duracao_segundos ?? pe.exercicio?.duracao_segundos ?? 0,
        });
        exerciciosPorPrescricao.set(idP, lista);
      }
    }

    // Agrupar sessões da mesma execução de plano feitas na mesma data
    const grupos = new Map<string, SessaoRealizada[]>();

    for (const s of sessoes) {
      const idPresc = s.id_prescricao?.id_prescricao;
      const chave = idPresc
        ? `${idPresc}_${toLisbonDateKey(s.data_hora)}`
        : `solo_${s.id_sessao}`;

      const lista = grupos.get(chave) ?? [];
      lista.push(s);
      grupos.set(chave, lista);
    }

    const resultado: SessaoConcluidaResumo[] = [];

    for (const listaSessoes of grupos.values()) {
      const principal = listaSessoes[0];
      const prescricao = principal.id_prescricao;

      const duracaoTotal = listaSessoes.reduce(
        (acc, item) => acc + (item.duracao ?? 0),
        0,
      );

      const esforcos = listaSessoes
        .map((item) => item.esforco_1_a_10)
        .filter((e): e is number => e !== null && e !== undefined);
      const esforcoMedio =
        esforcos.length > 0
          ? Math.round(esforcos.reduce((a, b) => a + b, 0) / esforcos.length)
          : null;

      const diversoes = listaSessoes
        .map((item) => item.diversao_1_a_5)
        .filter((d): d is number => d !== null && d !== undefined);
      const diversaoMedia =
        diversoes.length > 0
          ? Math.round(diversoes.reduce((a, b) => a + b, 0) / diversoes.length)
          : null;

      const fcsMedias = listaSessoes
        .map((item) => item.fc_media)
        .filter((f): f is number => f !== null && f !== undefined && f > 0);
      const fcMedia =
        fcsMedias.length > 0
          ? Math.round(fcsMedias.reduce((a, b) => a + b, 0) / fcsMedias.length)
          : null;

      const fcsMaximas = listaSessoes
        .map((item) => item.fc_maxima)
        .filter((f): f is number => f !== null && f !== undefined && f > 0);
      const fcMaxima = fcsMaximas.length > 0 ? Math.max(...fcsMaximas) : null;

      const teveProblemas = listaSessoes.some((item) => item.teve_problemas);

      const exerciciosPlano = prescricao
        ? exerciciosPorPrescricao.get(prescricao.id_prescricao) ?? []
        : [];

      resultado.push({
        id_sessao: principal.id_sessao,
        data_hora: toTimestampSemFuso(principal.data_hora),
        duracao: duracaoTotal > 0 ? duracaoTotal : principal.duracao ?? null,
        esforco_1_a_10: esforcoMedio,
        diversao_1_a_5: diversaoMedia,
        fc_media: fcMedia,
        fc_maxima: fcMaxima,
        teve_problemas: teveProblemas,
        nome_exercicio: prescricao?.nome || principal.id_exercicio?.nome_exercicio || 'Exercício',
        id_prescricao: prescricao?.id_prescricao ?? null,
        nome_plano: prescricao?.nome ?? null,
        total_exercicios_plano:
          exerciciosPlano.length > 0 ? exerciciosPlano.length : null,
        exercicios_plano: exerciciosPlano,
      });
    }

    return resultado;
  }

  /**
   * E9 — último treino e total de treinos concluídos, por criança.
   *
   * Uma única consulta agregada, restrita aos ids da coorte que vai ser
   * devolvida (a lista de `tipo_utilizador = 'paciente'`): nada de varrer a
   * tabela inteira de sessões, que é precisamente o custo que este agregado
   * existe para eliminar.
   *
   * É deliberadamente independente da janela de adesão — esta só carrega
   * sessões a partir da prescrição mais antiga e daria totais errados.
   */
  private async getAgregadosDeSessoes(
    idsPacientes: string[],
  ): Promise<Map<string, AgregadoSessoes>> {
    const agregados = new Map<string, AgregadoSessoes>();
    if (idsPacientes.length === 0) {
      return agregados;
    }

    const linhas = await this.sessaoRepo
      .createQueryBuilder('sessao')
      .select('sessao.id_paciente', 'idPaciente')
      .addSelect('MAX(sessao.data_hora)', 'ultimoTreino')
      .addSelect('COUNT(*)', 'total')
      .where('sessao.id_paciente IN (:...idsPacientes)', { idsPacientes })
      .andWhere('sessao.status = :status', { status: SessaoStatus.CONCLUIDO })
      .groupBy('sessao.id_paciente')
      .getRawMany<{
        idPaciente: string;
        ultimoTreino: unknown;
        total: unknown;
      }>();

    for (const linha of linhas ?? []) {
      const ultimo = paraData(linha.ultimoTreino);
      agregados.set(linha.idPaciente, {
        ultimoTreino: ultimo ? toTimestampSemFuso(ultimo) : null,
        // `COUNT(*)` chega de Postgres como texto (bigint).
        totalSessoesConcluidas: Number(linha.total ?? 0) || 0,
      });
    }

    return agregados;
  }

  async getPacientesComAdesao(medicoId?: string): Promise<PacienteComAdesao[]> {
    const whereCondition: FindOptionsWhere<Utilizador> = {
      tipo_utilizador: UserRole.PACIENTE,
    };

    const pacientes = await this.utilizadorRepo.find({
      where: whereCondition,
      order: { nome: 'ASC' },
    });

    // Sem nomes nem emails nos registos: são dados de saúde de crianças e os
    // logs do servidor não são um sítio para eles viverem.
    this.logger.debug(
      `getPacientesComAdesao: ${pacientes.length} pacientes${medicoId ? ' (com médico)' : ''}`,
    );
    if (pacientes.length === 0) {
      return [];
    }

    const idsPacientes = pacientes.map((p) => p.id_user);

    const [prescricoes, agregados] = await Promise.all([
      this.prescricaoRepo.find({
        where: { id_paciente: { id_user: In(idsPacientes) } },
        relations: { id_paciente: true },
      }),
      this.getAgregadosDeSessoes(idsPacientes),
    ]);

    if (prescricoes.length === 0) {
      // Sem prescrições não há adesão a calcular, mas o último treino e o total
      // continuam a existir: são independentes da janela de adesão.
      return pacientes.map((p) =>
        this.paraPacienteComAdesao(p, null, agregados.get(p.id_user)),
      );
    }

    const earliestInicio = prescricoes.reduce(
      (min, p) => (p.data_inicio < min ? p.data_inicio : min),
      prescricoes[0].data_inicio,
    );

    const sessoesRaw = await this.sessaoRepo.find({
      where: {
        id_paciente: { id_user: In(idsPacientes) },
        data_hora: MoreThanOrEqual(earliestInicio),
      },
      relations: { id_paciente: true },
    });

    const prescricoesPorPaciente = new Map<string, Prescricao[]>();
    for (const p of prescricoes) {
      if (!p.id_paciente) continue;
      const idPaciente = p.id_paciente.id_user;
      const lista = prescricoesPorPaciente.get(idPaciente) ?? [];
      lista.push(p);
      prescricoesPorPaciente.set(idPaciente, lista);
    }

    const sessoesPorPaciente = new Map<string, SessaoParaHistorico[]>();
    for (const s of sessoesRaw) {
      const idPaciente = s.id_paciente.id_user;
      const lista = sessoesPorPaciente.get(idPaciente) ?? [];
      lista.push({
        idSessao: s.id_sessao,
        nomeExercicio: '',
        status: s.status,
        esforco: s.esforco_1_a_10 ?? null,
        diversao: s.diversao_1_a_5 ?? null,
        duracaoSegundos: s.duracao ?? null,
        dataHora: s.data_hora,
      });
      sessoesPorPaciente.set(idPaciente, lista);
    }

    const hoje = toLisbonDateKey(new Date());

    return pacientes.map((p) => {
      const agregado = agregados.get(p.id_user);
      const prescricoesDoPaciente = prescricoesPorPaciente.get(p.id_user) ?? [];
      if (prescricoesDoPaciente.length === 0) {
        return this.paraPacienteComAdesao(p, null, agregado);
      }

      const windows: PrescricaoWindow[] = prescricoesDoPaciente.map((pr) => ({
        inicio: toLisbonDateKey(pr.data_inicio),
        fim: pr.data_validade ? toLisbonDateKey(pr.data_validade) : hoje,
        frequenciaSemanal: pr.frequencia_semanal,
      }));

      const { percentual } = calcularAdesao(
        sessoesPorPaciente.get(p.id_user) ?? [],
        windows,
        hoje,
      );

      return this.paraPacienteComAdesao(p, percentual, agregado);
    });
  }

  private paraPacienteComAdesao(
    paciente: Utilizador,
    adesaoPercentual: number | null,
    agregado?: AgregadoSessoes,
  ): PacienteComAdesao {
    return {
      idUser: paciente.id_user,
      nome: paciente.nome,
      email: paciente.email,
      adesaoPercentual,
      ultimoTreino: agregado?.ultimoTreino ?? null,
      totalSessoesConcluidas: agregado?.totalSessoesConcluidas ?? 0,
    };
  }
}
