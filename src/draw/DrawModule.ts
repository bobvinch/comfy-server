import { Global, Module } from '@nestjs/common';
import { DrawService } from './DrawService';
import { BullModule } from "@nestjs/bull";
// import { DrawService } from '../draw/DrawService';
@Global()
@Module({
  providers: [DrawService],
  exports: [DrawService],
})
export class DrawModule {}
