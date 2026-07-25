import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface HealthStatus {
  status: 'ok';
  message: string;
  /** Ambiente em execução (dev | pre | prd). */
  env: string;
  /** Segundos desde o arranque do processo. */
  uptime: number;
}

@Injectable()
export class AppService {
  constructor(private readonly config: ConfigService) {}

  getHealth(): HealthStatus {
    return {
      status: 'ok',
      message: 'NestJS está a funcionar!',
      env: this.config.get<string>('APP_ENV', 'dev'),
      uptime: Math.round(process.uptime()),
    };
  }
}
