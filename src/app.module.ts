import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WsGateway } from './ws/ws.gateway';
import { DrawService } from './draw/DrawService';
import { DrawConsumer } from './draw/DrawCosumer';
import { ConfigModule } from '@nestjs/config';
import { ConfigService } from '@nestjs/config/dist';
import { BullModule } from '@nestjs/bull';
//定时任务
import { ScheduleModule } from '@nestjs/schedule';

//'mongodb://username:password@localhost:27017/nest'
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`, '.env'],
    }),
    BullModule.registerQueueAsync({
      name: 'draw',
      useFactory: () => ({
        redis: {
          host: new ConfigService().get('CONFIG_COMFYUI_QUENE_REDIS_HOST'),
          port: new ConfigService().get('CONFIG_COMFYUI_QUENE_REDIS_PORT'),
          password: new ConfigService().get(
            'CONFIG_COMFYUI_QUENE_REDIS_PASSWORD',
          ),
        },
      }),
    }),
    ScheduleModule.forRoot(),
  ],
  controllers: [AppController],
  providers: [AppService, WsGateway, DrawService, DrawConsumer],
})
export class AppModule {}
