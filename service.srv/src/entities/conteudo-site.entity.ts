import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('conteudo_site')
export class ConteudoSite {
  @PrimaryColumn()
  chave: string;

  @Column({ type: 'text', nullable: true })
  valor: string;
}
