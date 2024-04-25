import { Controller, Get, Inject } from '@nestjs/common';
import { AppService } from './app.service';
import { DrawService } from './draw/draw.service';

@Controller()
export class AppController {
  constructor(
    private readonly appService: AppService,
    private readonly drawService: DrawService,
  ) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }
  @Get('test')
  test(): string {
    return process.env.REDIS_HOST;
  }
}
