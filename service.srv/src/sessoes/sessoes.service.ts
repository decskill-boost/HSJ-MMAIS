import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, LessThan, Repository } from 'typeorm';
import { Exercicio } from '../entities/exercicio.entity';
import { Prescricao } from '../entities/prescricao.entity';
import { SessaoRealizada, SessaoStatus } from '../entities/sessao-realizada.entity';
import { Utilizador } from '../entities/utilizador.entity';
import { ConcluirExercicioDto } from './dto/concluir-exercicio.dto';
import { IniciarExercicioDto } from './dto/iniciar-exercicio.dto';
import { calculateLevelProgress } from './level.util';
import { computeStreakUpdate, endOfLisbonDay, startOfLisbonDay } from './streak.util';

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

@Injectable()
export class SessoesService {
  constructor(
    @InjectRepository(SessaoRealizada)
    private readonly sessaoRepo: Repository<SessaoRealizada>,
    @InjectRepository(Exercicio)
    private readonly exercicioRepo: Repository<Exercicio>,
    @InjectRepository(Utilizador)
    private readonly utilizadorRepo: Repository<Utilizador>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  private getDayBounds(now: Date): { startOfDay: Date; endOfDay: Date } {
    return { startOfDay: startOfLisbonDay(now), endOfDay: endOfLisbonDay(now) };
  }

  async iniciarExercicio(
    idPaciente: string,
    dto: IniciarExercicioDto,
  ): Promise<InicioResultado> {
    const exercicio = await this.exercicioRepo.findOne({
      where: { id_exercicio: dto.id_exercicio, ativo: true },
    });
    if (!exercicio) {
      throw new NotFoundException('Exercício não encontrado');
    }

    const { startOfDay, endOfDay } = this.getDayBounds(new Date());

    const concluidoHoje = await this.sessaoRepo.findOne({
      where: {
        id_paciente: { id_user: idPaciente },
        id_exercicio: dto.id_exercicio as unknown as Exercicio,
        status: SessaoStatus.CONCLUIDO,
        data_hora: Between(startOfDay, endOfDay),
      },
    });
    if (concluidoHoje) {
      return { sessionId: concluidoHoje.id_sessao, alreadyCompletedToday: true };
    }

    const iniciadoHoje = await this.sessaoRepo.findOne({
      where: {
        id_paciente: { id_user: idPaciente },
        id_exercicio: dto.id_exercicio as unknown as Exercicio,
        status: SessaoStatus.INICIADO,
        data_hora: Between(startOfDay, endOfDay),
      },
    });
    if (iniciadoHoje) {
      return { sessionId: iniciadoHoje.id_sessao, alreadyCompletedToday: false };
    }

    const novaSessao = this.sessaoRepo.create({
      id_paciente: { id_user: idPaciente } as Utilizador,
      id_exercicio: { id_exercicio: dto.id_exercicio } as Exercicio,
      id_prescricao: { id_prescricao: dto.id_prescricao } as Prescricao,
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
    const exercicio = await this.exercicioRepo.findOne({
      where: { id_exercicio: dto.id_exercicio, ativo: true },
    });
    if (!exercicio) {
      throw new NotFoundException('Exercício não encontrado');
    }

    const now = new Date();
    const { startOfDay, endOfDay } = this.getDayBounds(now);

    const existing = await this.sessaoRepo.findOne({
      where: {
        id_paciente: { id_user: idPaciente },
        id_exercicio: dto.id_exercicio as unknown as Exercicio,
        status: SessaoStatus.CONCLUIDO,
        data_hora: Between(startOfDay, endOfDay),
      },
    });

    if (existing) {
      const user = await this.utilizadorRepo.findOne({
        where: { id_user: idPaciente },
      });
      if (!user) {
        throw new NotFoundException('Utilizador não encontrado');
      }

      const levelInfo = calculateLevelProgress(user.xp);
      return {
        xpGained: 0,
        totalXp: user.xp,
        level: user.nivel,
        leveledUp: false,
        xpForNextLevel: levelInfo.xpForNextLevel,
        progressToNextLevel: levelInfo.progressToNextLevel,
        streakAtual: user.streak_atual,
        sessionId: existing.id_sessao,
        alreadyCompletedToday: true,
      };
    }

    return this.dataSource.transaction(async (manager) => {
      const sessaoIniciada = await manager.findOne(SessaoRealizada, {
        where: {
          ...(dto.id_sessao ? { id_sessao: dto.id_sessao } : {}),
          id_paciente: { id_user: idPaciente },
          id_exercicio: dto.id_exercicio as unknown as Exercicio,
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
        sessaoIniciada.participacao_familiares = dto.participacao_familiares ?? false;
        sessaoIniciada.fc_maxima = dto.fc_maxima ?? null;
        sessaoIniciada.fc_media = dto.fc_media ?? null;
        sessao = await manager.save(sessaoIniciada);
      } else {
        // Fallback for clients that never called /sessoes/iniciar (e.g. older builds).
        const novaSessao = manager.create(SessaoRealizada, {
          id_paciente: { id_user: idPaciente } as Utilizador,
          id_exercicio: { id_exercicio: dto.id_exercicio } as Exercicio,
          id_prescricao: { id_prescricao: dto.id_prescricao } as Prescricao,
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
          id_paciente: { id_user: idPaciente },
          status: SessaoStatus.INICIADO,
          data_hora: LessThan(startOfDay),
        },
        { status: SessaoStatus.FALHADO },
      );

      const user = await manager.findOne(Utilizador, {
        where: { id_user: idPaciente },
      });
      if (!user) {
        throw new NotFoundException('Utilizador não encontrado');
      }

      const oldLevel = user.nivel;
      const totalXp = user.xp + exercicio.recompensa_xp;
      const levelInfo = calculateLevelProgress(totalXp);

      user.xp = totalXp;
      user.nivel = levelInfo.level;

      const streakResult = computeStreakUpdate(
        { streakAtual: user.streak_atual, ultimaAtividade: user.streak_ultima_atividade },
        now,
      );
      user.streak_atual = streakResult.streakAtual;
      user.streak_ultima_atividade = streakResult.ultimaAtividade;

      await manager.save(user);

      return {
        xpGained: exercicio.recompensa_xp,
        totalXp,
        level: levelInfo.level,
        leveledUp: levelInfo.level > oldLevel,
        xpForNextLevel: levelInfo.xpForNextLevel,
        progressToNextLevel: levelInfo.progressToNextLevel,
        streakAtual: user.streak_atual,
        sessionId: sessao.id_sessao,
        alreadyCompletedToday: false,
      };
    });
  }
}
