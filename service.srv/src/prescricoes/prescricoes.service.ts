import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescricao } from '../entities/prescricao.entity';
import { PrescricaoExercicio } from '../entities/prescricao-exercicio.entity';
import { CreatePrescricaoDto } from './create-prescricao.dto';
import { UpdatePrescricaoDto } from './update-prescricao.dto';
import { cleanUuid } from '../utils/uuid.util';
import { Utilizador } from '../entities/utilizador.entity';

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
    const cleanPacienteId = cleanUuid(dados.id_paciente);
    const cleanMedicoId = cleanUuid(dados.id_medico);

    if (cleanPacienteId) {
      await this.prescricaoRepository
        .createQueryBuilder()
        .update(Prescricao)
        .set({ ativo: false, data_fim: new Date() })
        .where('id_paciente = :idPaciente', { idPaciente: cleanPacienteId })
        .andWhere('ativo = true')
        .execute();
    }

    const prescricao = this.prescricaoRepository.create({
      id_paciente: cleanPacienteId ? ({ id_user: cleanPacienteId } as Utilizador) : null,
      id_medico: cleanMedicoId ? ({ id_user: cleanMedicoId } as Utilizador) : (null as unknown as Utilizador),
      frequencia_semanal: dados.frequencia_semanal,
      data_validade: dados.data_validade ? new Date(dados.data_validade) : null,
      data_fim: dados.data_validade ? new Date(dados.data_validade) : null,
      notas_medicas: dados.notas_medicas ?? undefined,
      ativo: true,
      is_standard: dados.is_standard ?? false,
      condicao_paciente: dados.condicao_paciente ?? 'A',
      dificuldade: dados.dificuldade ?? 'facil',
      condicao_clinica: dados.condicao_clinica ?? null,
    });

    const prescricaoGuardada = await this.prescricaoRepository.save(prescricao);
    console.log('--- PRESCRICAO GUARDADA ---', prescricaoGuardada);
    const idPrescricao = prescricaoGuardada.id_prescricao;

    if (dados.exercicios && dados.exercicios.length > 0) {
      const linhas = dados.exercicios.map((item) => {
        const idEx = typeof item === 'string' ? item : item.id_exercicio;
        const dur = typeof item === 'string' ? null : item.duracao_segundos;
        const cleanExId = cleanUuid(idEx);
        if (!cleanExId) {
          throw new BadRequestException('Exercício inválido na prescrição');
        }
        return this.prescricaoExercicioRepository.create({
          id_prescricao: idPrescricao,
          id_exercicio: cleanExId,
          duracao_segundos: dur ?? null,
        });
      });
      await this.prescricaoExercicioRepository.save(linhas);
    }

    return { id_prescricao: idPrescricao };
  }

  /**
   * Edita um plano ja criado. Os exercicios sao substituidos (apaga e volta a
   * inserir), que e o mais previsivel para uma tabela de juncao.
   * Fica no backend porque a tabela prescricoes tem RLS sem politica de UPDATE:
   * a partir do frontend a alteracao era silenciosamente filtrada.
   */
  async update(idPrescricao: string, dados: UpdatePrescricaoDto) {
    const prescricao = await this.prescricaoRepository.findOne({
      where: { id_prescricao: idPrescricao },
    });

    if (!prescricao) {
      throw new NotFoundException('Prescrição não encontrada.');
    }

    prescricao.frequencia_semanal = dados.frequencia_semanal;
    prescricao.data_validade = dados.data_validade
      ? new Date(dados.data_validade)
      : null;
    prescricao.notas_medicas = dados.notas_medicas ?? '';
    if (dados.dificuldade) prescricao.dificuldade = dados.dificuldade;
    if (dados.condicao_paciente)
      prescricao.condicao_paciente = dados.condicao_paciente;
    prescricao.condicao_clinica = dados.condicao_clinica ?? null;

    await this.prescricaoRepository.save(prescricao);

    await this.prescricaoExercicioRepository.delete({
      id_prescricao: idPrescricao,
    });

    if (dados.exercicios && dados.exercicios.length > 0) {
      const linhas = dados.exercicios.map((item) => {
        const idEx = typeof item === 'string' ? item : item.id_exercicio;
        const dur = typeof item === 'string' ? null : item.duracao_segundos;
        const cleanExId = cleanUuid(idEx);
        if (!cleanExId) {
          throw new BadRequestException('Exercício inválido na prescrição');
        }
        return this.prescricaoExercicioRepository.create({
          id_prescricao: idPrescricao,
          id_exercicio: cleanExId,
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
