import { NotFoundException, ParseUUIDPipe } from '@nestjs/common';
import { ROUTE_ARGS_METADATA } from '@nestjs/common/constants';
import { ExerciciosController } from '../exercicios.controller';
import type { ExerciciosService } from '../exercicios.service';
import type { ArmazenamentoService } from '../../armazenamento/armazenamento.service';
import type { Exercicio } from '../../entities/exercicio.entity';

const UUID_VALIDO = '7c9e6679-7425-40de-944b-e07fc1f90ae7';

interface ArgumentoDeRota {
  index: number;
  data?: unknown;
  pipes?: unknown[];
}

/** Pipes declarados no `@Param('id', ...)` de um handler. */
function pipesDoParametroId(metodo: string): unknown[] {
  const metadados =
    (Reflect.getMetadata(ROUTE_ARGS_METADATA, ExerciciosController, metodo) as
      | Record<string, ArgumentoDeRota>
      | undefined) ?? {};

  return Object.values(metadados)
    .filter((arg) => arg.data === 'id')
    .flatMap((arg) => arg.pipes ?? []);
}

describe('ExerciciosController', () => {
  let servico: { findOne: jest.Mock };
  let armazenamento: { criarUploadDeVideo: jest.Mock };
  let controlador: ExerciciosController;

  beforeEach(() => {
    servico = { findOne: jest.fn() };
    armazenamento = { criarUploadDeVideo: jest.fn() };
    controlador = new ExerciciosController(
      servico as unknown as ExerciciosService,
      armazenamento as unknown as ArmazenamentoService,
    );
  });

  describe('POST /exercicios/videos', () => {
    it('devolve o upload assinado pelo armazenamento para o tipo pedido', async () => {
      const upload = {
        urlUpload: 'https://storage.googleapis.com/b/x?X-Goog-Signature=abc',
        cabecalhos: { 'Content-Type': 'video/mp4' },
        urlVideo: 'gs://b/exercicios/x.mp4',
      };
      armazenamento.criarUploadDeVideo.mockResolvedValue(upload);

      await expect(
        controlador.criarUploadDeVideo({ tipo: 'video/mp4' }),
      ).resolves.toBe(upload);
      expect(armazenamento.criarUploadDeVideo).toHaveBeenCalledWith(
        'video/mp4',
      );
    });
  });

  describe('GET /exercicios/:id', () => {
    it('devolve o exercício quando existe', async () => {
      const exercicio = { id_exercicio: UUID_VALIDO } as Exercicio;
      servico.findOne.mockResolvedValue(exercicio);

      await expect(controlador.findOne(UUID_VALIDO)).resolves.toBe(exercicio);
      expect(servico.findOne).toHaveBeenCalledWith(UUID_VALIDO);
    });

    /**
     * O serviço filtra por `ativo: true` e devolve `null` para um id que não
     * exista ou que já tenha sido desativado. Devolver `null` de um handler do
     * Nest dá 200 com corpo vazio — o cliente não consegue distinguir "não há"
     * de "há, mas está vazio". Passa a 404.
     */
    it('dá 404 quando o exercício não existe ou está inativo', async () => {
      servico.findOne.mockResolvedValue(null);

      await expect(controlador.findOne(UUID_VALIDO)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  /**
   * O `:id` é texto escolhido pelo cliente na barra de endereços. Sem o
   * `ParseUUIDPipe` seguia até ao Postgres, que rejeita com
   * `invalid input syntax for type uuid` — e isso chega ao cliente como 500,
   * não como o 400 que na verdade é.
   *
   * Vale para as três rotas com `:id`, não só para a de leitura: nas escritas
   * o erro dava-se já a meio do pedido de alteração.
   */
  describe('todas as rotas com :id validam o UUID', () => {
    it.each(['findOne', 'update', 'remove'])(
      '%s tem o ParseUUIDPipe no @Param("id")',
      (metodo) => {
        expect(pipesDoParametroId(metodo)).toContain(ParseUUIDPipe);
      },
    );
  });
});
