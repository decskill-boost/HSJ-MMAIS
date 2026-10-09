import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage, type Bucket } from '@google-cloud/storage';
import { randomUUID } from 'node:crypto';

/** Formatos aceites e a extensão com que ficam gravados no bucket. */
export const TIPOS_DE_VIDEO = {
  'video/mp4': 'mp4',
  'video/quicktime': 'mov',
} as const;

export type TipoDeVideo = keyof typeof TIPOS_DE_VIDEO;

/** O mesmo limite que o frontend mostra ao escolher o ficheiro. */
export const TAMANHO_MAXIMO_VIDEO_BYTES = 100 * 1024 * 1024;

/** Os vídeos dos exercícios ficam todos debaixo deste prefixo. */
const PASTA_DOS_VIDEOS = 'exercicios/';

/** Chega para enviar 100 MB numa ligação fraca e não deixa o URL a circular. */
const VALIDADE_DO_UPLOAD_MS = 15 * 60 * 1000;

/**
 * Os links de leitura são assinados por janelas de 6 horas e valem até ao fim
 * da janela seguinte, ou seja, entre 6 e 12 horas depois de saírem da API.
 *
 * Dentro da mesma janela, o mesmo vídeo dá sempre o mesmo link. Sem isso cada
 * pedido gerava um URL novo e o browser voltava a descarregar as miniaturas da
 * biblioteca inteira a cada visita.
 */
export const JANELA_DE_LEITURA_MS = 6 * 60 * 60 * 1000;

export interface UploadDeVideo {
  /** URL assinado para onde o browser faz o PUT do ficheiro. */
  urlUpload: string;
  /** Cabeçalhos que o PUT TEM de levar — fazem parte da assinatura. */
  cabecalhos: Record<string, string>;
  /** Referência `gs://` ao objeto, que é o que fica gravado em `url_video`. */
  urlVideo: string;
}

/**
 * Vídeos dos exercícios num bucket privado do Google Cloud Storage.
 *
 * Upload: o ficheiro não passa por aqui — na Vercel o corpo de um pedido não
 * pode ter mais de 4,5 MB e um vídeo chega aos 100 MB. O backend só assina um
 * URL de upload, curto, para um único objeto, com o tipo e o tamanho máximo
 * presos na assinatura, e o browser envia o vídeo direto ao bucket.
 *
 * Leitura: o bucket não é público. A base de dados guarda `gs://…` e cada
 * resposta da API leva um link de leitura assinado no lugar dele (ver
 * `AssinarVideosInterceptor`).
 *
 * O cliente do GCS só é criado quando é preciso. Se as variáveis faltarem ou
 * estiverem mal, falha só o upload (503) e os vídeos ficam sem link; criá-lo no
 * arranque deitava abaixo a aplicação inteira, incluindo o login.
 */
@Injectable()
export class ArmazenamentoService {
  private readonly logger = new Logger(ArmazenamentoService.name);
  private bucketGcs?: Bucket;
  private readonly linksDeLeitura = new Map<
    string,
    { janela: number; url: string }
  >();

  constructor(private readonly config: ConfigService) {}

  async criarUploadDeVideo(tipo: TipoDeVideo): Promise<UploadDeVideo> {
    const bucket = this.bucket();
    const objeto = `${PASTA_DOS_VIDEOS}${randomUUID()}.${TIPOS_DE_VIDEO[tipo]}`;
    const intervaloDeTamanho = `0,${TAMANHO_MAXIMO_VIDEO_BYTES}`;

    let urlUpload: string;
    try {
      [urlUpload] = await bucket.file(objeto).getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + VALIDADE_DO_UPLOAD_MS,
        contentType: tipo,
        // O GCS recusa o PUT se o corpo não couber neste intervalo: é o que
        // impede alguém de usar o URL para despejar ficheiros de 5 GB.
        extensionHeaders: { 'x-goog-content-length-range': intervaloDeTamanho },
      });
    } catch (err) {
      this.logger.error('falha ao assinar o URL de upload', err);
      throw new ServiceUnavailableException(
        'Não foi possível preparar o envio do vídeo.',
      );
    }

    return {
      urlUpload,
      cabecalhos: {
        'Content-Type': tipo,
        'x-goog-content-length-range': intervaloDeTamanho,
      },
      urlVideo: `gs://${bucket.name}/${objeto}`,
    };
  }

  /**
   * Troca a referência `gs://` de um vídeo por um link de leitura assinado.
   *
   * Só assina objetos da pasta dos vídeos deste bucket: o `url_video` é escrito
   * pelo cliente, e sem esta restrição quem pudesse editar um exercício
   * conseguia links para qualquer ficheiro do bucket. O que não comece por
   * `gs://` (os vídeos antigos do Supabase) sai como entrou.
   *
   * Nunca lança: um vídeo sem link é um cartão sem miniatura, mas um erro aqui
   * deitava abaixo a biblioteca inteira. Devolve `null` quando não consegue.
   */
  async urlDeLeitura(referencia: string): Promise<string | null> {
    if (!referencia.startsWith('gs://')) return referencia;

    let bucket: Bucket;
    try {
      bucket = this.bucket();
    } catch {
      return null;
    }

    const prefixo = `gs://${bucket.name}/${PASTA_DOS_VIDEOS}`;
    if (!referencia.startsWith(prefixo) || referencia.includes('..')) {
      this.logger.warn(`referência de vídeo fora da pasta: ${referencia}`);
      return null;
    }

    const janela =
      Math.floor(Date.now() / JANELA_DE_LEITURA_MS) * JANELA_DE_LEITURA_MS;
    const guardado = this.linksDeLeitura.get(referencia);
    if (guardado?.janela === janela) return guardado.url;

    try {
      const objeto = referencia.slice(`gs://${bucket.name}/`.length);
      const [url] = await bucket.file(objeto).getSignedUrl({
        version: 'v4',
        action: 'read',
        accessibleAt: new Date(janela),
        expires: janela + 2 * JANELA_DE_LEITURA_MS,
      });
      this.linksDeLeitura.set(referencia, { janela, url });
      return url;
    } catch (err) {
      this.logger.error('falha ao assinar o link de leitura', err);
      return null;
    }
  }

  private bucket(): Bucket {
    if (this.bucketGcs) return this.bucketGcs;

    const nome = this.config.get<string>('GCS_BUCKET');
    if (!nome) {
      this.logger.error('GCS_BUCKET não está definido');
      throw new ServiceUnavailableException(
        'O armazenamento de vídeos não está configurado.',
      );
    }

    const storage = new Storage({
      credentials: this.lerCredenciais(),
    });
    this.bucketGcs = storage.bucket(nome);
    return this.bucketGcs;
  }

  /**
   * `GCS_CREDENTIALS` leva o JSON da chave da conta de serviço, tal e qual ou
   * em base64 (há painéis que estragam as quebras de linha da chave privada).
   * Sem ela vale o Application Default Credentials — no App Engine ou no Cloud
   * Run é a conta de serviço do próprio runtime.
   */
  private lerCredenciais(): Record<string, string> | undefined {
    const valor = this.config.get<string>('GCS_CREDENTIALS')?.trim();
    if (!valor) return undefined;

    const json = valor.startsWith('{')
      ? valor
      : Buffer.from(valor, 'base64').toString('utf8');

    try {
      return JSON.parse(json) as Record<string, string>;
    } catch {
      // Nunca registar o valor: é a chave privada.
      this.logger.error('GCS_CREDENTIALS não é JSON válido (nem em base64)');
      throw new ServiceUnavailableException(
        'O armazenamento de vídeos não está configurado.',
      );
    }
  }
}
