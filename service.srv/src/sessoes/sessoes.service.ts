import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, LessThan, Repository } from 'typeorm';
import { Exercicio } from '../entities/exercicio.entity';
import { Prescricao } from '../entities/prescricao.entity';
import {
  SessaoRealizada,
  SessaoStatus,
} from '../entities/sessao-realizada.entity';
import { Utilizador } from '../entities/utilizador.entity';
import { ConcluirExercicioDto } from './dto/concluir-exercicio.dto';
import { IniciarExercicioDto } from './dto/iniciar-exercicio.dto';
import { calculateLevelProgress } from './level.util';
import {
  computeStreakUpdate,
  endOfLisbonDay,
  startOfLisbonDay,
} from './streak.util';
import { toTimestampSemFuso } from '../utils/data-hora.util';
import { cleanUuid } from '../utils/uuid.util';

export interface ConclusaoResultado {
  xpGained: number;
  totalXp: number;
  level: number;
  leveledUp: boolean;
  xpForNextLevel: number;
  progressToNextLevel: number;
  streakAtual: number;
  sessionId: string;
  alreadyCompletedToday: boolean;
}

export interface InicioResultado {
  sessionId: string;
  alreadyCompletedToday: boolean;
}

/** Uma linha do histórico de treinos da própria criança (GET /sessoes/minhas). */
export interface SessaoDoHistorico {
  id_sessao: string;
  /**
   * Hora de parede, sem sufixo de fuso — exatamente o que o PostgREST devolve
   * hoje e o mesmo formato de `GET /pacientes/:id/sessoes`.
   *
   * Esta rota já esteve a responder com `toISOString()`. Parecia mais
   * explícito, mas só acerta enquanto o fuso do SERVIDOR for igual ao do
   * browser: com o servidor em UTC e a criança em Lisboa, o «último treino»
   * do ecrã inicial aparecia uma hora à frente no horário de verão. Ver
   * `utils/data-hora.util.ts`.
   */
  data_hora: string;
  duracao: number | null;
  esforco_1_a_10: number | null;
  nome_exercicio: string;
  recompensa_xp: number;
}

/** Contagens agregadas do hospital inteiro (GET /sessoes/estatisticas). */
export interface EstatisticasSessoes {
  totalConcluidas: number;
  concluidasUltimos7Dias: number;
}

const DIAS_DA_JANELA_SEMANAL = 7;

