import { Module } from '@nestjs/common';
import { WechatAuthService } from './wechat-auth.service';
import { WechatAuthController } from './wechat-auth.controller';
import { DrawService } from '../draw/draw.service';
import { DrawModule } from '../draw/draw.module';
// import { DrawService } from '../draw/DrawService';

@Module({
  imports: [DrawModule],
  controllers: [WechatAuthController],
  providers: [WechatAuthService, DrawService],
  exports: [WechatAuthService],
})
export class WechatAuthModule {}
