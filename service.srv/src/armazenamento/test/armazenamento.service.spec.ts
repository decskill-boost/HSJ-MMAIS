import { Logger, ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { generateKeyPairSync } from 'node:crypto';
import {
  ArmazenamentoService,
  JANELA_DE_LEITURA_MS,
  TAMANHO_MAXIMO_VIDEO_BYTES,
} from '../armazenamento.service';

/**
 * Uma conta de serviço inventada, com uma chave RSA gerada aqui. A assinatura
 * V4 é feita localmente com a chave privada, por isso o teste corre sem rede e
 * sem projeto GCP nenhum.
 */
const { privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  publicKeyEncoding: { type: 'spki', format: 'pem' },
});

const CREDENCIAIS = JSON.stringify({
  type: 'service_account',
  project_id: 'projeto-de-teste',
  client_email: 'mmais-videos@projeto-de-teste.iam.gserviceaccount.com',
  private_key: privateKey,
});

function servicoCom(env: Record<string, string | undefined>) {
  const config = { get: (chave: string) => env[chave] };
  return new ArmazenamentoService(config as unknown as ConfigService);
}

describe('ArmazenamentoService', () => {
  it('assina um PUT para um objeto novo em exercicios/ no bucket configurado', async () => {
    const servico = servicoCom({
      GCS_BUCKET: 'mmais-videos',
      GCS_CREDENTIALS: CREDENCIAIS,
    });

    const upload = await servico.criarUploadDeVideo('video/mp4');
    const url = new URL(upload.urlUpload);

    expect(url.origin).toBe('https://storage.googleapis.com');
    expect(url.pathname).toMatch(
      /^\/mmais-videos\/exercicios\/[0-9a-f-]{36}\.mp4$/,
    );
    expect(url.searchParams.get('X-Goog-Algorithm')).toBe('GOOG4-RSA-SHA256');
    expect(url.searchParams.get('X-Goog-Expires')).toBe('900');
    expect(url.searchParams.get('X-Goog-Signature')).toBeTruthy();

    // A referência a gravar aponta para o mesmo objeto que foi assinado.
    expect(upload.urlVideo).toBe(`gs:/${url.pathname}`);
  });

  /**
   * Os cabeçalhos devolvidos têm de ser exatamente os assinados: se o browser
   * mandar outro `Content-Type`, ou não mandar o intervalo de tamanho, o GCS
   * responde 403 SignatureDoesNotMatch.
   */
  it('prende o tipo e o tamanho máximo à assinatura', async () => {
    const servico = servicoCom({
      GCS_BUCKET: 'mmais-videos',
      GCS_CREDENTIALS: CREDENCIAIS,
    });

    const upload = await servico.criarUploadDeVideo('video/quicktime');
    const assinados = new URL(upload.urlUpload).searchParams
      .get('X-Goog-SignedHeaders')
      ?.split(';');

    expect(assinados).toEqual(
      expect.arrayContaining(['content-type', 'x-goog-content-length-range']),
    );
    expect(upload.cabecalhos).toEqual({
      'Content-Type': 'video/quicktime',
      'x-goog-content-length-range': `0,${TAMANHO_MAXIMO_VIDEO_BYTES}`,
    });
    expect(upload.urlVideo).toMatch(/\.mov$/);
  });

  it('cada pedido recebe um objeto diferente', async () => {
    const servico = servicoCom({
      GCS_BUCKET: 'mmais-videos',
      GCS_CREDENTIALS: CREDENCIAIS,
    });

    const a = await servico.criarUploadDeVideo('video/mp4');
    const b = await servico.criarUploadDeVideo('video/mp4');

    expect(a.urlVideo).not.toBe(b.urlVideo);
  });

  it('aceita as credenciais em base64', async () => {
    const servico = servicoCom({
      GCS_BUCKET: 'mmais-videos',
      GCS_CREDENTIALS: Buffer.from(CREDENCIAIS).toString('base64'),
    });

    await expect(servico.criarUploadDeVideo('video/mp4')).resolves.toEqual(
      expect.objectContaining({ urlUpload: expect.any(String) as string }),
    );
  });

  describe('links de leitura (o bucket é privado)', () => {
    const REFERENCIA = 'gs://mmais-videos/exercicios/abc.mp4';
    // Meio de uma janela de 6 h, para os testes não dependerem da hora a que correm.
    const INICIO_DA_JANELA = Date.UTC(2026, 9, 8, 12);

    let servico: ArmazenamentoService;

    beforeEach(() => {
      jest.useFakeTimers({ doNotFake: ['nextTick', 'setImmediate'] });
      jest.setSystemTime(INICIO_DA_JANELA + JANELA_DE_LEITURA_MS / 2);
      servico = servicoCom({
        GCS_BUCKET: 'mmais-videos',
        GCS_CREDENTIALS: CREDENCIAIS,
      });
    });

    afterEach(() => {
      jest.useRealTimers();
      jest.restoreAllMocks();
    });

    it('troca a referência gs:// por um GET assinado ao mesmo objeto', async () => {
      const url = new URL((await servico.urlDeLeitura(REFERENCIA)) as string);

      expect(url.origin).toBe('https://storage.googleapis.com');
      expect(url.pathname).toBe('/mmais-videos/exercicios/abc.mp4');
      expect(url.searchParams.get('X-Goog-Signature')).toBeTruthy();
    });

    /**
     * Assinado a partir do início da janela e válido até ao fim da seguinte:
     * quem recebe o link tem sempre pelo menos 6 h para o usar.
     */
    it('vale do início da janela até ao fim da janela seguinte', async () => {
      const url = new URL((await servico.urlDeLeitura(REFERENCIA)) as string);

      expect(url.searchParams.get('X-Goog-Date')).toBe('20261008T120000Z');
      expect(url.searchParams.get('X-Goog-Expires')).toBe(
        String((2 * JANELA_DE_LEITURA_MS) / 1000),
      );
    });

    it('dá o mesmo link dentro da janela, para o browser o poder guardar', async () => {
      const primeiro = await servico.urlDeLeitura(REFERENCIA);
      jest.setSystemTime(INICIO_DA_JANELA + JANELA_DE_LEITURA_MS - 1);

      await expect(servico.urlDeLeitura(REFERENCIA)).resolves.toBe(primeiro);

      // E é a assinatura que é estável, não só a cache: outra instância dá o mesmo.
      const outro = servicoCom({
        GCS_BUCKET: 'mmais-videos',
        GCS_CREDENTIALS: CREDENCIAIS,
      });
      await expect(outro.urlDeLeitura(REFERENCIA)).resolves.toBe(primeiro);
    });

    it('muda de link quando muda a janela', async () => {
      const primeiro = await servico.urlDeLeitura(REFERENCIA);
      jest.setSystemTime(INICIO_DA_JANELA + JANELA_DE_LEITURA_MS);

      await expect(servico.urlDeLeitura(REFERENCIA)).resolves.not.toBe(
        primeiro,
      );
    });

    // Os vídeos antigos do Supabase continuam a tocar tal como estão.
    it('deixa passar o que não é gs://', async () => {
      const supabase =
        'https://x.supabase.co/storage/v1/object/public/exercise-videos/1.mp4';

      await expect(servico.urlDeLeitura(supabase)).resolves.toBe(supabase);
    });

    /**
     * O `url_video` é escrito pelo cliente. Sem esta restrição, quem edita um
     * exercício conseguia um link para qualquer ficheiro do bucket — ou de
     * outro bucket a que a conta de serviço tenha acesso.
     */
    it.each([
      'gs://outro-bucket/exercicios/abc.mp4',
      'gs://mmais-videos/outra-pasta/abc.mp4',
      'gs://mmais-videos/exercicios/../segredo.json',
      'gs://mmais-videos-falso/exercicios/abc.mp4',
    ])('não assina %s', async (referencia) => {
      jest.spyOn(Logger.prototype, 'warn').mockImplementation(() => {});

      await expect(servico.urlDeLeitura(referencia)).resolves.toBeNull();
    });

    it('sem configuração devolve null em vez de rebentar a resposta', async () => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
      const semBucket = servicoCom({});

      await expect(semBucket.urlDeLeitura(REFERENCIA)).resolves.toBeNull();
    });
  });

  describe('sem configuração válida falha só o pedido, com 503', () => {
    // Os erros são registados de propósito; aqui só fazem ruído.
    beforeEach(() => {
      jest.spyOn(Logger.prototype, 'error').mockImplementation(() => {});
    });

    afterEach(() => jest.restoreAllMocks());

    it('quando falta o GCS_BUCKET', async () => {
      const servico = servicoCom({ GCS_CREDENTIALS: CREDENCIAIS });

      await expect(
        servico.criarUploadDeVideo('video/mp4'),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('quando o GCS_CREDENTIALS não é JSON', async () => {
      const servico = servicoCom({
        GCS_BUCKET: 'mmais-videos',
        GCS_CREDENTIALS: 'isto-nao-e-uma-chave',
      });

      await expect(
        servico.criarUploadDeVideo('video/mp4'),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });

    it('quando a chave privada não serve para assinar', async () => {
      const servico = servicoCom({
        GCS_BUCKET: 'mmais-videos',
        GCS_CREDENTIALS: JSON.stringify({
          ...(JSON.parse(CREDENCIAIS) as object),
          private_key: 'chave estragada',
        }),
      });

      await expect(
        servico.criarUploadDeVideo('video/mp4'),
      ).rejects.toBeInstanceOf(ServiceUnavailableException);
    });
  });
});
