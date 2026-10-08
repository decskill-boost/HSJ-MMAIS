import { Logger, ServiceUnavailableException } from '@nestjs/common';
import type { ConfigService } from '@nestjs/config';
import { generateKeyPairSync } from 'node:crypto';
import {
  ArmazenamentoService,
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

    // O URL público aponta para o mesmo objeto que foi assinado.
    expect(upload.urlPublica).toBe(`${url.origin}${url.pathname}`);
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
    expect(upload.urlPublica).toMatch(/\.mov$/);
  });

  it('cada pedido recebe um objeto diferente', async () => {
    const servico = servicoCom({
      GCS_BUCKET: 'mmais-videos',
      GCS_CREDENTIALS: CREDENCIAIS,
    });

    const a = await servico.criarUploadDeVideo('video/mp4');
    const b = await servico.criarUploadDeVideo('video/mp4');

    expect(a.urlPublica).not.toBe(b.urlPublica);
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
