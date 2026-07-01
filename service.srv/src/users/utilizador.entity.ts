import { Column, Entity, JoinTable, ManyToMany, PrimaryColumn } from 'typeorm';
import { Permissao } from './permissao.entity';

@Entity('utilizadores')
export class Utilizador {
  @PrimaryColumn({ name: 'id_user', type: 'uuid' })
  idUser: string;

  @Column({ type: 'varchar' })
  nome: string;

  @Column({ type: 'varchar', unique: true })
  email: string;

  @Column({ name: 'tipo_utilizador', type: 'varchar' })
  tipoUtilizador: string;

  @Column({ type: 'int', default: 0 })
  xp: number;

  @Column({ type: 'int', default: 1 })
  nivel: number;

  @Column({ name: 'streak_atual', type: 'int', default: 0 })
  streakAtual: number;

  @Column({ name: 'data_registo', type: 'timestamp' })
  dataRegisto: Date;

  @Column({ name: 'url_foto_perfil', type: 'varchar', nullable: true })
  urlFotoPerfil: string | null;

  @ManyToMany(() => Permissao, { eager: true })
  @JoinTable({
    name: 'utilizadores_permissoes',
    joinColumn: { name: 'id_user' },
    inverseJoinColumn: { name: 'id_permissao' },
  })
  permissoesDirectas: Permissao[] = [];
}
