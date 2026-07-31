import {
  paraNumero,
  paraNumeroOuNulo,
  paraTimestampSemFuso,
} from '../data.util';

describe('paraTimestampSemFuso', () => {
  it('devolve os componentes gravados, sem "Z" e sem deslocar a hora', () => {
    // 1 de julho: em Lisboa há uma hora de diferença para UTC. Se isto saísse
    // por toISOString(), o clínico via 09:30 onde está gravado 10:30.
    const data = new Date(2025, 6, 1, 10, 30, 15);
    expect(paraTimestampSemFuso(data)).toBe('2025-07-01T10:30:15');
  });

  it('preenche com zeros à esquerda', () => {
    expect(paraTimestampSemFuso(new Date(2025, 0, 5, 7, 8, 9))).toBe(
      '2025-01-05T07:08:09',
    );
  });

  it('mantém o texto quando o driver já devolve texto', () => {
    expect(paraTimestampSemFuso('2025-07-01T10:30:15')).toBe(
      '2025-07-01T10:30:15',
    );
  });

  it('trata a ausência de data como null', () => {
    expect(paraTimestampSemFuso(null)).toBeNull();
    expect(paraTimestampSemFuso(undefined)).toBeNull();
    expect(paraTimestampSemFuso(new Date('não é data'))).toBeNull();
  });
});

describe('paraNumero', () => {
  it('converte o texto que o Postgres devolve para COUNT (bigint)', () => {
    expect(paraNumero('42')).toBe(42);
  });

  it('trata ausência de valor como zero', () => {
    expect(paraNumero(null)).toBe(0);
    expect(paraNumero(undefined)).toBe(0);
    expect(paraNumero('abc')).toBe(0);
  });
});

describe('paraNumeroOuNulo', () => {
  it('distingue «sem valor» de zero', () => {
    expect(paraNumeroOuNulo(null)).toBeNull();
    expect(paraNumeroOuNulo(0)).toBe(0);
    expect(paraNumeroOuNulo('600')).toBe(600);
  });
});
