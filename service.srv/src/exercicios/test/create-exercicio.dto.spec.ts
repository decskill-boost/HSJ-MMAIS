import { ValidationPipe } from '@nestjs/common';
import { CreateExercicioDto } from '../dto/create-exercicio.dto';
import { Exercicio } from '../../entities/exercicio.entity';

// O mesmo pipe que corre em produção (ver main.ts).
const pipe = new ValidationPipe({ whitelist: true, transform: true });

// Exatamente o que o CriarExercicioModal envia.
const payloadReal = {
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
};

describe('Criação de exercícios com o ValidationPipe global', () => {
  it('deixa passar o corpo que o frontend envia, campo a campo', async () => {
    const saida = await pipe.transform(payloadReal, {
      type: 'body',
      metatype: CreateExercicioDto,
    });

    expect({ ...(saida as object) }).toEqual(payloadReal);
  });

  it('aceita um exercício sem vídeo nem repetições', async () => {
    const { url_video, repeticoes, ...semExtras } = payloadReal;
    void url_video;
    void repeticoes;

    await expect(
      pipe.transform(semExtras, { type: 'body', metatype: CreateExercicioDto }),
    ).resolves.toBeDefined();
  });

  it('recusa um exercício sem nome', async () => {
    const { nome_exercicio, ...semNome } = payloadReal;
    void nome_exercicio;

    await expect(
      pipe.transform(semNome, { type: 'body', metatype: CreateExercicioDto }),
    ).rejects.toThrow();
  });

  /**
   * Guarda-costas do erro que motivou o DTO: com a entidade no `@Body()`, a
   * lista branca não encontrava um único decorador de validação e devolvia um
   * objeto vazio — o exercício era gravado sem nome, sem categoria e sem
   * duração, e ninguém via um erro.
   */
  it('a entidade sozinha não serve como tipo do @Body()', async () => {
    const saida = await pipe.transform(payloadReal, {
      type: 'body',
      metatype: Exercicio,
    });

    expect({ ...(saida as object) }).toEqual({});
  });
});
