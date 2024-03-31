import { Module } from '@nestjs/common';
import { DrawService } from './draw.service';
import { DrawController } from './draw.controller';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config/dist';

@Module({
  imports: [
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
  ],
  controllers: [DrawController],
  providers: [DrawService],
  exports: [DrawService, BullModule],
})
export class DrawModule {}
