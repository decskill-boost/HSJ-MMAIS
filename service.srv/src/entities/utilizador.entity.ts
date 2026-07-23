import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Permissao } from './permissao.entity';

@Entity('utilizadores')
export class Utilizador {
  @PrimaryGeneratedColumn('uuid')
  id_user: string;

  @Column({ type: 'varchar', length: 255 })
  nome: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  tipo_utilizador: string;

  @Column({ type: 'int', default: 0 })
  xp: number;

  @Column({ type: 'int', default: 1 })
  nivel: number;

  @Column({ type: 'int', default: 0 })
  streak_atual: number;

  @Column({ type: 'timestamp', nullable: true, default: null })
  streak_ultima_atividade: Date | null;

  @CreateDateColumn()
  data_registo: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url_foto_perfil: string | null;



  // 👇 ESTA É A PARTE QUE FALTAVA PARA O TYPESCRIPT FICAR FELIZ 👇
  @ManyToMany(() => Permissao, { eager: true })
  @JoinTable({
    name: 'utilizadores_permissoes',
    joinColumn: { name: 'id_user' },
    inverseJoinColumn: { name: 'id_permissao' },
  })
  permissoesDirectas: Permissao[];
}
