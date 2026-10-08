import { StreamableFile, type ExecutionContext } from '@nestjs/common';
import { lastValueFrom, of } from 'rxjs';
import type { ArmazenamentoService } from '../armazenamento.service';
import { AssinarVideosInterceptor } from '../assinar-videos.interceptor';

/** Assinatura de mentira: chega para ver onde o interceptor mexeu. */
const urlDeLeitura = jest.fn((referencia: string) =>
  Promise.resolve(`https://assinado/${referencia.slice('gs://'.length)}`),
);

const interceptor = new AssinarVideosInterceptor({
  urlDeLeitura,
} as unknown as ArmazenamentoService);

const responder = (corpo: unknown) =>
  lastValueFrom(
    interceptor.intercept({} as ExecutionContext, { handle: () => of(corpo) }),
  );

describe('AssinarVideosInterceptor', () => {
  beforeEach(() => urlDeLeitura.mockClear());

  it('assina o url_video da biblioteca (lista de exercícios)', async () => {
    const corpo = await responder([
      { id_exercicio: '1', url_video: 'gs://b/exercicios/1.mp4' },
      { id_exercicio: '2', url_video: 'gs://b/exercicios/2.mp4' },
    ]);

    expect(corpo).toEqual([
      { id_exercicio: '1', url_video: 'https://assinado/b/exercicios/1.mp4' },
      { id_exercicio: '2', url_video: 'https://assinado/b/exercicios/2.mp4' },
    ]);
  });

  /**
   * Os planos, o histórico do paciente e as sessões trazem o exercício dentro
   * de outros objetos (relações do TypeORM). É por isso que o interceptor é
   * global e desce pela resposta toda.
   */
  it('assina o url_video em exercícios aninhados', async () => {
    const corpo = await responder({
      plano: {
        exercicios: [{ exercicio: { url_video: 'gs://b/exercicios/1.mp4' } }],
      },
    });

    expect(corpo).toEqual({
      plano: {
        exercicios: [
          { exercicio: { url_video: 'https://assinado/b/exercicios/1.mp4' } },
        ],
      },
    });
  });

  it('não toca no que não é gs:// nem noutros campos', async () => {
    const supabase =
      'https://x.supabase.co/storage/v1/object/public/exercise-videos/1.mp4';
    const quando = new Date('2026-10-08T12:00:00Z');

    const corpo = await responder({
      url_video: supabase,
      sem_video: { url_video: null },
      outro_campo: 'gs://b/exercicios/1.mp4',
      quando,
    });

    expect(corpo).toEqual({
      url_video: supabase,
      sem_video: { url_video: null },
      outro_campo: 'gs://b/exercicios/1.mp4',
      quando,
    });
    expect(urlDeLeitura).not.toHaveBeenCalled();
  });

  it('aguenta relações que apontam umas para as outras', async () => {
    const prescricao: Record<string, unknown> = {};
    const exercicio = { url_video: 'gs://b/exercicios/1.mp4', prescricao };
    prescricao.exercicios = [exercicio];

    await responder(prescricao);

    expect(exercicio.url_video).toBe('https://assinado/b/exercicios/1.mp4');
    expect(urlDeLeitura).toHaveBeenCalledTimes(1);
  });

  it('deixa passar respostas que não são objetos', async () => {
    const ficheiro = new StreamableFile(Buffer.from('x'));

    await expect(responder(undefined)).resolves.toBeUndefined();
    await expect(responder('ok')).resolves.toBe('ok');
    await expect(responder(ficheiro)).resolves.toBe(ficheiro);
  });
});
