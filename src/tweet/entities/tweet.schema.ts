import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = HydratedDocument<Tweet>;
@Schema()
export class Tweet {
  @Prop()
  @ApiProperty({
    description: 'user_id',
    example: '1234567890',
  })
  user_id: string;
  @Prop()
  models: object[];
  @Prop()
  transitions: object[];
  @Prop()
  effects: object[];
  @Prop()
  animations: object[];
  @Prop()
  @ApiProperty({
    description: '推文项目',
    example: [
      {
        projectName: 'projectName',
        Resolution_id: 0,
        cover_url: 'cover_url',
        full_contents: 'full_contents',
        useVideo: true,
        backgroundMusic_id: 1,
        contents: [
          {
            id: 1,
            content: 'content',
            prompts: 'prompts',
            images: ['images'],
            choose_image_index: 1,
            audio: ['audio'],
            isTalk: true,
            role: 'role',
            scene_id: 1,
            video: 'video',
            transition: 'transition',
            video_effect: 'video_effect',
            animation: 'animation',
          },
        ],
      },
    ],
  })
  projects: TweetProject[];
  @Prop()
  roles: object[];
  @Prop()
  scenes: object[];
}

export interface TweetProject {
  projectName: string;
  Resolution_id: number;
  cover_url: string;
  full_contents: string;
  useVideo: boolean;
  backgroundMusic_id: number;
  contents: TweetData[];
}

// 工作空间的数据接口
export interface TweetData {
  id?: number;
  content?: string;
  prompts?: string;
  images: string[];
  choose_image_index?: number;
  audio: string[];
  isTalk?: boolean; //是否是对话
  role?: string; //人物名称
  scene_id?: number; //场景id
  video: string;
  transition?: string;
  video_effect?: string;
  animation?: string;
}
export const TweetSchema = SchemaFactory.createForClass(Tweet);
