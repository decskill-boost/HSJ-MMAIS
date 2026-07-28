import { ConflictException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Prescricao } from '../../entities/prescricao.entity';
import { PrescricaoExercicio } from '../../entities/prescricao-exercicio.entity';
import { SessaoRealizada } from '../../entities/sessao-realizada.entity';
import {
  MENSAGEM_PLANO_COM_TREINOS,
  PrescricoesService,
} from '../prescricoes.service';

const PLANO = '11111111-1111-4111-8111-111111111111';

interface Apagado {
  entidade: unknown;
  criterio: unknown;
}

const criarServico = (opcoes: {
  prescricao?: Partial<Prescricao> | null;
  treinos?: number;
  erroAoApagar?: Error;
}) => {
  const apagados: Apagado[] = [];

  const manager = {
    delete: (entidade: unknown, criterio: unknown) => {
      if (opcoes.erroAoApagar && entidade === Prescricao) {
        return Promise.reject(opcoes.erroAoApagar);
      }
      apagados.push({ entidade, criterio });
      return Promise.resolve({ affected: 1 });
    },
  };

  const prescricaoRepo = {
    findOne: jest.fn(() =>
      Promise.resolve(
        opcoes.prescricao === undefined
          ? ({ id_prescricao: PLANO } as Prescricao)
          : (opcoes.prescricao as Prescricao | null),
      ),
    ),
    manager: {
      transaction: (fn: (m: typeof manager) => Promise<unknown>) => fn(manager),
    },
  } as unknown as Repository<Prescricao>;

  const contarTreinos = jest.fn(() => Promise.resolve(opcoes.treinos ?? 0));
  const sessaoRepo = {
    count: contarTreinos,
  } as unknown as Repository<SessaoRealizada>;

  const servico = new PrescricoesService(
    prescricaoRepo,
    {} as unknown as Repository<PrescricaoExercicio>,
    sessaoRepo,
  );

  return { servico, apagados, contarTreinos };
};

describe('PrescricoesService.remove (E6)', () => {
  it('apaga primeiro os exercícios da junção e só depois o plano, na mesma transação', async () => {
    const { servico, apagados } = criarServico({});

    const resposta = await servico.remove(PLANO);

    expect(apagados.map((a) => a.entidade)).toEqual([
      PrescricaoExercicio,
      Prescricao,
    ]);
    expect(apagados[0].criterio).toEqual({ id_prescricao: PLANO });
    expect(resposta).toEqual({ id_prescricao: PLANO });
  });

  it('recusa com 409 e a mensagem em português quando o plano já tem treinos', async () => {
    const { servico, apagados } = criarServico({ treinos: 4 });

    await expect(servico.remove(PLANO)).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(servico.remove(PLANO)).rejects.toThrow(
      MENSAGEM_PLANO_COM_TREINOS,
    );
    // Nada foi apagado: o histórico clínico da criança fica intacto.
    expect(apagados).toEqual([]);
  });

  it('conta os treinos daquele plano e de mais nenhum', async () => {
    const { servico, contarTreinos } = criarServico({ treinos: 1 });

    await servico.remove(PLANO).catch(() => undefined);

    expect(contarTreinos).toHaveBeenCalledWith({
      where: { id_prescricao: { id_prescricao: PLANO } },
    });
  });

  it('responde 404 quando o plano não existe', async () => {
    const { servico } = criarServico({ prescricao: null });

    await expect(servico.remove(PLANO)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('converte a violação de chave estrangeira em 409, não em 500', async () => {
    // Rede de segurança: se nascer um treino entre a contagem e o apagamento,
    // ou se a base real tiver a FK sem ON DELETE, o clínico continua a receber
    // a explicação certa em vez de um erro genérico.
    // É assim que o erro chega do `pg`: um Error com a propriedade `code`.
    const erroFk = Object.assign(new Error('violação de chave estrangeira'), {
      code: '23503',
    });
    const { servico } = criarServico({ erroAoApagar: erroFk });

    await expect(servico.remove(PLANO)).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('não engole outros erros da base de dados', async () => {
    const erro = new Error('ligação perdida');
    const { servico } = criarServico({ erroAoApagar: erro });

    await expect(servico.remove(PLANO)).rejects.toBe(erro);
  });
});
