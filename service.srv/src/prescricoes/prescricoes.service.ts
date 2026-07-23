import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescricao } from '../entities/prescricao.entity';
import { PrescricaoExercicio } from '../entities/prescricao-exercicio.entity';
import { CreatePrescricaoDto } from './create-prescricao.dto';

@Injectable()
export class PrescricoesService {
  constructor(
    @InjectRepository(Prescricao)
    private readonly prescricaoRepository: Repository<Prescricao>,
    @InjectRepository(PrescricaoExercicio)
    private readonly prescricaoExercicioRepository: Repository<PrescricaoExercicio>,
  ) {}

  async create(dados: CreatePrescricaoDto) {
    console.log('--- DADOS RECEBIDOS NO BACKEND ---', dados);
    if (dados.id_paciente) {
      await this.prescricaoRepository
        .createQueryBuilder()
        .update(Prescricao)
        .set({ ativo: false, data_fim: new Date() })
        .where('id_paciente = :idPaciente', { idPaciente: dados.id_paciente })
        .andWhere('ativo = true')
        .execute();
    }

    const prescricao = this.prescricaoRepository.create({
      id_paciente: dados.id_paciente ? { id_user: dados.id_paciente } : null,
      id_medico: { id_user: dados.id_medico },
      frequencia_semanal: dados.frequencia_semanal,
      data_validade: dados.data_validade ? new Date(dados.data_validade) : null,
      data_fim: dados.data_validade ? new Date(dados.data_validade) : null,
      notas_medicas: dados.notas_medicas ?? null,
      ativo: true,
      is_standard: dados.is_standard ?? false,
      condicao_paciente: dados.condicao_paciente ?? 'A',
      dificuldade: dados.dificuldade ?? 'facil',
      condicao_clinica: dados.condicao_clinica ?? null,
    } as any);

    const prescricaoGuardada = await this.prescricaoRepository.save(prescricao);
    console.log('--- PRESCRICAO GUARDADA ---', prescricaoGuardada);
    const idPrescricao = (prescricaoGuardada as any).id_prescricao;

    if (dados.exercicios && dados.exercicios.length > 0) {
      const linhas = dados.exercicios.map((item) => {
        const idEx = typeof item === 'string' ? item : item.id_exercicio;
        const dur = typeof item === 'string' ? null : item.duracao_segundos;
        return this.prescricaoExercicioRepository.create({
          id_prescricao: idPrescricao,
          id_exercicio: idEx,
          duracao_segundos: dur ?? null,
        });
      });
      await this.prescricaoExercicioRepository.save(linhas);
    }

    return { id_prescricao: idPrescricao };
  }

  async cancel(idPrescricao: string) {
    const prescricao = await this.prescricaoRepository.findOne({
      where: { id_prescricao: idPrescricao },
    });

    if (!prescricao) {
      throw new NotFoundException('Prescrição não encontrada.');
    }

    if (!prescricao.ativo && prescricao.data_fim) {
      return { id_prescricao: idPrescricao };
    }

    prescricao.ativo = false;
    prescricao.data_fim = new Date();

    await this.prescricaoRepository.save(prescricao);

    return { id_prescricao: idPrescricao };
  }
}
