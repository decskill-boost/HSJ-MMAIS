import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let controller: AppController;

  beforeEach(async () => {
    const modulo: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: ConfigService,
          useValue: { get: jest.fn().mockReturnValue('dev') },
        },
      ],
    }).compile();

    controller = modulo.get<AppController>(AppController);
  });

  describe('health', () => {
    it('responde "ok" com o ambiente em execução', () => {
      expect(controller.getHealth()).toEqual({
        status: 'ok',
        message: expect.any(String) as string,
        env: 'dev',
        uptime: expect.any(Number) as number,
      });
    });
  });
});
