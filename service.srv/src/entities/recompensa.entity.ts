import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Catálogo de conquistas: cada uma desbloqueia a partir de um total de XP.
 *
 * `synchronize: false` de propósito. A tabela já existe na base de dados mas
 * não consta do `docs/schema.sql` (que está atrasado), por isso não temos fonte
 * fiável da sua forma completa — as colunas abaixo são as que a aplicação
 * comprovadamente lê. Excluir a entidade da sincronização garante que o TypeORM
 * nunca tenta alterar uma tabela cujo esquema não conhecemos por inteiro, nem
 * sequer em dev (onde `synchronize` está ligado). Colunas a mais na tabela real
 * são inofensivas: só se seleciona o que está declarado aqui.
 */
@Entity({ name: 'recompensas', synchronize: false })
export class Recompensa {
  @PrimaryGeneratedColumn('uuid')
  id_recompensa: string;

  @Column({ type: 'text' })
  nome: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'int' })
  xp_necessario: number;

  @Column({ type: 'text' })
  icone: string;
}
