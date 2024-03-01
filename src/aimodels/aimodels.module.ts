import { Module } from '@nestjs/common';
import { AimodelsService } from './aimodels.service';
import { AimodelsController } from './aimodels.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { AIModels, AIModelsSchema } from 'src/schemas/AIMdels.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AIModels.name, schema: AIModelsSchema },
    ]),
  ],
  controllers: [AimodelsController],
  providers: [AimodelsService],
})
export class AimodelsModule {}