@Injectable()
export class SessoesService {
  constructor(
    @InjectRepository(SessaoRealizada)
    private readonly sessaoRepo: Repository<SessaoRealizada>,
    @InjectRepository(Exercicio)
    private readonly exercicioRepo: Repository<Exercicio>,
    @InjectRepository(Utilizador)
    private readonly utilizadorRepo: Repository<Utilizador>,
    @InjectRepository(Prescricao)
    private readonly prescricaoRepo: Repository<Prescricao>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private getDayBounds(now: Date): { startOfDay: Date; endOfDay: Date } {
    return { startOfDay: startOfLisbonDay(now), endOfDay: endOfLisbonDay(now) };
  }

  /**
   * Um treino pode não estar ligado a plano nenhum (exploração livre da
   * biblioteca, página de demonstração) — isso é legítimo e continua a
   * passar. O que não é legítimo é uma criança carimbar o seu treino com o
   * plano de OUTRA criança: além de sujar o historial clínico dessa outra,
   * prende-lhe o plano para sempre, porque a chave estrangeira
   * `fk_sessoes_prescricao` passa a impedir que o corpo clínico o elimine.
   *
   * Aceita-se, portanto: sem plano, um plano standard (sem paciente
   * associado) ou um plano do próprio. A mensagem de recusa é a mesma em
   * todos os casos, para não revelar se um dado identificador existe.
   */
  private async validarPrescricaoDoPaciente(
    idPrescricao: string | null,
    idPaciente: string,
  ): Promise<void> {
    if (!idPrescricao) {
      return;
    }

    const prescricao = await this.prescricaoRepo.findOne({
      where: { id_prescricao: idPrescricao },
      relations: { id_paciente: true },
    });

    const idDono = prescricao?.id_paciente?.id_user ?? null;
    if (!prescricao || (idDono !== null && idDono !== idPaciente)) {
      throw new BadRequestException('Plano de treino inválido.');
    }
  }

  async iniciarExercicio(
    idPaciente: string,
    dto: IniciarExercicioDto,
  ): Promise<InicioResultado> {
    const cleanPacienteId = cleanUuid(idPaciente);
    const cleanExercicioId = cleanUuid(dto.id_exercicio);
    const cleanPrescricaoId = cleanUuid(dto.id_prescricao);

    if (!cleanPacienteId || !cleanExercicioId) {
      throw new BadRequestException('Paciente ou Exercício inválido');
    }

    const exercicio = await this.exercicioRepo.findOne({
      where: { id_exercicio: cleanExercicioId, ativo: true },
    });
    if (!exercicio) {
      throw new NotFoundException('Exercício não encontrado');
    }

    await this.validarPrescricaoDoPaciente(cleanPrescricaoId, cleanPacienteId);

    const { startOfDay, endOfDay } = this.getDayBounds(new Date());

    const concluidoHoje = await this.sessaoRepo.findOne({
      where: {
        id_paciente: { id_user: cleanPacienteId },
        id_exercicio: cleanExercicioId as unknown as Exercicio,
        status: SessaoStatus.CONCLUIDO,
        data_hora: Between(startOfDay, endOfDay),
      },
    });
    if (concluidoHoje) {
      return {
        sessionId: concluidoHoje.id_sessao,
        alreadyCompletedToday: true,
      };
    }

    const iniciadoHoje = await this.sessaoRepo.findOne({
      where: {
        id_paciente: { id_user: cleanPacienteId },
        id_exercicio: cleanExercicioId as unknown as Exercicio,
        status: SessaoStatus.INICIADO,
        data_hora: Between(startOfDay, endOfDay),
      },
    });
    if (iniciadoHoje) {
      return {
        sessionId: iniciadoHoje.id_sessao,
        alreadyCompletedToday: false,
      };
    }

    const novaSessao = this.sessaoRepo.create({
      id_paciente: { id_user: cleanPacienteId } as Utilizador,
      id_exercicio: { id_exercicio: cleanExercicioId } as Exercicio,
      id_prescricao: cleanPrescricaoId
        ? { id_prescricao: cleanPrescricaoId }
        : null,
      data_hora: new Date(),
      status: SessaoStatus.INICIADO,
      concluido: false,
    });
    const salva = await this.sessaoRepo.save(novaSessao);

    return { sessionId: salva.id_sessao, alreadyCompletedToday: false };
  }

  async concluirExercicio(
    idPaciente: string,
    dto: ConcluirExercicioDto,
  ): Promise<ConclusaoResultado> {
    const cleanPacienteId = cleanUuid(idPaciente);
    const cleanExercicioId = cleanUuid(dto.id_exercicio);
    const cleanPrescricaoId = cleanUuid(dto.id_prescricao);
    const cleanSessaoId = cleanUuid(dto.id_sessao);

    if (!cleanPacienteId || !cleanExercicioId) {
      throw new BadRequestException('Paciente ou Exercício inválido');
    }

    const exercicio = await this.exercicioRepo.findOne({
      where: { id_exercicio: cleanExercicioId, ativo: true },
    });
    if (!exercicio) {
      throw new NotFoundException('Exercício não encontrado');
    }

    await this.validarPrescricaoDoPaciente(cleanPrescricaoId, cleanPacienteId);

    const now = new Date();
    const { startOfDay, endOfDay } = this.getDayBounds(now);

    const alreadyCompleted = await this.sessaoRepo.findOne({
      where: {
        id_paciente: { id_user: cleanPacienteId },
        id_exercicio: cleanExercicioId as unknown as Exercicio,
        status: SessaoStatus.CONCLUIDO,
        data_hora: Between(startOfDay, endOfDay),
      },
    });

    // REGRA MUDADA (PR #76): repetir o mesmo exercício no mesmo dia volta a
    // dar XP. Antes era `alreadyCompleted ? 0 : recompensa_xp` — e era essa a
    // razão de o XP «não subir» quando a criança repetia um treino.
    //
    // O `alreadyCompleted` continua a ser calculado e devolvido, porque o ecrã
    // usa-o para não festejar duas vezes a mesma conquista. O valor é limitado
    // a [0, 500] para um exercício mal configurado no catálogo não conseguir
    // atirar o nível da criança para o infinito.
    const xpGained = Math.min(Math.max(0, exercicio.recompensa_xp ?? 0), 500);

    return this.dataSource.transaction(async (manager) => {
      const sessaoIniciada = await manager.findOne(SessaoRealizada, {
        where: {
          ...(cleanSessaoId ? { id_sessao: cleanSessaoId } : {}),
          id_paciente: { id_user: cleanPacienteId },
          id_exercicio: cleanExercicioId as unknown as Exercicio,
          status: SessaoStatus.INICIADO,
          data_hora: Between(startOfDay, endOfDay),
        },
      });

      let sessao: SessaoRealizada;
      if (sessaoIniciada) {
        sessaoIniciada.status = SessaoStatus.CONCLUIDO;
        sessaoIniciada.concluido = true;
        sessaoIniciada.esforco_1_a_10 = dto.esforco_1_a_10 as number;
        sessaoIniciada.diversao_1_a_5 = dto.diversao_1_a_5 as number;
        sessaoIniciada.duracao = dto.duracao as number;
        sessaoIniciada.teve_problemas = dto.teve_problemas ?? false;
        sessaoIniciada.participacao_familiares =
          dto.participacao_familiares ?? false;
        sessaoIniciada.fc_maxima = dto.fc_maxima ?? null;
        sessaoIniciada.fc_media = dto.fc_media ?? null;
        sessaoIniciada.id_prescricao = cleanPrescricaoId
          ? ({ id_prescricao: cleanPrescricaoId } as Prescricao)
          : null;
        sessao = await manager.save(sessaoIniciada);
      } else {
        // Recurso para clientes que nunca chamaram /sessoes/iniciar (versões antigas).
        const novaSessao = manager.create(SessaoRealizada, {
          id_paciente: { id_user: cleanPacienteId } as Utilizador,
          id_exercicio: { id_exercicio: cleanExercicioId } as Exercicio,
          id_prescricao: cleanPrescricaoId
            ? ({ id_prescricao: cleanPrescricaoId } as Prescricao)
            : null,
          data_hora: now,
          esforco_1_a_10: dto.esforco_1_a_10,
          diversao_1_a_5: dto.diversao_1_a_5,
          duracao: dto.duracao,
          teve_problemas: dto.teve_problemas ?? false,
          participacao_familiares: dto.participacao_familiares ?? false,
          fc_maxima: dto.fc_maxima ?? null,
          fc_media: dto.fc_media ?? null,
          concluido: true,
          status: SessaoStatus.CONCLUIDO,
        });
        sessao = await manager.save(novaSessao);
      }

      // Hygiene: any of this patient's attempts left dangling from previous days
      // are now definitively missed, not just "in progress".
      await manager.update(
        SessaoRealizada,
        {
          id_paciente: { id_user: cleanPacienteId },
          status: SessaoStatus.INICIADO,
          data_hora: LessThan(startOfDay),
        },
        { status: SessaoStatus.FALHADO },
      );

      const user = await manager.findOne(Utilizador, {
        where: { id_user: cleanPacienteId },
      });
      if (!user) {
        throw new NotFoundException('Utilizador não encontrado');
      }

      const oldLevel = user.nivel;
      const totalXp = user.xp + xpGained;
      const levelInfo = calculateLevelProgress(totalXp);

      user.xp = totalXp;
      user.nivel = levelInfo.level;

      const streakResult = computeStreakUpdate(
        {
          streakAtual: user.streak_atual,
          ultimaAtividade: user.streak_ultima_atividade,
        },
        now,
      );
      user.streak_atual = streakResult.streakAtual;
      user.streak_ultima_atividade = streakResult.ultimaAtividade;

      await manager.save(user);

      return {
        xpGained,
        totalXp,
        level: levelInfo.level,
        leveledUp: levelInfo.level > oldLevel,
        xpForNextLevel: levelInfo.xpForNextLevel,
        progressToNextLevel: levelInfo.progressToNextLevel,
        streakAtual: user.streak_atual,
        sessionId: sessao.id_sessao,
        alreadyCompletedToday: !!alreadyCompleted,
      };
    });
  }

  /**
   * E10 — histórico de treinos concluídos da PRÓPRIA criança.
   *
   * `idPaciente` vem sempre de `payload.sub` (token verificado); não há, e não
   * pode passar a haver, um parâmetro que o cliente controle. Substitui o
   * `sessoesService.getHistorico(idPaciente)` do frontend, cujo argumento era
   * livre e só o RLS impedia de apontar a outra criança.
   *
   * Nota de contrato assumida: o histórico do frontend filtrava por
   * `concluido = true` (coluna booleana) e aqui filtra-se por
   * `status = 'concluido'` (coluna enum). São colunas diferentes; o `status` é
   * o que o resto do backend usa e o que o ecrã do corpo clínico já lê. Como o
   * DEFAULT de `status` é `concluido`, o novo filtro é um superconjunto do
   * antigo: linhas antigas com `concluido = false` podem passar a aparecer.
   */
  async listarMinhasSessoes(
    idPaciente: string,
    limite?: number,
  ): Promise<SessaoDoHistorico[]> {
    const cleanPacienteId = cleanUuid(idPaciente);
    if (!cleanPacienteId) {
      throw new BadRequestException('Paciente inválido');
    }

    const sessoes = await this.sessaoRepo.find({
      where: {
        id_paciente: { id_user: cleanPacienteId },
        status: SessaoStatus.CONCLUIDO,
      },
      relations: { id_exercicio: true },
      order: { data_hora: 'DESC' },
      ...(limite ? { take: limite } : {}),
    });

    return sessoes.map((s) => ({
      id_sessao: s.id_sessao,
      data_hora: toTimestampSemFuso(s.data_hora),
      duracao: s.duracao ?? null,
      esforco_1_a_10: s.esforco_1_a_10 ?? null,
      nome_exercicio: s.id_exercicio?.nome_exercicio ?? 'Exercício',
      recompensa_xp: s.id_exercicio?.recompensa_xp ?? 0,
    }));
  }

  /**
   * E11 — dois contadores do painel do corpo clínico, do hospital inteiro.
   *
   * Não há regra de linha porque não há linhas na resposta: são dois números
   * agregados, sem um único identificador de criança. Quem pode pedi-los é
   * decidido pelo papel (`@Roles(CORPO_CLINICO)` no controlador), não pelo
   * RLS.
   *
   * A fronteira dos 7 dias é calculada AQUI. Antes era calculada no browser,
   * com o relógio e o fuso do posto de trabalho, e era essa fronteira que
   * decidia que crianças apareciam ao clínico como precisando de atenção.
   */
  async getEstatisticas(): Promise<EstatisticasSessoes> {
    const limiteSemana = new Date(
      Date.now() - DIAS_DA_JANELA_SEMANAL * 24 * 60 * 60 * 1000,
    );

    // Uma única consulta: COUNT total + COUNT filtrado. Contar aqui evita
    // descarregar sessões só para as contar (e evita a truncagem silenciosa
    // que já dera contadores errados no painel).
    const linha = await this.sessaoRepo
      .createQueryBuilder('s')
      .select('COUNT(*)', 'total')
      .addSelect(
        'COUNT(*) FILTER (WHERE "s"."data_hora" >= :limiteSemana)',
        'ultimos7dias',
      )
      .where('s.status = :status', { status: SessaoStatus.CONCLUIDO })
      .setParameter('limiteSemana', limiteSemana)
      .getRawOne<{ total: string; ultimos7dias: string }>();

    // O driver devolve os COUNT como texto (bigint).
    return {
      totalConcluidas: Number(linha?.total ?? 0),
      concluidasUltimos7Dias: Number(linha?.ultimos7dias ?? 0),
    };
  }
}
