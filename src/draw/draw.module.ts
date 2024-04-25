import { Module } from '@nestjs/common';
import { DrawService } from './draw.service';
import { DrawController } from './draw.controller';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config/dist';
import { CacheModule } from '../cache/cache.module';
import { WsGateway } from '../ws/ws.gateway';
import { FileModule } from '../file/file.module';
import * as process from 'node:process';

@Module({
  controllers: [DrawController],
  exports: [DrawService, BullModule],
  imports: [
    BullModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        redis: {
          host: config.get('CONFIG_COMFYUI_QUENE_REDIS_HOST'),
          port: config.get('CONFIG_COMFYUI_QUENE_REDIS_PORT'),
          password: config.get('CONFIG_COMFYUI_QUENE_REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'draw',
    }),
    CacheModule,
    FileModule,
  ],
  providers: [DrawService],
})
export class DrawModule {}
