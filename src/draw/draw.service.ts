import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
// 普通文生图

import { text2img } from './data/workflow_api_text2img';
// 图生图
import { image2img } from './data/workflow_api_image2img';

// 图生视频
import { img2video } from './data/workflow_api_img2video';

// 抠图
import { matting } from './data/workflow_api_matting';
// 局部重绘
import { inpainting } from './data/workflow_api_inpainting';
// 移除背景
import { removebg } from './data/workflow_api_removebg';
import { CacheService } from '../cache/cache.service';
// 高清修复放大4倍
import { workflowApiHdfix4 } from './data/workflow_api_hdfix_4';
// 微信绘画模式
export type WeChatDrawModel = 'text2img' | 'image2img' | 'img2video';

export interface DrawTask {
  source: 'wechat' | 'web';
  client_id: string;
  prompt: any;
  api: string;
  socket_id?: string;
  lifo?: boolean;
}

interface ComfyAPIType {
  type:
    | '文生图'
    | '图生图'
    | '图生视频'
    | 'AI模特'
    | 'AI写真'
    | '放大1'
    | '放大2'
    | 'AI推文';
  timeout: number;
}

const APIS = [
  {
    type: '文生图',
    timeout: 30,
  },
  {
    type: '图生图',
    timeout: 60,
  },
  {
    type: '图生视频',
    timeout: 120,
  },
  {
    type: 'AI模特',
    timeout: 120,
  },
  {
    type: 'AI写真',
    timeout: 240,
  },
  {
    type: '放大1',
    timeout: 120,
  },
  {
    type: '放大2',
    timeout: 180,
  },
] as ComfyAPIType[];

