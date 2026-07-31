import { paraData, toTimestampSemFuso } from '../data-hora.util';

/**
 * Este ficheiro vivia em `pacientes/test/`. Passou para `utils/` quando se
 * descobriu que as rotas de sessões da criança serializavam a MESMA coluna
 * de outra maneira (`toISOString()`); a serialização é agora uma só.
 */

describe('toTimestampSemFuso', () => {
  it('devolve a hora de parede, sem sufixo de fuso', () => {
    const data = new Date(2026, 6, 28, 9, 5, 3, 40);

    expect(toTimestampSemFuso(data)).toBe('2026-07-28T09:05:03.040');
  });

  it('faz ida e volta sem desvio (é o que o painel clínico lê como hora local)', () => {
    const data = new Date(2026, 6, 28, 23, 59, 59, 999);

    expect(new Date(toTimestampSemFuso(data)).getTime()).toBe(data.getTime());
  });

  it('não devolve «Z»: com UTC a fronteira dos 7 dias do painel deslizava no horário de verão', () => {
    expect(toTimestampSemFuso(new Date(2026, 6, 28, 0, 30))).not.toMatch(/Z$/);
  });
});

describe('paraData', () => {
  it('aceita uma Date do controlador de pg', () => {
    const data = new Date(2026, 0, 2, 3, 4, 5);
    expect(paraData(data)).toBe(data);
  });

  it('aceita texto de um agregado', () => {
    expect(paraData('2026-01-02T03:04:05')?.getTime()).toBe(
      new Date(2026, 0, 2, 3, 4, 5).getTime(),
    );
  });

  it.each([[null], [undefined], [''], ['nao-e-uma-data'], [new Date(NaN)]])(
    'devolve null para %p em vez de uma data inválida serializada',
    (valor) => {
      expect(paraData(valor)).toBeNull();
    },
  );
});
