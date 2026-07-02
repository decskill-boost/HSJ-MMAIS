import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
} from 'typeorm';
import { Permissao } from './permissao.entity';

@Entity('perfil')
export class Perfil {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string; // Ex: 'Medico', 'Administrador'

  @ManyToMany(() => Permissao, (permissao) => permissao.perfis)
  @JoinTable({ name: 'perfil_permissao' })
  permissoes: Permissao[];
}
