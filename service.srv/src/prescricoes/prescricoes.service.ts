import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prescricao } from '../entities/prescricao.entity';
import { PrescricaoExercicio } from '../entities/prescricao-exercicio.entity';
import { SessaoRealizada } from '../entities/sessao-realizada.entity';
import { CreatePrescricaoDto } from './create-prescricao.dto';
import { UpdatePrescricaoDto } from './update-prescricao.dto';
import { cleanUuid } from '../utils/uuid.util';
import { Utilizador } from '../entities/utilizador.entity';

/** Violação de chave estrangeira no Postgres. */
const CODIGO_FK_VIOLADA = '23503';

export const MENSAGEM_PLANO_COM_TREINOS =
  'O plano já tem treinos associados e não pode ser eliminado.';

@Injectable()
export class PrescricoesService {
  constructor(
    @InjectRepository(Prescricao)
    private readonly prescricaoRepository: Repository<Prescricao>,
    @InjectRepository(PrescricaoExercicio)
    private readonly prescricaoExercicioRepository: Repository<PrescricaoExercicio>,
    @InjectRepository(SessaoRealizada)
    private readonly sessaoRepository: Repository<SessaoRealizada>,
  ) {}

  /**
   * `idMedico` vem do token de quem faz o pedido, não do corpo: é o clínico
   * autenticado que assina a prescrição.
   */
  async create(dados: CreatePrescricaoDto, idMedico: string) {
    const cleanPacienteId = cleanUuid(dados.id_paciente);
    const cleanMedicoId = cleanUuid(idMedico);

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
      id_paciente: cleanPacienteId ? { id_user: cleanPacienteId } : null,
      id_medico: cleanMedicoId
        ? { id_user: cleanMedicoId }
        : (null as unknown as Utilizador),
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

  /**
   * Elimina definitivamente um plano (E6). Substitui o único acesso de ESCRITA
   * direta do frontend ao Supabase: um `.delete()` sobre `prescricoes` feito a
   * partir do browser, cuja única barreira era o RLS.
   *
   * Um plano por onde já passaram treinos NÃO se apaga: esses registos são o
   * histórico clínico da criança e ficariam órfãos ou apagados com ele. A
   * verificação é explícita e não depende do `ON DELETE` da chave estrangeira
   * (que o `docs/schema.sql` diz ser `NO ACTION`, mas esse ficheiro está
   * atrasado face à base real). A violação de FK é apanhada à mesma, como rede
   * de segurança para o caso de nascer um treino entre a verificação e o
   * apagamento.
   *
   * Os exercícios da junção são apagados na mesma transação: a meio caminho
   * ficaria um plano sem exercícios ou linhas de junção sem plano.
   */
  async remove(idPrescricao: string) {
    const prescricao = await this.prescricaoRepository.findOne({
      where: { id_prescricao: idPrescricao },
    });

    if (!prescricao) {
      throw new NotFoundException('Plano não encontrado.');
    }

    const treinos = await this.sessaoRepository.count({
      where: { id_prescricao: { id_prescricao: idPrescricao } },
    });

    if (treinos > 0) {
      throw new ConflictException(MENSAGEM_PLANO_COM_TREINOS);
    }

    try {
      await this.prescricaoRepository.manager.transaction(async (manager) => {
        await manager.delete(PrescricaoExercicio, {
          id_prescricao: idPrescricao,
        });
        const resultado = await manager.delete(Prescricao, {
          id_prescricao: idPrescricao,
        });
        if (resultado.affected === 0) {
          throw new NotFoundException('Plano não encontrado.');
        }
      });
    } catch (erro) {
      if (
        typeof erro === 'object' &&
        erro !== null &&
        (erro as { code?: string }).code === CODIGO_FK_VIOLADA
      ) {
        throw new ConflictException(MENSAGEM_PLANO_COM_TREINOS);
      }
      throw erro;
    }

    return { id_prescricao: idPrescricao };
  }
}
