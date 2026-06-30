import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Perfil } from './perfil.entity';
import { Utilizador } from './utilizador.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(Utilizador)
    private readonly utilizadorRepo: Repository<Utilizador>,
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
  ) {}

  async findByEmail(email: string) {
    const user = await this.utilizadorRepo.findOne({ where: { email } });

    if (!user) {
      throw new NotFoundException('Utilizador não encontrado');
    }

    const perfil = await this.perfilRepo.findOne({
      where: { nome: user.tipoUtilizador },
    });

    const rolePermissions = perfil?.permissoes.map((p) => p.nome) ?? [];
    const directPermissions = user.permissoesDirectas.map((p) => p.nome);
    const permissions = [...new Set([...rolePermissions, ...directPermissions])];

    return {
      idUser: user.idUser,
      nome: user.nome,
      email: user.email,
      role: user.tipoUtilizador,
      xp: user.xp,
      nivel: user.nivel,
      streakAtual: user.streakAtual,
      urlFotoPerfil: user.urlFotoPerfil,
      permissions,
    };
  }
}
