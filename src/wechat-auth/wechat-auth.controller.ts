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

/**
 * 微信回调给开发者的消息
 */
interface IWxMessageXmlData {
  /** 开发者微信号 e.g. `gh_019087f88815`*/
  ToUserName: string;
  /** 发送方帐号（一个OpenID）e.g.: `o5w5awUl***5pIJKY`*/
  FromUserName: string;
  /** 消息创建时间 （整型）e.g.`1595855711` */
  CreateTime: string;
  /** 消息类型，此处为 `event` */
  MsgType: string;
  /** 事件类型，subscribe(订阅)、unsubscribe(取消订阅) */
  Event: 'subscribe' | 'unsubscribe';
  /** 事件KEY值，目前无用 */
  EventKey: string;
}

@Controller('wechatauth')
export class WechatAuthController {
  constructor(private readonly wechatAuthService: WechatAuthService) {}

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
  async hangleMessage(@Body() xml: any, @Req() req: Request, @Res() res: Response) {
    console.log(xml);
    const {
      xml: {
        ToUserName: [to],
        FromUserName: [from],
        MsgType: [type],
        Content: [content],
      },
    } = xml;
    const resResult = create({
      xml: {
        ToUserName: from, //	接收方帐号（收到的OpenID）
        FromUserName: to, //	开发者微信号
        CreateTime: new Date().getTime(), //	消息创建时间 （整型）
        MsgType: 'image',
        Image: {
          MediaId: await this.wechatAuthService.MessageToDraw(content, from),
        },
      },
    }).end({ prettyPrint: true });
    res.type('application/xml');
    // res.send('success');
    setTimeout(() => {
      res.send(resResult);
    }, 5000);

    // console.log(resResult);
    //
    // return resResult;
  }
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
