import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validateSync } from 'class-validator';
import { CreatePrescricaoDto } from '../create-prescricao.dto';
import { UpdatePrescricaoDto } from '../update-prescricao.dto';
import { ConcluirExercicioDto } from '../../sessoes/dto/concluir-exercicio.dto';

const erros = (cls: ClassConstructor<object>, payload: unknown) =>
  validateSync(
    plainToInstance(cls, payload, { enableImplicitConversion: false }),
    {
      whitelist: true,
    },
  ).flatMap((e) => Object.keys(e.constraints ?? {}));

const UUID_PACIENTE = '3f1e6a2c-9d4b-4c8e-9a1f-2b7c5d0e8a34';
const UUID_MEDICO = 'a2b3c4d5-e6f7-4890-a1b2-c3d4e5f60718';
const UUID_EXERCICIO = '11111111-2222-4333-8444-555555555555';
const UUID_PRESCRICAO = '66666666-7777-4888-8999-aaaaaaaaaaaa';

describe('Validação dos DTOs clínicos', () => {
  describe('CreatePrescricaoDto', () => {
    // Este é o payload que o frontend envia mesmo. Se a validação o rejeitar,
    // criar planos deixa de funcionar em produção.
    const payloadReal = {
      id_paciente: UUID_PACIENTE,
      id_medico: UUID_MEDICO,
      frequencia_semanal: 3,
      data_validade: '2026-12-31',
      notas_medicas: 'Começar devagar.',
      is_standard: false,
      dificuldade: 'facil',
      condicao_paciente: 'A',
      condicao_clinica: null,
      exercicios: [{ id_exercicio: UUID_EXERCICIO, duracao_segundos: 60 }],
    };

    it('aceita o payload que o frontend envia', () => {
      expect(erros(CreatePrescricaoDto, payloadReal)).toEqual([]);
    });

    it('aceita um plano standard sem paciente', () => {
      expect(
        erros(CreatePrescricaoDto, {
          ...payloadReal,
          id_paciente: null,
          is_standard: true,
        }),
      ).toEqual([]);
    });

    it('aceita exercícios indicados só pelo id', () => {
      expect(
        erros(CreatePrescricaoDto, {
          ...payloadReal,
          exercicios: [UUID_EXERCICIO],
        }),
      ).toEqual([]);
    });

    it('recusa frequência semanal fora do plausível', () => {
      expect(
        erros(CreatePrescricaoDto, { ...payloadReal, frequencia_semanal: 0 }),
      ).not.toEqual([]);
      expect(
        erros(CreatePrescricaoDto, { ...payloadReal, frequencia_semanal: 99 }),
      ).not.toEqual([]);
    });

    it('recusa um plano sem exercícios', () => {
      expect(
        erros(CreatePrescricaoDto, { ...payloadReal, exercicios: [] }),
      ).not.toEqual([]);
    });
  });

  describe('UpdatePrescricaoDto', () => {
    it('aceita o payload de edição do frontend', () => {
      expect(
        erros(UpdatePrescricaoDto, {
          frequencia_semanal: 2,
          data_validade: null,
          notas_medicas: '',
          dificuldade: 'medio',
          condicao_paciente: 'B',
          condicao_clinica: null,
          exercicios: [{ id_exercicio: UUID_EXERCICIO, duracao_segundos: 90 }],
        }),
      ).toEqual([]);
    });
  });

  describe('ConcluirExercicioDto', () => {
    const base = {
      id_exercicio: UUID_EXERCICIO,
      id_prescricao: UUID_PRESCRICAO,
      duracao: 300,
    };

    it('aceita um exercício intermédio, sem esforço nem diversão', () => {
      expect(erros(ConcluirExercicioDto, base)).toEqual([]);
    });

    it('aceita a avaliação completa da criança', () => {
      expect(
        erros(ConcluirExercicioDto, {
          ...base,
          esforco_1_a_10: 7,
          diversao_1_a_5: 5,
          teve_problemas: false,
          participacao_familiares: true,
          fc_media: 95,
          fc_maxima: 130,
        }),
      ).toEqual([]);
    });

    it('recusa valores clínicos impossíveis', () => {
      expect(
        erros(ConcluirExercicioDto, { ...base, esforco_1_a_10: 500 }),
      ).not.toEqual([]);
      expect(
        erros(ConcluirExercicioDto, { ...base, diversao_1_a_5: 0 }),
      ).not.toEqual([]);
      expect(
        erros(ConcluirExercicioDto, { ...base, fc_media: -10 }),
      ).not.toEqual([]);
    });
  });
});
