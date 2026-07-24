import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Utilizador } from './utilizador.entity';
import { Exercicio } from './exercicio.entity';
import { Prescricao } from './prescricao.entity';

export enum SessaoStatus {
  INICIADO = 'iniciado',
  CONCLUIDO = 'concluido',
  FALHADO = 'falhado',
}

@Entity('sessoes_realizadas')
export class SessaoRealizada {
  @PrimaryGeneratedColumn('uuid')
  id_sessao: string;

  @ManyToOne(() => Utilizador)
  @JoinColumn({ name: 'id_paciente' })
  id_paciente: Utilizador;

  @ManyToOne(() => Exercicio)
  @JoinColumn({ name: 'id_exercicio' })
  id_exercicio: Exercicio;

  @Column({ type: 'timestamp' })
  data_hora: Date;

  @Column({ type: 'int', nullable: true })
  esforco_1_a_10: number;

  @Column({ type: 'int', nullable: true })
  diversao_1_a_5: number;

  @Column({ type: 'double precision', nullable: true })
  duracao: number;

  @Column({ type: 'boolean', default: false })
  concluido: boolean;

  @Column({
    type: 'enum',
    enum: SessaoStatus,
    enumName: 'sessao_status',
    default: SessaoStatus.CONCLUIDO,
  })
  status: SessaoStatus;

  @ManyToOne(() => Prescricao, { nullable: true })
  @JoinColumn({ name: 'id_prescricao' })
  id_prescricao: Prescricao | null;

  @Column({ type: 'boolean', default: false })
  teve_problemas: boolean;

  @Column({ type: 'boolean', default: false })
  participacao_familiares: boolean;

  @Column({ type: 'int', nullable: true, default: null })
  fc_maxima: number | null;

  @Column({ type: 'int', nullable: true, default: null })
  fc_media: number | null;
}
