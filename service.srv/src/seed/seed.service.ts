import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ROLE_PERMISSIONS, Permission } from '../users/permission.enum';
import { Perfil } from '../users/perfil.entity';
import { Permissao } from '../users/permissao.entity';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Perfil)
    private readonly perfilRepo: Repository<Perfil>,
    @InjectRepository(Permissao)
    private readonly permissaoRepo: Repository<Permissao>,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.APP_ENV !== 'dev') return;
    await this.seed();
  }

  private async seed() {
    // Upsert all permissions
    for (const nome of Object.values(Permission)) {
      await this.permissaoRepo.upsert({ nome }, ['nome']);
    }

    // Upsert each perfil with its permissions
    for (const [role, perms] of Object.entries(ROLE_PERMISSIONS)) {
      let perfil = await this.perfilRepo.findOne({ where: { nome: role } });
      if (!perfil) {
        perfil = this.perfilRepo.create({ nome: role });
      }

      const permissoes = (
        await Promise.all(
          perms.map((p) => this.permissaoRepo.findOne({ where: { nome: p } })),
        )
      ).filter((p): p is Permissao => p !== null);

      perfil.permissoes = permissoes;
      await this.perfilRepo.save(perfil);
    }
  }
}
