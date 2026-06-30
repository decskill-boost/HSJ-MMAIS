import { Entity, ManyToOne, JoinColumn, PrimaryColumn } from 'typeorm';
import { Prescricao } from './prescricao.entity';
import { Exercicio } from './exercicio.entity';

@Entity('prescricoes_exercicios')
export class PrescricaoExercicio {
  @PrimaryColumn()
  id_prescricao: string;

  @PrimaryColumn()
  id_exercicio: string;

  @ManyToOne(() => Prescricao)
  @JoinColumn({ name: 'id_prescricao' })
  prescricao: Prescricao;

  @ManyToOne(() => Exercicio)
  @JoinColumn({ name: 'id_exercicio' })
  exercicio: Exercicio;
}