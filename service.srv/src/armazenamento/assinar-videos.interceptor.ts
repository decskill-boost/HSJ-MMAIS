import {
  Injectable,
  StreamableFile,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { mergeMap, type Observable } from 'rxjs';
import { ArmazenamentoService } from './armazenamento.service';

/**
 * Troca, em TODAS as respostas da API, cada `url_video` que seja uma referência
 * `gs://` por um link de leitura assinado.
 *
 * É global e não endpoint a endpoint porque o exercício sai por muitos lados:
 * a biblioteca, os planos (incluindo os standard, sem sessão), e as relações
 * que o TypeORM carrega no histórico dos pacientes e nas sessões. Um endpoint
 * esquecido não abre nada — o bucket continua privado — mas deixava a criança
 * com um vídeo que não toca.
 */
@Injectable()
export class AssinarVideosInterceptor implements NestInterceptor {
  constructor(private readonly armazenamento: ArmazenamentoService) {}

  intercept(
    _contexto: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      mergeMap(async (corpo: unknown) => {
        await this.assinar(corpo, new WeakSet());
        return corpo;
      }),
    );
  }

  private async assinar(valor: unknown, vistos: WeakSet<object>) {
    if (
      valor === null ||
      typeof valor !== 'object' ||
      vistos.has(valor) ||
      valor instanceof Date ||
      valor instanceof StreamableFile ||
      ArrayBuffer.isView(valor)
    ) {
      return;
    }
    // As relações do TypeORM podem apontar umas para as outras.
    vistos.add(valor);

    if (Array.isArray(valor)) {
      await Promise.all(valor.map((item) => this.assinar(item, vistos)));
      return;
    }

    const registo = valor as Record<string, unknown>;
    await Promise.all(
      Object.keys(registo).map(async (chave) => {
        const campo = registo[chave];
        if (
          chave === 'url_video' &&
          typeof campo === 'string' &&
          campo.startsWith('gs://')
        ) {
          registo[chave] = await this.armazenamento.urlDeLeitura(campo);
        } else {
          await this.assinar(campo, vistos);
        }
      }),
    );
  }
}
