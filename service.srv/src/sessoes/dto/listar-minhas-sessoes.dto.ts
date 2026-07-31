import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Parâmetros de consulta de `GET /sessoes/minhas`.
 *
 * Repare-se sobretudo no que NÃO está aqui: não existe campo de paciente. O
 * histórico devolvido é sempre o de quem faz o pedido (`payload.sub`, tirado
 * do token verificado), pelo que uma criança não tem como exprimir «as
 * sessões de outra criança» — nem de propósito nem por engano. O
 * `whitelist: true` do ValidationPipe global descarta qualquer outro
 * parâmetro que venha no URL, incluindo um `id_paciente` improvisado.
 */
export class ListarMinhasSessoesQueryDto {
  /**
   * Sem `limite` devolve-se o histórico todo — é o comportamento de hoje do
   * ecrã «O meu progresso» e não se quer mudar o que a criança vê. O tecto de
   * 200 existe apenas para que uma linha de endereço não consiga pedir uma
   * resposta arbitrariamente grande.
   */
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'O limite tem de ser um número inteiro.' })
  @Min(1, { message: 'O limite mínimo é 1.' })
  @Max(200, { message: 'O limite máximo é 200.' })
  limite?: number;
}
