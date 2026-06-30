import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Perfil } from '../users/perfil.entity';
import { Permissao } from '../users/permissao.entity';
import { SeedService } from './seed.service';

@Module({
  imports: [TypeOrmModule.forFeature([Perfil, Permissao])],
  providers: [SeedService],
})
export class SeedModule {}
