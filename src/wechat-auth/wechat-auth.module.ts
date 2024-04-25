import { Module } from '@nestjs/common';
import { WechatAuthService } from './wechat-auth.service';
import { WechatAuthController } from './wechat-auth.controller';
import { DrawModule } from '../draw/draw.module';
// import { DrawService } from '../draw/DrawService';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [DrawModule, UsersModule],
  controllers: [WechatAuthController],
  providers: [WechatAuthService],
  exports: [WechatAuthService],
})
export class WechatAuthModule {}
