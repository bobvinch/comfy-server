import { Module } from '@nestjs/common';
import { DrawService } from './draw.service';
import { DrawController } from './draw.controller';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config/dist';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (ConfigService: ConfigService) => ({
        redis: {
          host: ConfigService.get('CONFIG_COMFYUI_QUENE_REDIS_HOST'),
          port: ConfigService.get('CONFIG_COMFYUI_QUENE_REDIS_PORT'),
          password: ConfigService.get('CONFIG_COMFYUI_QUENE_REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueueAsync({
      name: 'draw',
    }),
  ],
  controllers: [DrawController],
  providers: [DrawService],
  exports: [DrawService, BullModule],
})
export class DrawModule {}
