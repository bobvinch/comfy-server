import { Body, Controller, Get, Logger, Post, Query } from '@nestjs/common';
import { WechatAuthService } from './wechat-auth.service';
import { ApiProperty } from "@nestjs/swagger";

@Controller('wechatauth')
export class WechatAuthController {
  constructor(private readonly wechatAuthService: WechatAuthService) {}
  private readonly logger = new Logger(WechatAuthController.name);
  @ApiProperty({

  })
  @Get('getuserinfo')
  async getUserInfo(@Query('code') code: string) {
    this.logger.log(code);
    return await this.wechatAuthService.getUserinfo(code);
  }
  @Post('loginByOpenid')
  async loginByOpenid(
    @Body('openid') openid: string,
    @Body('unionid') unionid: string,
    @Body('headimgurl') headimgurl: string,
    @Body('nickname') nickname: string,
  ) {
    console.log('openid unionid' + openid + unionid);
    return await this.wechatAuthService.loginByOpenid(
      openid,
      unionid,
      headimgurl,
      nickname,
    );
  }
}
