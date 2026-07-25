import { Controller, Get } from '@nestjs/common';
import { AppService, type HealthStatus } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  /** Sonda de saúde do serviço (`GET /api/health`). */
  @Get('health')
  getHealth(): HealthStatus {
    return this.appService.getHealth();
  }
}
