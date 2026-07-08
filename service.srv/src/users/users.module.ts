import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { Perfil } from '../entities/perfil.entity';
import { Utilizador } from '../entities/utilizador.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { Permissao } from '../entities/permissao.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Utilizador, Perfil, Permissao]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