@Injectable()
export class DrawService {
  private readonly logger = new Logger(DrawService.name);
  private Object_info = null as any;
  private ckpt_names = [] as any[]; //模型集合
  public local_comfyui = this.configService.get('CONFIG_COMFYUI_SERVER_URL');
  public remote_comfyui = this.configService.get(
    'CONFIG_COMFYUI_SERVER_REMOTE_URL',
  );
  private accesstoken = ''; //访问远程服务器必须的token
  constructor(
    @InjectQueue('draw') private drawQueue: Queue,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {
    this.Initalize();
  }

  private readonly comfyuiAxios = axios.create({
    // baseURL: "/sdApi",
    timeout: 100000,
    headers: {
      'Access-Control-Allow-Origin': '*',
      Accept: '*/*',
      Authorization: 'Bearer ' + this.configService.get('CONFIG_COMFYUI_TOKEN'),
    },
  });

  /**
   * 讲绘画任务加入到任务队列
   * @param data
   */
  async sendToQueue(data: DrawTask) {
    // 黑名单管理
    if (await this.isInBlackList(data.client_id)) {
      this.logger.log('黑名单用户', data.client_id);
      return;
    }
    return await this.drawQueue.add('drawtask', data, {
      timeout:
        APIS.find((item) => item.type === data.api)?.timeout * 1000 ||
        60 * 1000,
      lifo: data.lifo || false,
    });
  }

  /**
   * 提交绘画任务，返回绘画结果
   * @param data
   */
  async submitDrawTask(data: DrawTask): Promise<string> {
    return new Promise(async (resolve, reject) => {
      const job = await this.sendToQueue(data);
      const intervalId = setInterval(async () => {
        //   查询任务状态
        this.logger.debug(`定时器查询绘画进度中………………${intervalId}`);
        const jobTemp = await this.drawQueue.getJob(job.id);
        if (await jobTemp.isCompleted()) {
          this.logger.log(
            '任务完成',
            jobTemp.returnvalue,
            `任务耗时:${(jobTemp.finishedOn - jobTemp.processedOn) / 1000}`,
          );
          clearInterval(intervalId);
          resolve(jobTemp.returnvalue);
        }
        if (await jobTemp.isFailed()) {
          clearInterval(intervalId);
          reject('任务失败');
        }
      }, 500);
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
   * 获取ComfyUI的节点信息
   */
  async getObject_info() {
    try {
      let url = `${this.local_comfyui}/object_info`;
      if (this.remote_comfyui) {
        url = `${this.remote_comfyui}/draw/getObjectinfo`;
      }
      const { data } = await this.comfyuiAxios.get(url);
      // this.logger.log('获取ComfyUI的节点信息成功', data);
      this.Object_info = data;
      return data;
    } catch (error) {
      // this.logger.error('初始化节点信息发生错误');
    }
  }

  /**
   * 返送任务到ComfyUI服务器
   * @param comfyuihttpUrl
   * @param data
   */
  async sendTackprompt(comfyuihttpUrl: string, data: any): Promise<any> {
    try {
      const {
        data: { prompt_id },
      } = await this.comfyuiAxios.post(comfyuihttpUrl + '/prompt', data);
      return prompt_id;
      // console.log('res', res);
    } catch (error) {
      return '';
    }
  }

  /**
   * 获取远程服务调用的token
   */
  async getAccessToken() {
    const username = this.configService.get(
      'CONFIG_COMFUI_SERVER_REMOTE_AUTH_USERNAME',
    );
    const password = this.configService.get(
      'CONFIG_COMFUI_SERVER_REMOTE_AUTH_PASSWORD',
    );
    if (!this.accesstoken) {
      const { data } = await this.comfyuiAxios.get(
        `${this.remote_comfyui}/api/auth/signin?username=${username}&password=${password}`,
      );
      this.accesstoken = data.access_token;
    }
    this.logger.log('成功获取远程绘画服务器的token');
    return this.accesstoken;
  }

  /**
   * 远程服务执行微信绘图任务
   *
   */
  async wechatDrawFromRemoteServer(
    type: WeChatDrawModel,
    params: {
      positive?: string;
      image_path?: string;
      ckpt_name_id?: number;
    },
  ) {
    this.logger.log(`微信绘画参数为${JSON.stringify(params)}`);
    if (type === 'text2img') {
      const url = `${this.remote_comfyui}/draw/text2img`;
      const { data } = await this.comfyuiAxios.post(url, {
        clinet_id: '123',
        params,
      });
      return data;
    }
    if (type === 'image2img') {
      const url = `${this.remote_comfyui}/draw/img2img`;
      const { data } = await this.comfyuiAxios.post(url, {
        clinet_id: '123',
        params,
      });
      return data;
    }
    if (type === 'img2video') {
      const url = `${this.remote_comfyui}/draw/img2video`;
      const { data } = await this.comfyuiAxios.post(url, {
        clinet_id: '123',
        params,
      });
      return data;
    }
  }

  /**
   * 生成随机数
   * @param length
   */
  getSeed = (length: number) => {
    const min = Math.pow(10, length - 1);
    const max = Math.pow(10, length) - 1;
    return Math.floor(Math.random() * (max - min + 1) + min);
  };

  /**
   * 普通文生图
   * @param client_id
   * @param socket_id
   * @param params
   * @param options
   */
  async text2img(
    client_id: string,
    socket_id?: string,
    params?: {
      positive?: string;
      negative?: string;
      seed?: number;
      width?: number;
      height?: number;
      ckpt_name_id?: number;
      filename_prefix?: string | number; //文件名前缀
      upscale_by?: number;
    },
    options?: {
      source: 'web' | 'wechat';
      lifo?: boolean;
    },
  ) {
    //正向提示词
    text2img[55].inputs.text = params.positive || '一个女孩';
    //负向提示词
    text2img[58].inputs.text = params.negative || '';
    //随机种子
    text2img[54].inputs.seed = params.seed || this.getSeed(15);
    // console.log("seed:" + sdStore.txt2imgParams.seed)
    //图片尺寸
    text2img[52].inputs.empty_latent_width = params.width || 512;
    text2img[52].inputs.empty_latent_height = params.height || 768;
    text2img[52].inputs.ckpt_name = this.ckpt_names[params.ckpt_name_id || 0];
    text2img[51].inputs.filename_prefix =
      params.filename_prefix + '_text2img_output_final_';
    // 放大倍数
    text2img[44].inputs.upscale_by = params.upscale_by || 1;
    const data = {
      source: options?.source || 'web',
      prompt: text2img,
      api: '文生图',
      client_id,
      socket_id,
      lifo: options?.lifo || false,
    } as DrawTask;
    const result = await this.submitDrawTask(data);
    this.logger.log('文生图结果', result);
    return result;
  }

  /**
   *图生图
   *
   */
  async image2img(
    client_id: string,
    socket_id?: string,
    params?: {
      image_path: string;
      denoise?: number;
      noise_seed?: number;
      ckpt_name_id?: number;
      filename_prefix?: string | number; //文件名前缀
      upscale_by?: number;
    },
    options?: {
      source: 'web' | 'wechat';
      lifo?: boolean;
    },
  ) {
    //图片路径
    image2img[70].inputs.image_path = params.image_path;
    image2img[85].inputs.denoise = params.denoise || 0.5;
    image2img[85].inputs.seed = params.noise_seed || this.getSeed(15);
    // if (params.upscale_by) {
    //   image2img[74].inputs.scale_by = params.upscale_by;
    // }
    image2img[101].inputs.ckpt_name = this.ckpt_names[params.ckpt_name_id || 0];
    image2img[51].inputs.filename_prefix =
      params.filename_prefix + '_image2img_output_final_';
    const data = {
      source: options?.source || 'web',
      prompt: image2img,
      api: '图生图',
      client_id,
      socket_id,
      lifo: options?.lifo || false,
    } as DrawTask;
    return await this.submitDrawTask(data);
  }

  /**
   * 图生视频
   * @param client_id
   * @param socket_id
   * @param params
   * @param options
   */
  async image2video(
    client_id: string,
    socket_id?: string,
    params?: {
      image_path: string;
      video_frames?: number;
      fps?: number;
      motion_bucket_id?: number; //运动幅度，默认127
      augmentation_level?: number; //增强，默认为0
      filename_prefix?: string;
      cfg?: number;
      steps?: number;
      min_cfg?: number;
    },
    options?: {
      source: 'web' | 'wechat';
      lifo?: boolean;
    },
  ) {
    //图片路径
    img2video[37].inputs.image_path = params.image_path;
    img2video[8].inputs.video_frames = params.video_frames || 14;
    img2video[8].inputs.fps = params.fps || 8;
    img2video[8].inputs.motion_bucket_id = params.motion_bucket_id || 127;
    img2video[8].inputs.augmentation_level = params.augmentation_level || 0;

    img2video[19].inputs.cfg = params.cfg || 3;
    img2video[19].inputs.steps = params.steps || 20;

    img2video[23].inputs.filename_prefix =
      params.filename_prefix + '_image2video_output_final_';
    img2video[23].inputs.frame_rate = params.fps || 8;
    img2video[18].inputs.min_cfg = params.min_cfg || 1;
    const data = {
      source: options?.source || 'web',
      prompt: img2video,
      api: '图生视频',
      client_id,
      socket_id,
      lifo: options?.lifo || false,
    } as DrawTask;
    return await this.submitDrawTask(data);
  }

  /**
   * 抠图
   * @param client_id
   * @param params
   * @param socket_id
   * @param options
   */
  async segmentAnything(
    client_id: string,
    params: {
      image_path: string;
      segmentparts: string;
    },
    socket_id?: string,
    options?: {
      source: 'web' | 'wechat';
      lifo?: boolean;
    },
  ) {
    matting[67].inputs.text = params.segmentparts;
    matting[62].inputs.image_path = params.image_path;
    const data = {
      source: options?.source || 'web',
      prompt: matting,
      api: '抠图',
      client_id,
      socket_id,
      lifo: options?.lifo || false,
    } as DrawTask;
    return await this.submitDrawTask(data);
  }

  /**
   *局部重绘
   * @param client_id
   * @param params
   * @param socket_id
   * @param options
   */
  async inpainting(
    client_id: string,
    params: {
      image_path: string;
      image_path_mask: string;
      ckpt_name_id?: number;
      denoise?: number;
      positive?: string;
      nagative?: string;
    },
    socket_id?: string,
    options?: {
      source: 'web' | 'wechat';
      lifo?: boolean;
    },
  ) {
    inpainting[70].inputs.image_path = params.image_path;
    inpainting[87].inputs.image_path = params.image_path_mask;
    inpainting[98].inputs.ckpt_name = this.ckpt_names[params.ckpt_name_id];
    inpainting[85].inputs.denoise = params.denoise || 0.5;
    inpainting[95].inputs.text = params.positive || '';
    inpainting[95].inputs.text = params.nagative || '';
    const data = {
      source: options?.source || 'web',
      prompt: inpainting,
      api: '局部重绘',
      client_id,
      socket_id,
      lifo: options?.lifo || false,
    } as DrawTask;
    return await this.submitDrawTask(data);
  }

  /**
   * 移除背景
   * @param client_id
   * @param params
   * @param socket_id
   * @param options
   */
  async removebg(
    client_id: string,
    params: {
      image_path: string;
    },
    socket_id?: string,
    options?: {
      source: 'web' | 'wechat';
      lifo?: boolean;
    },
  ) {
    removebg[62].inputs.image_path = params.image_path;

    const data = {
      source: options?.source || 'web',
      prompt: removebg,
      api: '移除背景',
      client_id,
      socket_id,
      lifo: options?.lifo || false,
    } as DrawTask;
    return await this.submitDrawTask(data);
  }

  /**
   * 高清修复
   * @param client_id
   * @param params
   * @param socket_id
   * @param options
   */
  async workflowApiHdfix4(
    client_id: string,
    params: {
      image_path: string; //原图路径
    },
    socket_id?: string,
    options?: {
      source: 'web' | 'wechat';
      lifo?: boolean;
    },
  ) {
    workflowApiHdfix4[15].inputs.image_path = params.image_path;
    const data = {
      source: options?.source || 'web',
      prompt: workflowApiHdfix4,
      api: '高清修复x4',
      client_id,
      socket_id,
      lifo: options?.lifo || false,
    } as DrawTask;
    return await this.submitDrawTask(data); //统一通过这个方法提交绘画API
  }

  /**
   * 初始化节点数据
   *
   */
  Initalize = async () => {
    // 初始化获取ComfyUI的节点信息
    if (!this.Object_info) {
      this.getObject_info()
        .then(() => {
          console.log('@ComfyUI 初始化获取ComfyUI的节点信息');
          this.ckpt_names =
            this.Object_info[
              'CheckpointLoaderSimple'
            ].input.required.ckpt_name[0];
          console.log(
            `@ComfyUI 初始化获取ComfyUI的节点信息,大模型list：${this.ckpt_names}`,
          );
        })
        .catch(() => {
          this.logger.error(
            '初始化节点信息发生错误,未能获取comfy配置信息，请检查网络',
          );
        });
    }
    //如果启用远程绘画服务
    if (this.remote_comfyui) {
      // await this.getAccessToken();
    }
    //   添加异常处理
    this.comfyuiAxios.interceptors.response.use(
      (response) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;
        if (error?.response?.status === 401 && !originalRequest._retry) {
          setTimeout(() => {
            originalRequest._retry = true;
          }, 2000);
        }
        this.logger.error('响应超时');
        return Promise.reject(error);
      },
    );
  };

  /**
   * 加入黑名单
   */
  async addBlackList(uid: string) {
    const blacklist = (await this.cacheService.get('blacklist')) || [];
    if (blacklist.includes(uid)) {
      return;
    }
    blacklist.push(uid);
    await this.cacheService.set('blacklist', blacklist);
  }

  /**
   * 判断是否再黑名单
   */
  async isInBlackList(uid: string) {
    const blacklist = (await this.cacheService.get('blacklist')) || [];
    return blacklist.includes(uid);
  }

  /**
   * 移除黑名单
   */
  async removeBlackList(uid: string) {
    let blacklist = await this.cacheService.get('blacklist');
    if (!blacklist) return;
    blacklist = blacklist.filter((item) => item !== uid);
    await this.cacheService.set('blacklist', blacklist);
  }

  /**
   * 获取黑名单
   */
  async getBlackList() {
    return await this.cacheService.get('blacklist');
  }
}
