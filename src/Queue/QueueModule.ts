import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config/dist';

@Module({
  imports: [
    BullModule.forRoot({}),
    BullModule.registerQueueAsync({
      name: 'draw',
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: '127.0.0.1',
          port: 6379,
          password: configService.get('CONFIG_COMFYUI_QUENE_REDIS_PASSWORD'),
        },
      }),
    }),
  ],
  exports: [BullModule],
})
export class QueueModule {}
