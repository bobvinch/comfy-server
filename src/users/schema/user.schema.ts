import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop()
  @ApiProperty({
    description: '昵称',
    example: '张三',
  })
  nickname: string;
  @ApiProperty({
    description: '密码',
    example: '123456',
  })
  @Prop()
  password: string;
  @ApiProperty({
    description: '用户名',
    example: 'wechat_abdfkdfjdkfdkfjjkdjf',
  })
  @Prop()
  username: string;
  @ApiProperty({
    description: '微信openid',
    example: 'abdfkdfjdkfdkfjjkdjf',
  })
  @Prop()
  wx_openid: string;
  @ApiProperty({
    description: '微信unionid',
    example: 'abdfkdfjdkfdkfjjkdjf',
  })
  @Prop()
  wx_unionid: string;
  @ApiProperty({
    description: '微信头像',
    example: 'abdfkdfjdkfdkfjjkdjf',
  })
  @Prop()
  avatar_url: string; //头像
  @Prop()
  @ApiProperty({
    description: '邮箱',
    example: 'efpyi@example.com',
  })
  email: string;
  @Prop()
  @ApiProperty({
    description: '邀请人id',
    example: 'UVGTBDS',
  })
  inviter_uid: string;
  @Prop()
  @ApiProperty({
    description: '最后登录时间',
    example: '121212133900',
  })
  last_login_date: number;
  @Prop()
  @ApiProperty({
    description: '注册时间',
    example: '121212133900',
  })
  register_date: number;
  @Prop()
  @ApiProperty({
    description: '最后登录ip',
    example: '127.0.0.1',
  })
  last_login_ip: string;
  @Prop()
  @ApiProperty({
    description: '手机号',
    example: '13888888888',
  })
  mobile: string;
  @Prop()
  @ApiProperty({
    description: '邀请码',
    example: '123456',
  })
  my_invite_code: string;
  @Prop()
  @ApiProperty({
    description: '角色',
    example: ['admin', 'user'],
  })
  role: Array<string>;
  @Prop()
  @ApiProperty({
    description: 'token',
    example: '2121213424gfgdfdfdfsdfsdfdffg',
  })
  token: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
