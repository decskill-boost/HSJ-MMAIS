import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

// 1. Importas as entidades que pertencem a este módulo
import { Utilizador } from '../entities/utilizador.entity';
import { Perfil } from '../entities/perfil.entity';
import { Permissao } from '../entities/permissao.entity';

@Module({
  imports: [
    // 2. Colocas todas aqui dentro do forFeature
    TypeOrmModule.forFeature([Utilizador, Perfil, Permissao]),
  ],
  providers: [UsersService],
  controllers: [UsersController],
  exports: [UsersService],
})
export class UsersModule {}
