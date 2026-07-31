import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { SupabaseJwtPayload } from '../auth/supabase-jwt-payload.interface';
import { UserRole } from '../users/user-role.enum';
import { PlanosLeituraService } from './planos-leitura.service';

/**
 * LEITURA de planos. Separado do `PrescricoesController` (escritas) porque as
 * regras de papel são diferentes por rota — e misturá-las obrigaria a tirar o
 * `@Roles` da classe de escrita, onde basta esquecer um método para abrir o
 * POST/PUT/PATCH a qualquer autenticado.
 *
 * DUAS DECISÕES QUE AQUI SÃO DE SEGURANÇA, NÃO DE ESTILO:
 *
 * 1. As guardas estão ao NÍVEL DA CLASSE. `@Roles` sem `RolesGuard` não dá erro
 *    nenhum — falha ABERTA, em silêncio: o handler responde 200 a qualquer
 *    token. Pondo `RolesGuard` na classe, nenhum método pode ficar sem ela.
 *
 * 2. O `@Roles` da classe é a predefinição MAIS RESTRITIVA (corpo clínico).
 *    Assim, esquecer o `@Roles` num método novo fecha-o ao corpo clínico em vez
 *    de o deixar aberto. O teste `test/guardas.spec.ts` verifica ambas as
 *    coisas em todos os handlers.
 *
 * A rota anónima (`GET /prescricoes/publicos`) NÃO está aqui: vive num
 * controlador próprio, sem guardas, para que "sem guardas" seja uma decisão
 * declarada num ficheiro inteiro e não um método que passou despercebido.
 *
 * As rotas literais ficam antes de `:id`, e o `:id` é validado como UUID.
 */
@Controller('prescricoes')
@UseGuards(SupabaseAuthGuard, RolesGuard)
@Roles(UserRole.CORPO_CLINICO)
export class PrescricoesLeituraController {
  constructor(private readonly planosLeituraService: PlanosLeituraService) {}

  /**
   * E1 — GET /api/prescricoes/meus
   *
   * Os planos da própria criança. Não há parâmetro de paciente: nem no
   * caminho, nem em query, nem no corpo. O id vem do `sub` do token verificado,
   * por isso não existe forma de pedir os planos de outra criança.
   */
  @Get('meus')
  @Roles(UserRole.PACIENTE)
  meus(@CurrentUser() payload: SupabaseJwtPayload) {
    return this.planosLeituraService.planosDoPaciente(payload.sub);
  }

  /**
   * E2 — GET /api/prescricoes/standard
   *
   * Catálogo de planos sem paciente associado.
   *
   * Os papéis estão listados de propósito em vez de se aceitar "qualquer
   * autenticado": o `SupabaseAuthGuard` valida a assinatura do token mas não
   * confirma que o `sub` tem sequer conta em `utilizadores`. Exigir um papel
   * obriga o `RolesGuard` a ir à base de dados, ou seja, faz "autenticado"
   * passar a significar "provisionado no hospital" — e estes planos levam notas
   * médicas, que o ecrã da criança mostra.
   */
  @Get('standard')
  @Roles(UserRole.PACIENTE, UserRole.CORPO_CLINICO, UserRole.ADMIN)
  standard() {
    return this.planosLeituraService.planosStandard();
  }

  /**
   * E4 — GET /api/prescricoes
   *
   * Lista de gestão. Sem restrição por médico responsável: não existe no
   * esquema qualquer vínculo médico↔doente utilizável, e a regra em vigor hoje
   * (RLS e backend) é «qualquer corpo clínico vê qualquer criança». Restringir
   * exigiria alteração de esquema e decisão clínica — fica registado, não se
   * inventa aqui. O que não se faz é colapsar isto em «autenticado».
   */
  @Get()
  @Roles(UserRole.CORPO_CLINICO)
  todos() {
    return this.planosLeituraService.planosParaGestao();
  }

  /**
   * E5 — GET /api/prescricoes/:id
   *
   * O `:id` é escolhido por quem faz o pedido (vem da barra de endereços), por
   * isso o papel tem de ser verificado e o id validado como UUID: um literal
   * que escape à ordenação das rotas dá 400 em vez de chegar à base de dados.
   */
  @Get(':id')
  @Roles(UserRole.CORPO_CLINICO)
  porId(@Param('id', ParseUUIDPipe) id: string) {
    return this.planosLeituraService.planoParaEdicao(id);
  }
}
