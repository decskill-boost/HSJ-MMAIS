import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('permissoes')
export class Permissao {
  @PrimaryGeneratedColumn('uuid', { name: 'id_permissao' })
  id: string;

  @Column({ type: 'varchar', unique: true })
  nome: string;
}
