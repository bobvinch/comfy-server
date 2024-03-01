import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { nanoid } from 'nanoid';

@Injectable()
export class WechatAuthService {
  private readonly logger = new Logger(WechatAuthService.name);
  private APPID = 'wx64c50e4c0243c5fb';
  private SECRET = 'd03b65ba4fc4d2ea22940ae1341555c3';
  private wx_baseurl = 'https://api.weixin.qq.com';
  private uni_baseurl = 'https://unicloudapi.gptpro.ink';
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
}
