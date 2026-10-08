import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ArmazenamentoModule } from './armazenamento/armazenamento.module';
import { AssinarVideosInterceptor } from './armazenamento/assinar-videos.interceptor';
import { ExerciciosModule } from './exercicios/exercicios.module';
import { SessoesModule } from './sessoes/sessoes.module';
import { UsersModule } from './users/users.module';
import { PrescricoesModule } from './prescricoes/prescricoes.module';
import { PacientesModule } from './pacientes/pacientes.module';

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
        autoLoadEntities: true,
        synchronize: config.get('APP_ENV') === 'dev',
        ssl: ['localhost', '127.0.0.1'].includes(config.get('DB_HOST') ?? '')
          ? false
          : { rejectUnauthorized: false },
      }),
    }),
    ExerciciosModule,
    SessoesModule,
    UsersModule,
    PrescricoesModule,
    PacientesModule,
    ArmazenamentoModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Os vídeos estão num bucket privado: todo o `url_video` que sai da API
    // leva um link de leitura assinado no lugar da referência `gs://`.
    { provide: APP_INTERCEPTOR, useClass: AssinarVideosInterceptor },
  ],
})
export class AppModule {}
