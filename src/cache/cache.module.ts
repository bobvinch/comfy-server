import { Module } from '@nestjs/common';
import { CacheService } from './cache.service';
import { CacheController } from './cache.controller';
import { createClient } from 'redis';

@Module({
  controllers: [CacheController],
  providers: [
    CacheService,
    {
      provide: 'REDIS_CLIENT',
      async useFactory() {
        const client = createClient({
          socket: {
            host: '127.0.0.1',
            port: 6379,
          },
        });
        await client.connect();
        return client;
      },
    },
  ],
  exports: [CacheService],
})
export class CacheModule {
}
