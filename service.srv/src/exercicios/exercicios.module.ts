import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { UsersModule } from '../users/users.module';
import { ExerciciosService } from './exercicios.service';
import { ExerciciosController } from './exercicios.controller';

// 1. Importas as entidades necessárias
import { Exercicio } from '../entities/exercicio.entity';
import { Prescricao } from '../entities/prescricao.entity';
import { SessaoRealizada } from '../entities/sessao-realizada.entity';

@Module({
  imports: [
    // 2. Registá-las no forFeature
    TypeOrmModule.forFeature([Exercicio, Prescricao, SessaoRealizada]),
    // AuthModule traz as guardas; o RolesGuard injeta UsersService, que o Nest
    // resolve no contexto de quem usa a guarda — daí também o UsersModule.
    AuthModule,
    UsersModule,
  ],
  providers: [ExerciciosService],
  controllers: [ExerciciosController],
})
export class ExerciciosModule {}
