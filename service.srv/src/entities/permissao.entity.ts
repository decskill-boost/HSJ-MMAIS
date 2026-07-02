import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';
import { Perfil } from './perfil.entity';

@Entity('permissao')
export class Permissao {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  nome: string; // Ex: 'criar:exercicio', 'ver:pacientes'

  @ManyToMany(() => Perfil, (perfil) => perfil.permissoes)
  perfis: Perfil[];
}
