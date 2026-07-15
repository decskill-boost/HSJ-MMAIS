import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('exercicios')
export class Exercicio {
  @PrimaryGeneratedColumn('uuid')
  id_exercicio: string;

  @Column({ type: 'varchar', length: 255 })
  nome_exercicio: string;

  @Column({ type: 'int', default: 0 })
  recompensa_xp: number;

  @Column({ type: 'varchar', length: 255 })
  categoria: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  url_video: string;

  @Column({ type: 'int' })
  duracao_segundos: number;

  @Column({ type: 'int' })
  dificuldade_clinica: number;

  @Column({ type: 'text', nullable: true })
  descricao: string;

  // ADICIONA ESTA LINHA ABAIXO
  @Column({ type: 'text', nullable: true })
  materiais_necessarios: string;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'varchar', length: 1, default: 'A', nullable: true })
  dificuldade: string;
}
