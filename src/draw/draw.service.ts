import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config/dist';
import axios from 'axios';
import api_wechat_img2imgi from './data/api_wechat_img2imgi.json';
import text2imgapi from './data/text2imgapi.json';

export interface DrawTask {
  source: 'wechat' | 'web';
  client_id: string;
  prompt: any;
  api: string;
  socket_id?: string;
}
@Injectable()
export class DrawService {
  constructor(
    @InjectQueue('draw') private drawQueue: Queue,
    private readonly configService: ConfigService,
  ) {}
  public webSocketSeverUrl = this.configService.get(
    'CONFIG_COMFYUI_HTTP_SERVER_URL',
  );
  private readonly comfyuiAxios = axios.create({
    // baseURL: "/sdApi",
    baseURL: this.webSocketSeverUrl,
    timeout: 100000,
    headers: {
      'Access-Control-Allow-Origin': '*',
      Accept: '*/*',
    },
  });

  async sendToQueue(data: DrawTask) {
    console.log('发送队列触发了');
    // console.log('@@@@@@job result:');
    // console.log(job);
    return await this.drawQueue.add('text2img', data, {
      removeOnComplete: true,
    });
  }

  async getQueueLength() {
    return await this.drawQueue.getJobCounts();
  }

  /**
   * 判断uid是否已经有任务在队列中
   * @param uid
   */
  async isInQueue(uid: string) {
    const jobs = await this.drawQueue.getJobs(['waiting']);
    for (let i = 0; i < jobs.length; i++) {
      const { client_id } = jobs[i].data;
      if (client_id && client_id === uid) {
        return true;
      }
    }
    return false;
  }

  /**
   * 返送任务到ComfyUI服务器
   * @param data
   */
  async sendTackprompt(data: any): Promise<string> {
    // console.log(this.webSocketSeverUrl);
    const res = await this.comfyuiAxios.post('/prompt', data);
    // console.log('res', res);
    const { prompt_id } = res.data;
    return prompt_id;
  }

  /**
   * 微信端文生图
   * @param positive
   * @param client_id 用户id openid,微信用户唯一标识
   */
  async wechatText2img(positive: string, client_id: string) {
    const APIdata = require('./data/text2imgapi.json');
    APIdata[24].inputs.text = positive;
    APIdata[32].inputs.noise_seed = this.generateRandomNumber(15);
    APIdata[47].inputs.ckpt_name = 'dreamshaper_8.safetensors'; //随机重绘幅度
    const data = {
      source: 'wechat',
      prompt: APIdata,
      api: '文生图',
      client_id,
    } as DrawTask;
    return await this.sendToQueue(data);
  }
  async wechatImage2img(iamgeUrl: string, client_id: string) {
    const APIdata = require('./data/api_wechat_img2imgi.json');
    APIdata[70].inputs.image_path = iamgeUrl;
    APIdata[85].inputs.denoise = Math.random(); //随机重绘幅度
    APIdata[85].inputs.noise_seed = this.generateRandomNumber(15);
    //随机风格
    const fix_style = [
      {
        lora: 'lcm\\lcm_sd1.5_pytorch_lora_weights.safetensors', //LCM
        weight: 1,
      },
      {
        lora: 'styles\\add_detail.safetensors', //增加图片细节
        weight: 0.8,
      },
    ];
    // const random_style = [
    //   {
    //     lora: 'styles\\3DMM_V12.safetensors', //3D效果
    //     weight: 0,
    //   },
    //   {
    //     lora: 'styles\\MoXinV1.safetensors',
    //     weight: 0,
    //   },
    //   {
    //     lora: 'FilmVelvia3.safetensors',
    //     weight: 0,
    //   },
    // ];
    //设置固定风格lora
    fix_style.forEach((style, index) => {
      APIdata[45].inputs[`lora_name_${index + 1}`] = style.lora;
      APIdata[45].inputs[`lora_wt_${index + 1}`] = style.weight;
    });
    const data = {
      source: 'wechat',
      prompt: APIdata,
      api: '图生图',
      client_id,
    } as DrawTask;
    return await this.sendToQueue(data);
  }
  /**
   * 生成随机数
   * @param length
   */
  generateRandomNumber = (length: number) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min);
  };
}
