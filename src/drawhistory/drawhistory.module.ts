import { Module } from '@nestjs/common';
import { DrawhistoryService } from './drawhistory.service';
import { DrawhistoryController } from './drawhistory.controller';

import { MongooseModule } from '@nestjs/mongoose';
import { Drawhistory, DrawhistorySchema } from 'src/schemas/DrawHistory.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Drawhistory.name, schema: DrawhistorySchema },
    ]),
  ],
  controllers: [DrawhistoryController],
  providers: [DrawhistoryService],
  exports: [DrawhistoryModule, DrawhistoryService],
})
export class DrawhistoryModule {}
