import { Module } from '@nestjs/common';
import { WechatAuthService } from './wechat-auth.service';
import { WechatAuthController } from './wechat-auth.controller';
// import { DrawService } from '../draw/DrawService';

@Module({
  // imports: [DrawModule],
  controllers: [WechatAuthController],
  providers: [WechatAuthService],
})
export class WechatAuthModule {}
