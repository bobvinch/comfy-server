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
import { create } from 'xmlbuilder2';
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
      },
    } = xml;
    const resResult = create({
      xml: {
        ToUserName: from, // 接收方帐号（收到的OpenID）
        FromUserName: to, // 开发者微信号
        CreateTime: new Date().getTime(), // 消息创建时间 （整型）
        MsgType: 'text',
        Content: 'AI绘图中，请稍后',
      },
    }).end({ prettyPrint: true });

    res.type('application/xml');
    res.send(resResult);
    //发送到任务队列
    if (type === 'text') {
      //文生图
      const {
        xml: {
          ToUserName: [to],
          FromUserName: [from],
          MsgType: [type],
          Content: [content],
        },
      } = xml;
      await this.drawService.wechatText2img(content, from);
    }
    if (type === 'image') {
      //   图生图
      const {
        xml: {
          ToUserName: [to],
          FromUserName: [from],
          PicUrl: [imageurl],
        },
      } = xml;
      await this.drawService.wechatImage2img(imageurl, from);
    }
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
