import {
  Body,
  Controller,
  Get,
  HttpCode,
  Logger,
  Post,
  Query,
  Req,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { WechatAuthService } from './wechat-auth.service';
import { ApiProperty } from '@nestjs/swagger';

import { DrawService } from '../draw/draw.service';

@Controller('wechatauth')
export class WechatAuthController {
  constructor(
    private readonly wechatAuthService: WechatAuthService,
    private readonly drawService: DrawService,
  ) {}
  private readonly logger = new Logger(WechatAuthController.name);

  @ApiProperty({})
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

  /**
   * 处理微信公众号号消息
   * @param xml
   * @param req
   * @param res
   */
  @HttpCode(200)
  @Post('handleMessage')
  async hangleMessage(
    @Body() xml: any,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    console.log(xml);
    const {
      xml: {
        ToUserName: [to],
        FromUserName: [from],
        MsgType: [type],
        Content: [content],
      },
    } = xml;
    //发送到任务队列
    if (type === 'text') {
      //文生图
      await this.drawService.wechatText2img(content, from);
    }
    res.send('success');
  }

  /**
   * 对接服务器验证
   * @param signature
   * @param timestamp
   * @param nonce
   * @param echostr
   */
  @Get('handleMessage')
  receiveMessage(
    @Query('signature') signature: string,
    @Query('timestamp') timestamp: string,
    @Query('nonce') nonce: string,
    @Query('echostr') echostr: string,
  ) {
    this.logger.log(echostr);
    return echostr || '121212';
  }
}
