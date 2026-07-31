import { ValidationPipe } from '@nestjs/common';
import type { ArgumentMetadata } from '@nestjs/common';
import { CreatePrescricaoDto } from '../create-prescricao.dto';
import { PrescricoesController } from '../prescricoes.controller';
import type { PrescricoesService } from '../prescricoes.service';
import type { SupabaseJwtPayload } from '../../auth/supabase-jwt-payload.interface';
import { UserRole } from '../../users/user-role.enum';

const MEDICO_AUTENTICADO = 'aaaaaaaa-1111-4111-8111-aaaaaaaaaaaa';
const OUTRO_MEDICO = 'bbbbbbbb-2222-4222-8222-bbbbbbbbbbbb';
const PACIENTE = '3f1e6a2c-9d4b-4c8e-9a1f-2b7c5d0e8a34';
const EXERCICIO = '11111111-2222-4333-8444-555555555555';

/**
 * Quem assina uma prescrição é quem está autenticado.
 *
 * Enquanto `id_medico` era um campo do corpo do pedido, bastava trocar o valor
 * que o browser enviava para registar um plano em nome de outro colega — o
 * backend gravava-o sem o confrontar com o token.
 */
describe('Autoria da prescrição (POST /prescricoes)', () => {
  // Réplica do pipe global (main.ts).
  const pipe = new ValidationPipe({ whitelist: true, transform: true });
  const metadata: ArgumentMetadata = {
    type: 'body',
    metatype: CreatePrescricaoDto,
  };

  // O corpo que o frontend continua a enviar hoje, `id_medico` incluído.
  const corpoDoFrontend = {
    id_paciente: PACIENTE,
    id_medico: OUTRO_MEDICO,
    frequencia_semanal: 3,
    data_validade: '2026-12-31',
    notas_medicas: 'Começar devagar.',
    is_standard: false,
    dificuldade: 'facil',
    condicao_paciente: 'A',
    condicao_clinica: null,
    exercicios: [{ id_exercicio: EXERCICIO, duracao_segundos: 60 }],
  };

  it('continua a aceitar o corpo que o frontend envia (não parte a criação de planos)', async () => {
    await expect(pipe.transform(corpoDoFrontend, metadata)).resolves.toEqual(
      expect.objectContaining({ frequencia_semanal: 3 }),
    );
  });

  it('descarta o id_medico que venha no corpo', async () => {
    const validado = (await pipe.transform(
      corpoDoFrontend,
      metadata,
    )) as Record<string, unknown>;

    expect(validado).not.toHaveProperty('id_medico');
  });

  it('o controlador entrega ao serviço o id de quem está autenticado', async () => {
    const create = jest.fn(() => Promise.resolve({ id_prescricao: 'x' }));
    const controlador = new PrescricoesController({
      create,
    } as unknown as PrescricoesService);

    const dados = (await pipe.transform(
      corpoDoFrontend,
      metadata,
    )) as CreatePrescricaoDto;

    const tokenDoMedico: SupabaseJwtPayload = { sub: MEDICO_AUTENTICADO };
    await controlador.create(dados, tokenDoMedico, UserRole.CORPO_CLINICO);

    expect(create).toHaveBeenCalledWith(
      dados,
      MEDICO_AUTENTICADO,
      UserRole.CORPO_CLINICO,
    );
    expect(JSON.stringify(create.mock.calls)).not.toContain(OUTRO_MEDICO);
  });

  it('leva o papel de quem pede, para o serviço poder distinguir criança de clínico', async () => {
    const create = jest.fn(() => Promise.resolve({ id_prescricao: 'x' }));
    const controlador = new PrescricoesController({
      create,
    } as unknown as PrescricoesService);

    const dados = (await pipe.transform(
      corpoDoFrontend,
      metadata,
    )) as CreatePrescricaoDto;

    await controlador.create(dados, { sub: PACIENTE }, UserRole.PACIENTE);

    expect(create).toHaveBeenCalledWith(dados, PACIENTE, UserRole.PACIENTE);
  });
});
