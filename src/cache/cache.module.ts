import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheController } from './cache.controller';
import { ConfigService } from '@nestjs/config';
import { RedisModule } from '@nestjs-modules/ioredis';
@Global()
@Module({
  imports: [
    RedisModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        type: 'single',
        url: `redis://${config.get('CONFIG_COMFYUI_QUENE_REDIS_HOST')}:${config.get('CONFIG_COMFYUI_QUENE_REDIS_PORT')}`,
        options: {
          password: config.get('CONFIG_COMFYUI_QUENE_REDIS_PASSWORD'),
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
