import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../auth/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { SupabaseAuthGuard } from '../auth/supabase-auth.guard';
import type { SupabaseJwtPayload } from '../auth/supabase-jwt-payload.interface';
import { UserRole } from '../users/user-role.enum';
// ATENÇÃO: estes três DTOs têm de ser importados POR VALOR, nunca com
// `import type`. Com `import type` o TypeScript elide a referência e emite
// `design:paramtypes: [Object]`; o ValidationPipe global vê `Object`, decide
// que não há nada para validar e salta a classe INTEIRA. Compila na mesma, não
// dá aviso nenhum, e o resultado medido foi um `POST /sessoes/concluir` com
// `esforco_1_a_10: 99999` a devolver 201 — com `@Max(10)`, `@IsUUID` e o
// `whitelist: true` todos declarados e todos inertes.
import { ConcluirExercicioDto } from './dto/concluir-exercicio.dto';
import { IniciarExercicioDto } from './dto/iniciar-exercicio.dto';
import { ListarMinhasSessoesQueryDto } from './dto/listar-minhas-sessoes.dto';
import { SessoesService } from './sessoes.service';

/**
 * Todas as rotas de sessões exigem sessão iniciada.
 *
 * As guardas ficam ao nível da CLASSE de propósito: `@Roles(...)` num método
 * sem `RolesGuard` na cadeia não dá erro de compilação nem aviso nenhum —
 * falha ABERTA, em silêncio, e o handler responde 200 a quem não devia.
 * Declarando a cadeia aqui, um método novo nasce sempre com as duas guardas e
 * o `@Roles` que lhe puserem é sempre honrado.
 *
 * O `RolesGuard` deixa passar quem não tem `@Roles`, pelo que `POST /iniciar` e
 * `POST /concluir` mantêm exatamente o comportamento de hoje: qualquer
 * utilizador autenticado.
 */
@Controller('sessoes')
@UseGuards(SupabaseAuthGuard, RolesGuard)
export class SessoesController {
  constructor(private readonly sessoesService: SessoesService) {}

  // GET /api/sessoes/minhas?limite=N
  @Get('minhas')
  @Roles(UserRole.PACIENTE)
  minhas(
    @CurrentUser() payload: SupabaseJwtPayload,
    @Query() query: ListarMinhasSessoesQueryDto,
  ) {
    // O id do paciente vem do token, nunca do pedido: não existe caminho,
    // query nem corpo por onde uma criança possa pedir o histórico de outra.
    return this.sessoesService.listarMinhasSessoes(payload.sub, query.limite);
  }

  // GET /api/sessoes/estatisticas
  @Get('estatisticas')
  @Roles(UserRole.CORPO_CLINICO)
  estatisticas() {
    // Agregado de todo o hospital: dois números, sem qualquer identificador
    // de criança na resposta.
    return this.sessoesService.getEstatisticas();
  }

  // POST /api/sessoes/iniciar
  @Post('iniciar')
  iniciar(
    @CurrentUser() payload: SupabaseJwtPayload,
    @Body() dto: IniciarExercicioDto,
  ) {
    return this.sessoesService.iniciarExercicio(payload.sub, dto);
  }

  // POST /api/sessoes/concluir
  @Post('concluir')
  concluir(
    @CurrentUser() payload: SupabaseJwtPayload,
    @Body() dto: ConcluirExercicioDto,
  ) {
    return this.sessoesService.concluirExercicio(payload.sub, dto);
  }
}
