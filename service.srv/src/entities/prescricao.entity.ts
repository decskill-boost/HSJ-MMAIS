import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Utilizador } from './utilizador.entity';

@Entity('prescricoes')
export class Prescricao {
  @PrimaryGeneratedColumn('uuid')
  id_prescricao: string;

  @CreateDateColumn({ type: 'timestamp' })
  data_inicio: Date;

  @ManyToOne(() => Utilizador)
  @JoinColumn({ name: 'id_paciente' })
  id_paciente: Utilizador;

  @ManyToOne(() => Utilizador)
  @JoinColumn({ name: 'id_medico' })
  id_medico: Utilizador;

  @Column({ type: 'int' })
  frequencia_semanal: number;

  @Column({ type: 'timestamp', nullable: true, default: null })
  data_fim: Date | null;

  @Column({ type: 'timestamp', nullable: true, default: null })
  data_validade: Date | null;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'text', nullable: true })
  notas_medicas: string;
}
