import { ValidationPipe } from '@nestjs/common';
import { CreateExercicioDto } from '../dto/create-exercicio.dto';
import { UpdateExercicioDto } from '../dto/update-exercicio.dto';
import { ExerciciosController } from '../exercicios.controller';

// O mesmo pipe que corre em produção (ver main.ts).
const pipe = new ValidationPipe({ whitelist: true, transform: true });

/**
 * O `ValidationPipe` global não sabe ler os DTOs a partir do código-fonte: lê
 * os `design:paramtypes` que o TypeScript emite ao compilar o `@Body()`. E o
 * TypeScript só os emite quando a classe é importada POR VALOR. Trocar
 * `import { X }` por `import type { X }` — que qualquer arrumação de imports
 * ou regra de lint pode sugerir — faz o metadado passar a `Object`, e o pipe
 * ignora tipos nativos: a validação inteira desaparece sem um único aviso.
 *
 * Não é hipotético. Aconteceu no `sessoes.controller.ts`: com os DTOs
 * importados como tipo, um `POST /api/sessoes/concluir` com
 * `esforco_1_a_10: 99999` respondia 201 e gravava o valor, apesar do `@Max(10)`
 * declarado. Aqui é a mesma exposição: `duracao_segundos` negativo, `@MaxLength`
 * ignorado e, com a lista branca morta, qualquer coluna da tabela escrita pelo
 * cliente.
 */
describe('Os DTOs do @Body() chegam ao ValidationPipe como classes', () => {
  const tiposDe = (metodo: string): unknown[] =>
    (Reflect.getMetadata(
      'design:paramtypes',
      ExerciciosController.prototype,
      metodo,
    ) as unknown[]) ?? [];

  it('create declara o CreateExercicioDto, não Object', () => {
    const tipos = tiposDe('create');

    expect(tipos).toContain(CreateExercicioDto);
    expect(tipos).not.toContain(Object);
  });

  it('update declara o UpdateExercicioDto, não Object', () => {
    const tipos = tiposDe('update');

    expect(tipos).toContain(UpdateExercicioDto);
    expect(tipos).not.toContain(Object);
  });
});

/**
 * O `CreateExercicioDto` já tem testes próprios (create-exercicio.dto.spec.ts).
 * O de edição não tinha — e é o que recebe o corpo maior, porque o ecrã envia
 * o exercício inteiro de volta.
 */
describe('Edição de exercícios com o ValidationPipe global', () => {
  // Exatamente o que o ExerciciosPage envia: `{ ...exercicioEditando, url_video }`,
  // ou seja, a linha toda que veio do GET, `id_exercicio` incluído.
  const payloadReal = {
    id_exercicio: '7c9e6679-7425-40de-944b-e07fc1f90ae7',
    nome_exercicio: 'Saltar à corda',
    categoria: 'Quadríceps',
    duracao_segundos: 60,
    dificuldade_clinica: 'facil',
    condicao_paciente: 'A',
    recompensa_xp: 10,
    repeticoes: 12,
    descricao: 'Saltar devagar, com os pés juntos.',
    materiais_necessarios: 'Corda',
    url_video: 'https://exemplo.pt/video.mp4',
    ativo: true,
  };

  const validar = (corpo: object) =>
    pipe.transform(corpo, { type: 'body', metatype: UpdateExercicioDto });

  it('deixa passar o corpo que o ecrã envia, sem a chave primária', async () => {
    const saida = (await validar(payloadReal)) as Record<string, unknown>;

    // `id_exercicio` não está declarado no DTO: a lista branca descarta-o. O id
    // que conta é o do caminho (`@Param`), não um que venha no corpo — senão o
    // cliente escolhia que linha atualizar.
    const { id_exercicio, ...esperado } = payloadReal;
    void id_exercicio;

    expect({ ...saida }).toEqual(esperado);
  });

  it('aceita uma edição parcial, com um campo só', async () => {
    await expect(validar({ nome_exercicio: 'Outro nome' })).resolves.toEqual(
      expect.objectContaining({ nome_exercicio: 'Outro nome' }),
    );
  });

  it('descarta campos que o DTO não declara', async () => {
    const saida = (await validar({
      nome_exercicio: 'Saltar à corda',
      campo_injectado: 'sobrevivi ao whitelist',
    })) as Record<string, unknown>;

    expect(saida).not.toHaveProperty('campo_injectado');
  });

  it('recusa uma duração negativa', async () => {
    await expect(validar({ duracao_segundos: -1 })).rejects.toThrow();
  });

  it('recusa uma duração que não é inteira', async () => {
    await expect(
      validar({ duracao_segundos: 'muito tempo' }),
    ).rejects.toThrow();
  });

  it('recusa XP negativo', async () => {
    await expect(validar({ recompensa_xp: -50 })).rejects.toThrow();
  });

  it('recusa um nome maior do que a coluna aguenta', async () => {
    await expect(
      validar({ nome_exercicio: 'x'.repeat(256) }),
    ).rejects.toThrow();
  });

  it('recusa uma condição clínica com mais de um carácter', async () => {
    await expect(validar({ condicao_paciente: 'AB' })).rejects.toThrow();
  });
});
