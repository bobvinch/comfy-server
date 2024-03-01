import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, HydratedDocument } from 'mongoose';

export type DrawhistoryDocument = HydratedDocument<AIModels>;

@Schema()
export class AIModels extends Document {
  @Prop()
  @ApiProperty({ description: '模型显示名称', example: '百度文心千帆' })
  title: string;

  @Prop()
  name: string;

  @Prop()
  icon: symbol;

  @Prop()
  iconpath: string;

  @Prop({ default: true })
  isenable: boolean;
}

export const AIModelsSchema = SchemaFactory.createForClass(AIModels);
