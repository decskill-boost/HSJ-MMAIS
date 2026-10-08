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

/** Chega para enviar 100 MB numa ligação fraca e não deixa o URL a circular. */
const VALIDADE_DO_UPLOAD_MS = 15 * 60 * 1000;

export interface UploadDeVideo {
  /** URL assinado para onde o browser faz o PUT do ficheiro. */
  urlUpload: string;
  /** Cabeçalhos que o PUT TEM de levar — fazem parte da assinatura. */
  cabecalhos: Record<string, string>;
  /** URL de leitura, que é o que fica gravado em `url_video`. */
  urlPublica: string;
}

/**
 * Vídeos dos exercícios no Google Cloud Storage.
 *
 * O ficheiro não passa por aqui: na Vercel o corpo de um pedido não pode ter
 * mais de 4,5 MB e um vídeo chega aos 100 MB. O backend só assina um URL de
 * upload — curto, para um único objeto, com o tipo e o tamanho máximo presos na
 * assinatura — e o browser envia o vídeo direto ao bucket.
 *
 * O cliente do GCS só é criado no primeiro upload. Se as variáveis faltarem ou
 * estiverem mal, falha só este pedido (503); criá-lo no arranque deitava abaixo
 * a aplicação inteira, incluindo o login.
 */
@Injectable()
export class ArmazenamentoService {
  private readonly logger = new Logger(ArmazenamentoService.name);
  private bucketGcs?: Bucket;

  constructor(private readonly config: ConfigService) {}

  async criarUploadDeVideo(tipo: TipoDeVideo): Promise<UploadDeVideo> {
    const bucket = this.bucket();
    const objeto = `exercicios/${randomUUID()}.${TIPOS_DE_VIDEO[tipo]}`;
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
      urlPublica: `https://storage.googleapis.com/${bucket.name}/${objeto}`,
    };
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
