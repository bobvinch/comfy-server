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
import e, { Request, Response } from 'express';
import { WechatAuthService } from './wechat-auth.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { create } from 'xmlbuilder2';
import { DrawService, WeChatDrawModel } from '../draw/draw.service';
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
    return await this.usersService.findOne(_id + '');
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
    this.logger.log('收到微信服务器转发的消息')
    const {
      xml: {
        ToUserName: [to],
        FromUserName: [from],
        MsgType: [type],
      },
    } = xml;
    //处理消息参数

    let drawmodel = 'text2img' as WeChatDrawModel;
    const params = {
      positive: 'a girl',
      ckpt_name_id: 0, //使用的大模型id,调用参数参考API文档
      image_path: '',
      //   其他参数可以加载后面
    };
    // 根据消息类型，调用不同的绘画接口
    if (type === 'text') {
      //文生图
      const {
        xml: {
          // ToUserName: [to],
          FromUserName: [from],
          // MsgType: [type],
          Content: [content],
        },
      } = xml;
      if (content.includes('图生图') || content.includes('图生视频')) {
        //将用户的指令先暂存起来,保存到redis
        await this.wechatAuthService.saveCommand(content, from);
        // 回复客户端响应消息
        const resResult = create({
          xml: {
            ToUserName: from, // 接收方帐号（收到的OpenID）
            FromUserName: to, // 开发者微信号
            CreateTime: new Date().getTime(), // 消息创建时间 （整型）
            MsgType: 'text',
            Content:
              '已收到主人的绘画指令，请传入一张图片，我可以帮你完成' + content,
          },
        }).end({ prettyPrint: true });

        res.type('application/xml');
        res.send(resResult);
        return;
      } else {
        // 回复客户端响应消息
        drawmodel = 'text2img';
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
      }
      params.positive = content;
    }
    if (type === 'image') {
      // 读取用户的指令
      const {
        xml: {
          // ToUserName: [to],
          FromUserName: [from],
          PicUrl: [imageurl],
        },
      } = xml;
      // 回复客户端响应消息
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
      params.image_path = imageurl;
      const command = await this.wechatAuthService.getCommand(from);
      if (command.includes('图生视频')) {
        drawmodel = 'img2video';
      } else {
        drawmodel = 'image2img';
        params.positive = command.replace('图生图', '');
      }
    }
    //   启用了远程绘画服务器
    if (this.drawService.remote_comfyui) {
      this.logger.log(`启动远程服务器绘画功能，绘画模式是${drawmodel}`);
      const result = await this.drawService.wechatDrawFromRemoteServer(
        drawmodel,
        params,
      );
      // 调用客服接口回复消息
      const mediaId = await this.wechatAuthService.getMediaId(
        result,
        drawmodel.includes('video') ? 'video' : 'image',
      );
      await this.wechatAuthService.sendServiceImageMessge(
        mediaId,
        from,
        drawmodel.includes('video') ? 'video' : 'image',
      );
    } else {
      // 本地绘画
      this.logger.log('启动本地绘画功能');
      if (drawmodel === 'text2img') {
        //文生图
        const result = await this.drawService.text2img(from, undefined, params);
        // 调用客服接口回复消息
        const mediaId = await this.wechatAuthService.getMediaId(result);
        await this.wechatAuthService.sendServiceImageMessge(mediaId, from);
      }
      if (drawmodel === 'image2img') {
        //   图生图
        const result = await this.drawService.image2img(
          from,
          undefined,
          params,
        );
        // 调用客服接口回复消息
        const mediaId = await this.wechatAuthService.getMediaId(result);
        await this.wechatAuthService.sendServiceImageMessge(mediaId, from);
      }
      if (drawmodel === 'img2video') {
        //   图生视频
        const result = await this.drawService.image2video(
          from,
          undefined,
          params,
        );
        // 调用客服接口回复消息
        const mediaId = await this.wechatAuthService.getMediaId(
          result,
          'video',
        );
        await this.wechatAuthService.sendServiceImageMessge(
          mediaId,
          from,
          'video',
        );
      }
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
    // this.logger.log(echostr);
    return echostr || 'error';
  }
}
