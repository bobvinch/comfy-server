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
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { create } from 'xmlbuilder2';
import { DrawService } from '../draw/draw.service';
import { UsersService } from '../users/users.service';

@ApiTags('微信相关')
@Controller('wechatauth')
export class WechatAuthController {
  constructor(
    private readonly wechatAuthService: WechatAuthService,
    private readonly drawService: DrawService,
    private readonly usersService: UsersService,
  ) {}

  private readonly logger = new Logger(WechatAuthController.name);

  @ApiOperation({
    summary: '获取微信用户信息',
    description: '根据服务返回的code码，获取微信用户的信息',
    operationId: 'getUserInfo',
    tags: ['wechat'],
    externalDocs: {
      description: 'wechat',
      url: 'https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html',
    },
  })
  @Get('getuserinfo')
  async getUserInfo(@Query('code') code: string) {
    this.logger.log(code);
    return await this.wechatAuthService.getUserinfo(code);
  }

  @ApiOperation({
    summary: '微信登录',
    description: '根据微信的openid unionid headimgurl nickname自动登录',
    operationId: 'loginByOpenid',
    tags: ['wechat'],
    externalDocs: {
      description: 'wechat',
      url: 'https://developers.weixin.qq.com/doc/offiaccount/OA_Web_Apps/Wechat_webpage_authorization.html',
    },
    requestBody: {
      description: 'openid unionid headimgurl nickname',
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              openid: {
                type: 'string',
                description: 'openid',
                example: 'o6_bmjrPTlm6_2sgVt7hMZOPfL2M',
              },
              unionid: {
                type: 'string',
                description: 'unionid',
                example: 'o6_bjrPTlm6_2sgVt7hMZOPfL2M',
              },
              headimgurl: {
                type: 'string',
                description: '头像',
                example:
                  'http://thirdwx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46',
              },
              nickname: {
                type: 'string',
                description: '昵称',
                example: 'Band',
              },
            },
          },
        },
      },
    },
  })
  @Post('loginByOpenid')
  async loginByOpenid(
    @Body('openid') openid: string,
    @Body('unionid') unionid: string,
    @Body('headimgurl') headimgurl: string,
    @Body('nickname') nickname: string,
  ) {
    console.log('openid unionid' + openid + unionid);
    const user = await this.usersService.loginBywechat({
      wx_openid: openid,
      wx_unionid: unionid,
      nickname: nickname,
      avatar_url: headimgurl,
      email: '',
      inviter_uid: '',
      last_login_date: Date.now(),
      last_login_ip: '',
      mobile: '',
      my_invite_code: '',
      password: await this.usersService.hashPassword('123456'),
      register_date: 0,
      role: undefined,
      token: '',
      username: `wechat_${openid}`,
    });
    const { _id, username } = user;
    //更新toekn
    await this.usersService.updateToken(_id, username);
    return user;
  }

  /**
   * 处理微信公众号号消息
   * @param xml
   * @param req
   * @param res
   */
  @ApiOperation({
    summary: '处理微信公众号号消息',
    description: 'xml',
    operationId: 'hangleMessage',
    tags: ['wechat'],
    externalDocs: {
      description: 'wechat',
      url: 'https://developers.weixin.qq.com/doc/offiaccount/Message_Management/Receiving_standard_messages.html',
    },
    requestBody: {
      description: 'xml',
      content: {
        'application/xml': {
          schema: {
            type: 'object',
            properties: {
              xml: {
                type: 'string',
                description: 'xml',
                example:
                  '<?xml version="1.0" encoding="UTF-8"?><xml><ToUserName><![CDATA[gh_e134659f803f]]></ToUserName><FromUserName><![CDATA[oMgHVjngRipC2slb2Y5u06jzNzK8]]></FromUserName><CreateTime>1582404543</CreateTime><MsgType><![CDATA[text]]></MsgType><Content><![CDATA[123]]></Content><MsgId>2250878104354478081</MsgId></xml>',
              },
            },
          },
        },
      },
    },
  })
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
  @ApiOperation({
    summary: '对接服务器验证',
    description: '自动对接微信服务器设置，微信服务器配置时，请选择明文模式',
    operationId: 'handleMessage',
    tags: ['wechat'],
    externalDocs: {
      description: 'wechat',
      url: 'https://developers.weixin.qq.com/doc/offiaccount/Basic_Information/Access_Overview.html',
    },
  })
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
