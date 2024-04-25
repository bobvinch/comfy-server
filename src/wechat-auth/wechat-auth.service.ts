import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config/dist';
import { DrawService } from '../draw/draw.service';
import { CacheService } from '../cache/cache.service';
import { FileService } from '../file/file.service';

@Injectable()
export class WechatAuthService {
  constructor(
    // @InjectQueue('draw') private drawQueue: Queue,
    private readonly configService: ConfigService,
    private readonly drawService: DrawService,
    private cacheService: CacheService,
    private readonly fileService: FileService,
  ) {}

  private readonly logger = new Logger(WechatAuthService.name);
  private APPID = this.configService.get('CONFIG_AUTH_WECHAT_APPID');
  private SECRET = this.configService.get('CONFIG_AUTH_WECHAT_SECRET');
  private wx_baseurl = 'https://api.weixin.qq.com';

  // private uni_baseurl = 'https://unicloudapi.gptpro.ink'; //小程序账号登录链接
  /**
   *获取Access_token
   * @param code 用户扫码后获取到的code
   * @returns 返回相应结果，{"access_token":"ACCESS_TOKEN","expires_in":7200,"refresh_token":"REFRESH_TOKEN","openid":"OPENID","scope":"SCOPE","unionid": "UNIONID"}
   */
  private async getAccess_token(code) {
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

    const { access_token, openid } = Access_res;
    if (access_token) {
      const userinfo_url =
        'https://api.weixin.qq.com/sns/userinfo?access_token=' +
        access_token +
        '&openid=' +
        openid;
      const { data } = await axios.get(userinfo_url);
      return data;
    } else {
      return null;
    }
  }

  /**
   * 上传图片文件作为临时素材，获取微信服务器的media_id
   * @param imageUrl
   * @param type
   */
  async getMediaId(imageUrl: string, type?: string): Promise<string> {
    const access_token = await this.getAccessToken();
    const upload_url =
      this.wx_baseurl +
      `/cgi-bin/media/upload?access_token=${access_token}&type=${type || 'image'}`;
    const file = await this.fileService.urlToFile(
      imageUrl,
      type === 'video' ? 'video.mp4' : 'image.png',
      type === 'video' ? 'video/mp4' : 'image/png',
    );
    const formdata = new FormData();
    console.log('上传的文件', file);
    formdata.append(type || 'image', file);
    const res = await axios.post(upload_url, formdata, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('上传微信服务返回的数据', res.data);
    const { media_id } = res.data;
    return media_id;
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
    const APPID = this.configService.get('CONFIG_OFFICIAL_WECHAT_APPID');
    const AppSecret = this.configService.get('CONFIG_OFFICIAL_WECHAT_SECRET');
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
   * 发送客服图片消息
   * @param media_id
   * @param touser
   * @param msgtype
   */
  async sendServiceImageMessge(
    media_id: string,
    touser: string,
    msgtype?: string,
  ) {
    const access_token = await this.getAccessToken();
    const url = `https://api.weixin.qq.com/cgi-bin/message/custom/send?access_token=${access_token}`;
    let message;
    if (msgtype === 'video') {
      message = {
        touser: touser,
        msgtype: 'video',
        video: {
          media_id: media_id,
          title: 'AI视频',
          description: '视频由AI生成',
        },
      };
    } else {
      message = {
        touser: touser,
        msgtype: 'image',
        image: {
          media_id: media_id,
        },
      };
    }

    const res = await axios.post(url, message);
    console.log('发送结果：', res.data);
  }

  /**
   * 保存用户的指令
   */
  async saveCommand(command: string, openid: string) {
    const key = `command:${openid}`;
    await this.cacheService.set(key, command);
  }

  /**
   * 获取用户的指令
   */
  async getCommand(openid: string) {
    const key = `command:${openid}`;
    return await this.cacheService.get(key);
  }
}
