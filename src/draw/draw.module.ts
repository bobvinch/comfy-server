import { Module } from '@nestjs/common';
import { DrawService } from './draw.service';
import { DrawController } from './draw.controller';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config/dist';
import { CacheModule } from '../cache/cache.module';

@Module({
  controllers: [DrawController],
  exports: [DrawService, BullModule],
  imports: [
    BullModule.forRootAsync({
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
    BullModule.registerQueue({
      name: 'draw',
    }),
    CacheModule,
  ],
  providers: [DrawService],
})
export class DrawModule {}
