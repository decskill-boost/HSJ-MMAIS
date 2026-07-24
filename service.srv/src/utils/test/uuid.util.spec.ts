import { cleanUuid } from '../uuid.util';

describe('cleanUuid', () => {
  it('deve retornar null para null ou undefined', () => {
    expect(cleanUuid(null)).toBeNull();
    expect(cleanUuid(undefined)).toBeNull();
  });

  it('deve retornar null para strings vazias ou apenas com espaços', () => {
    expect(cleanUuid('')).toBeNull();
    expect(cleanUuid('   ')).toBeNull();
  });

  it('deve retornar a própria string limpa se for um UUID válido ou preenchido', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';
    expect(cleanUuid(validUuid)).toBe(validUuid);
    expect(cleanUuid(`  ${validUuid}  `)).toBe(validUuid);
  });
});
