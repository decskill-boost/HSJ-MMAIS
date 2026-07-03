import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, Repository } from 'typeorm';
import { Exercicio } from '../entities/exercicio.entity';
import { Prescricao } from '../entities/prescricao.entity';
import { SessaoRealizada } from '../entities/sessao-realizada.entity';
import { Utilizador } from '../entities/utilizador.entity';
import { ConcluirExercicioDto } from './dto/concluir-exercicio.dto';
import { calculateLevelProgress } from './level.util';
import { computeStreakUpdate } from './streak.util';

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
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const existing = await this.sessaoRepo.findOne({
      where: {
        id_paciente: { id_user: idPaciente },
        id_exercicio: { id_exercicio: dto.id_exercicio },
        concluido: true,
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
      const sessao = manager.create(SessaoRealizada, {
        id_paciente: { id_user: idPaciente } as Utilizador,
        id_exercicio: { id_exercicio: dto.id_exercicio } as Exercicio,
        id_prescricao: { id_prescricao: dto.id_prescricao } as Prescricao,
        data_hora: now,
        esforco_1_a_10: dto.esforco_1_a_10,
        diversao_1_a_5: dto.diversao_1_a_5,
        duracao: dto.duracao,
        concluido: true,
      });
      await manager.save(sessao);

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