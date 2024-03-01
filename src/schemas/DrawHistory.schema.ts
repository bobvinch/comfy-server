import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { ApiProperty } from '@nestjs/swagger';
import { Document, HydratedDocument } from 'mongoose';

export type DrawhistoryDocument = HydratedDocument<Drawhistory>;

@Schema()
export class Drawhistory extends Document {
  @Prop()
  @ApiProperty({ description: '用户的id', example: '62fdfdjdkfuieoroererje' })
  user_id: string;

  @Prop()
  prompt_id: string;

  @Prop()
  draw_api: symbol;

  @Prop()
  filename: string;

  @Prop({ default: false })
  status: boolean;
}

export const DrawhistorySchema = SchemaFactory.createForClass(Drawhistory);
