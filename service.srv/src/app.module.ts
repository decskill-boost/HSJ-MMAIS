import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { Utilizador } from './entities/utilizador.entity';
import { Exercicio } from './entities/exercicio.entity';
import { Prescricao } from './entities/prescricao.entity';
import { PrescricaoExercicio } from './entities/prescricao-exercicio.entity';
import { SessaoRealizada } from './entities/sessao-realizada.entity';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env'],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get('DB_USERNAME'),
        password: config.get('DB_PASSWORD'),
        database: config.get('DB_NAME'),
        entities: [Utilizador, Exercicio, Prescricao, PrescricaoExercicio, SessaoRealizada],
        synchronize: config.get('APP_ENV') === 'dev',
        ssl: { rejectUnauthorized: false },
      }),
    }),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}