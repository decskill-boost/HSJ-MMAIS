import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Permissao } from './permissao.entity';

@Entity('perfis')
export class Perfil {
  @PrimaryGeneratedColumn('uuid', { name: 'id_perfil' })
  id: string;

  @Column({ type: 'varchar', unique: true })
  nome: string;

  @ManyToMany(() => Permissao, { eager: true })
  @JoinTable({
    name: 'perfis_permissoes',
    joinColumn: { name: 'id_perfil' },
    inverseJoinColumn: { name: 'id_permissao' },
  })
  permissoes: Permissao[] = [];
}
