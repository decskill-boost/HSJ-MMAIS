import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Perfil } from '../entities/perfil.entity';
import { Utilizador } from '../entities/utilizador.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Utilizador)
    private readonly utilizadorRepo: Repository<Utilizador>,
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
  ) {}

  async findById(id_user: string) {
    const user = await this.utilizadorRepo.findOne({
      where: { id_user },
    });

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado');
    }

    const perfil = await this.perfilRepo.findOne({
      where: { nome: user.tipo_utilizador },
    });

    const rolePermissions = perfil?.permissoes?.map((p) => p.nome) ?? [];
    const directPermissions = user.permissoesDirectas?.map((p) => p.nome) ?? [];

    const permissions = [
      ...new Set([...rolePermissions, ...directPermissions]),
    ];

    return {
      idUser: user.id_user,
      nome: user.nome,
      email: user.email,
      role: user.tipo_utilizador,
      xp: user.xp,
      nivel: user.nivel,
      streakAtual: user.streak_atual,
      urlFotoPerfil: user.url_foto_perfil,
      permissions,
    };
  }

  async findByEmail(email: string) {
    const user = await this.utilizadorRepo.findOne({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado');
    }

    const perfil = await this.perfilRepo.findOne({
      where: { nome: user.tipo_utilizador },
    });

    const rolePermissions = perfil?.permissoes?.map((p) => p.nome) ?? [];
    const directPermissions = user.permissoesDirectas?.map((p) => p.nome) ?? [];

    const permissions = [
      ...new Set([...rolePermissions, ...directPermissions]),
    ];

    return {
      idUser: user.id_user,
      nome: user.nome,
      email: user.email,
      role: user.tipo_utilizador,
      xp: user.xp,
      nivel: user.nivel,
      streakAtual: user.streak_atual,
      urlFotoPerfil: user.url_foto_perfil,
      permissions,
    };
  }
}
