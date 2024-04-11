import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheController } from './cache.controller';
import { ConfigService } from '@nestjs/config';
import { RedisModule as NestRedisModule } from '@liaoliaots/nestjs-redis';
@Global()
@Module({
  imports: [NestRedisModule.forRoot({ config: { db: 2 } })],
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}
