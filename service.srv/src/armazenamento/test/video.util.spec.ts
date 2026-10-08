import { referenciaDoVideo } from '../video.util';

describe('referenciaDoVideo', () => {
  it('um link assinado do GCS volta a ser a referência gs://', () => {
    const assinado =
      'https://storage.googleapis.com/hsj-mmais/exercicios/abc.mp4' +
      '?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Expires=43200' +
      '&X-Goog-Signature=0123abcd';

    expect(referenciaDoVideo(assinado)).toBe(
      'gs://hsj-mmais/exercicios/abc.mp4',
    );
  });

  it('descodifica o caminho do objeto', () => {
    expect(
      referenciaDoVideo(
        'https://storage.googleapis.com/b/exercicios/salto%20alto.mp4?X-Goog-Signature=1',
      ),
    ).toBe('gs://b/exercicios/salto alto.mp4');
  });

  it.each([
    'gs://hsj-mmais/exercicios/abc.mp4',
    'https://x.supabase.co/storage/v1/object/public/exercise-videos/1.mp4',
    // Sem assinatura não é um link que a API tenha emitido.
    'https://storage.googleapis.com/hsj-mmais/exercicios/abc.mp4',
    'isto não é um url',
    '',
  ])('deixa %p como está', (valor) => {
    expect(referenciaDoVideo(valor)).toBe(valor);
  });

  it.each([undefined, null, 42])('não mexe em %p', (valor) => {
    expect(referenciaDoVideo(valor)).toBe(valor);
  });
});
