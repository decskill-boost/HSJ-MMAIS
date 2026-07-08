import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercicio } from '../entities/exercicio.entity';

@Injectable()
export class ExerciciosService {
  constructor(
    @InjectRepository(Exercicio)
    private readonly exercicioRepository: Repository<Exercicio>,
  ) {}

  // Listar todos os exercícios ativos
  findAll() {
    return this.exercicioRepository.find({
      where: { ativo: true },
    });
  }

  // Buscar um exercício por id
  findOne(id: string) {
    return this.exercicioRepository.findOne({
      where: { id_exercicio: id, ativo: true },
    });
  }

  async create(dados: Partial<Exercicio>) {
    const ex = this.exercicioRepository.create(dados);
    return this.exercicioRepository.save(ex);
  }

  // Atualizar um exercício
  async update(id: string, dados: Partial<Exercicio>) {
    await this.exercicioRepository.update(id, dados);
    return this.findOne(id);
  }

  // Soft delete — marca como inativo mas mantém na BD
  async remove(id: string) {
    await this.exercicioRepository.update(id, { ativo: false });
    return { message: 'Exercício eliminado com sucesso' };
  }
}
