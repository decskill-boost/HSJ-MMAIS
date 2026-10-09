import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConteudoController } from './conteudo.controller';
import { ConteudoService } from './conteudo.service';
import { ConteudoSite } from '../entities/conteudo-site.entity';

import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ConteudoSite]),
    UsersModule,
  ],
  controllers: [ConteudoController],
  providers: [ConteudoService],
})
export class ConteudoModule {}
