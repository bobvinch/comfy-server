import { Global, Module } from '@nestjs/common';
import { DrawService } from './DrawService';
import { QueueModule } from '../Queue/QueueModule';
import { BullModule } from "@nestjs/bull";
// import { DrawService } from '../draw/DrawService';
@Global()
@Module({
  // imports: [BullModule],
  providers: [DrawService],
  exports: [DrawService],
})
export class DrawModule {}
