import { Injectable } from '@nestjs/common';
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
    // 1. Criar a prescrição (usando os ids diretamente)
    const prescricao = this.prescricaoRepository.create({
      id_paciente: { id_user: dados.id_paciente },
      id_medico: { id_user: dados.id_medico },
      frequencia_semanal: dados.frequencia_semanal,
      data_validade: dados.data_validade ? new Date(dados.data_validade) : null,
      notas_medicas: dados.notas_medicas,
      ativo: true,
    } as any);

    const prescricaoGuardada = await this.prescricaoRepository.save(prescricao);
    const idPrescricao = (prescricaoGuardada as any).id_prescricao;

    // 2. Associar os exercícios à prescrição
    if (dados.exercicios && dados.exercicios.length > 0) {
      const linhas = dados.exercicios.map((idEx) =>
        this.prescricaoExercicioRepository.create({
          id_prescricao: idPrescricao,
          id_exercicio: idEx,
        }),
      );
      await this.prescricaoExercicioRepository.save(linhas);
    }

    return { id_prescricao: idPrescricao };
  }
}