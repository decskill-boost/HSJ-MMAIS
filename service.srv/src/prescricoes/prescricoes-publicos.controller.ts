import { Controller, Get } from '@nestjs/common';
import { PlanosLeituraService } from './planos-leitura.service';

/**
 * ROTA DELIBERADAMENTE ANÓNIMA — o único ficheiro do domínio «prescrições» sem
 * guardas.
 *
 * A página "Experimentar" está fora do `ProtectedRoute` (routes.tsx): existe
 * para quem ainda não tem conta poder ver como funcionam os treinos. Por isso
 * `GET /api/prescricoes/publicos` não tem `SupabaseAuthGuard` nem `RolesGuard`.
 *
 * Está num controlador SÓ SEU, com um único método, de propósito: assim a
 * ausência de guardas é uma decisão visível num ficheiro inteiro, e não um
 * método distraído no meio de outros protegidos. Nada se acrescenta aqui sem
 * ser deliberadamente público.
 *
 * O que protege esta rota está no serviço, não em guardas: a lista de ids é uma
 * constante do servidor, exige-se `id_paciente IS NULL` e a resposta não leva
 * notas médicas, datas nem identificadores de crianças.
 *
 * Registado ANTES do controlador que declara `@Get(':id')`, para que
 * "publicos" resolva para aqui e não seja apanhado como um id.
 */
@Controller('prescricoes')
export class PrescricoesPublicosController {
  constructor(private readonly planosLeituraService: PlanosLeituraService) {}

  // E3 — GET /api/prescricoes/publicos
  @Get('publicos')
  publicos() {
    return this.planosLeituraService.planosPublicos();
  }
}
