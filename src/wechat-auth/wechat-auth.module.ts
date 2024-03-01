import { Module } from '@nestjs/common';
import { WechatAuthService } from './wechat-auth.service';
import { WechatAuthController } from './wechat-auth.controller';

@Module({
  controllers: [WechatAuthController],
  providers: [WechatAuthService],
})
export class WechatAuthModule {}
