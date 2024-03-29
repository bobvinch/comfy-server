import { Inject, Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { nanoid } from 'nanoid';
import { ConfigService } from '@nestjs/config/dist';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { DrawService } from '../draw/draw.service';

@Injectable()
export class WechatAuthService {
  constructor(
    // @InjectQueue('draw') private drawQueue: Queue,
    private readonly configService: ConfigService,
    private readonly drawService: DrawService,
  ) {}

  private readonly logger = new Logger(WechatAuthService.name);
  private APPID = this.configService.get('CONFIG_AUTH_WECHAT_APPID');
  private SECRET = this.configService.get('CONFIG_AUTH_WECHAT_SECRET');
  private wx_baseurl = 'https://api.weixin.qq.com';
  private uni_baseurl = 'https://unicloudapi.gptpro.ink'; //小程序账号登录链接
  /**
   *获取Access_token
   * @param code 用户扫码后获取到的code
   * @returns 返回相应结果，{"access_token":"ACCESS_TOKEN","expires_in":7200,"refresh_token":"REFRESH_TOKEN","openid":"OPENID","scope":"SCOPE","unionid": "UNIONID"}
   */
  async getAccess_token(code) {
    const access_url =
      'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' +
      this.APPID +
      '&secret=' +
      this.SECRET +
      '&code=' +
      code +
      '&grant_type=authorization_code';
    const access_res = await axios.get(access_url);
    return access_res.data;
  }

  /**
   *根据code获取用户信息
   * @param code 微信返回的code,页面参数
   * @returns
   */
  async getUserinfo(code: string) {
    this.logger.debug('传入的code', code);
    const Access_res = await this.getAccess_token(code);
    this.logger.debug('获取token', Access_res);

    const { access_token, openid, unionid } = Access_res;
    if (access_token) {
      const userinfo_url =
        'https://api.weixin.qq.com/sns/userinfo?access_token=' +
        access_token +
        '&openid=' +
        openid;
      const userinfo_res = await axios.get(userinfo_url);
      return userinfo_res.data;
    }
    //返回
    return 'Error';
  }

  //根据openid登录，如果是此一次登录则注册
  async loginByOpenid(
    openid: string,
    unionid: string,
    headimgurl: string,
    nickname: string,
  ) {
    //1.根据unionid查找是否注册过
    const url = this.uni_baseurl + '/aichat/getUserinfoByUnionid';
    const data = {
      openid: openid,
      unionid: unionid,
      my_invite_code: nanoid(6),
      headimgurl: headimgurl,
      nickname: nickname,
    };
    const res = await axios.post(url, data);
    if (res.data && res.data.length > 0) {
      //注册过，返回整个user集合
      console.log('注册过：' + res.data[0]);
      //把web的openid写入到数据库中
      const data2 = {
        _id: res.data[0]._id,
        openid: openid,
        headimgurl: headimgurl,
        nickname: nickname,
      };
      const addWebOpenid_url = this.uni_baseurl + '/aichat/addWebOpenid';
      await axios.post(addWebOpenid_url, data2);
      return res.data[0];
    } else {
      //注册,openid要存在才注册，防止在code页面刷新，openid不存在
      if (openid) {
        const reg_url = this.uni_baseurl + '/aichat/addUserinfoByOpenid';
        const reg_res = await axios.post(reg_url, data);
        console.log('新注册');
        console.log(reg_res.data);
        return reg_res.data[0];
      }
    }

    return res.data;
  }

  /**
   * 上传图片文件作为临时素材，获取微信服务器的media_id
   * @param imageUrl
   */
  async getMediaId(imageUrl: string): Promise<string> {
    const access_token = await this.getAccessToken();
    const upload_url =
      this.wx_baseurl +
      `/cgi-bin/media/upload?access_token=${access_token}&type=image`;
    const file = await this.urlToFile(imageUrl, 'image.png', 'image/png');
    const formdata = new FormData();
    formdata.append('image', file);
    const res = await axios.post(upload_url, formdata, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('上传微信服务返回的数据', res.data);
    const { media_id } = res.data;
    return media_id || '';
  }
  private draw_access_token = {
    token: '',
    expires_in: Date.now(),
  };

  /**
   * 获取微信公众号的token，如果token没有过期，直接使用，过期重新获取
   * @private
   */
  private async getAccessToken(): Promise<string> {
    const APPID = 'wx0244063c43bdacdb';
    const AppSecret = '6a9cc6ae83b3665e4836d31e48e6b9a3';
    const token_url = `https://api.weixin.qq.com/cgi-bin/token?grant_type=client_credential&appid=${APPID}&secret=${AppSecret}`;
    if (
      !this.draw_access_token.token ||
      this.draw_access_token.expires_in <= Date.now()
    ) {
      // 获取access_token
      const resResult = await axios.get(token_url);
      console.log(resResult);
      const { access_token } = resResult.data;
      this.draw_access_token.token = access_token;
      this.draw_access_token.expires_in = Date.now() + 7000 * 1000;
      return access_token;
    }
    if (
      this.draw_access_token.token &&
      this.draw_access_token.expires_in > Date.now()
    ) {
      return this.draw_access_token.token;
    }
  }
  /**
   * 将url转换成file
   * @param url 图片链接
   * @param fileName 文件名
   * @param mimeType 文件类型
   * @private
   */
  private async urlToFile(url, fileName, mimeType): Promise<File> {
    return fetch(url)
      .then((res) => res.arrayBuffer())
      .then((buffer) => {
        return new File([buffer], fileName, { type: mimeType });
      });
  }

  /**
   * 发送客服图片消息
   * @param media_id
   * @param touser
   */
  async sendServiceImageMessge(media_id: string, touser: string) {
    const access_token = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${access_token}`;
    const message = {
      touser: touser,
      msgtype: 'image',
      image: {
        media_id: media_id,
      },
    };
    const res = await axios.post(url, message);
    console.log('发送结果：', res.data);
  }
}
