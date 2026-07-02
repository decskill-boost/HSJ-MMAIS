import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Utilizador } from './utilizador.entity';

@Entity('prescricoes')
export class Prescricao {
  @PrimaryGeneratedColumn('uuid')
  id_prescricao: string;

  @ManyToOne(() => Utilizador)
  @JoinColumn({ name: 'id_paciente' })
  id_paciente: Utilizador;

  @ManyToOne(() => Utilizador)
  @JoinColumn({ name: 'id_medico' })
  id_medico: Utilizador;

  @Column({ type: 'int' })
  frequencia_semanal: number;

  @Column({ type: 'timestamp' })
  data_validade: Date;

  @Column({ type: 'boolean', default: true })
  ativo: boolean;

  @Column({ type: 'text', nullable: true })
  notas_medicas: string;
}
