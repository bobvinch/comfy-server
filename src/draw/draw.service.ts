import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const FormData = require('form-data');

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
// 换脸
import { FaceSwap } from './data/workflow_api_faceswap';
// AI模特，AI电商换装
import { workflowApiModel } from './data/workflow_api_model';
import { ApiTimeOut, drawConfig, DrawTask } from './data/DrawConfig';
import { FileService } from '../file/file.service';
//图片反推提示词API
import { workflowApiTagger } from './data/workflow_api_tagger';
import * as fs from 'node:fs';

// 微信绘画模式
export type WeChatDrawModel = 'text2img' | 'image2img' | 'img2video';
type SD3AspectRatio =
  | '1:1'
  | '16:9'
  | '21:9'
  | '2:3'
  | '3:2'
  | '3:4'
  | '4:3'
  | '9:16';
type SD3StylePreset =
  | '3d-model'
  | 'analog-film'
  | 'anime'
  | 'cinematic'
  | 'comic-book'
  | 'digital-art'
  | 'enhance'
  | 'fantasy-art'
  | 'isometric'
  | 'line-art'
  | 'low-poly'
  | 'modeling-compound'
  | 'neon-punk'
  | 'origami'
  | 'photographic'
  | 'pixel-art'
  | 'tile-texture';

@Injectable()
export class DrawService {
  private readonly logger = new Logger(DrawService.name);
  private Object_info = null as any;
  private ckpt_names = [] as any[]; //模型集合
  public local_comfyui = this.configService.get('CONFIG_COMFYUI_SERVER_URL');
  public remote_comfyui = this.configService.get(
    'CONFIG_COMFYUI_SERVER_REMOTE_URL',
  );
  private oss_enable = this.configService.get('OSS_ACCESSKEYSECRET');
  private accesstoken = ''; //访问远程服务器必须的token
  constructor(
    @InjectQueue('draw') private drawQueue: Queue,
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
    private readonly fileService: FileService,
  ) {
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
        ApiTimeOut.find((item) => item.type === data.api)?.timeout * 1000 ||
        drawConfig.defaultTimeOut * 1000,
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
          // 任务失败,尝试去按照prompt_id去远程服务器获取结果
          const { prompt_id } = jobTemp.data;
          const server = this.remote_comfyui || this.local_comfyui;
          if (server) {
            const { data } = await this.comfyuiAxios.get(
              `${server}/history/${prompt_id}`,
            );
            this.logger.log('远程服务器获取结果成功', data);
            if (data[prompt_id]) {
              //从data中尝试解构出来结果
              const { outputs } = data[prompt_id];
              Object.keys(outputs).forEach((key) => {
                console.log(key, outputs[key]);
                if (
                  outputs[key]['images'] &&
                  outputs[key]['images'].length > 0
                ) {
                  let imageUrl = '';
                  const { filename, subfolder, type } =
                    outputs[key]['images'][0];
                  if (subfolder) {
                    imageUrl = `${server}/view?subfolder=${subfolder}&filename=${filename}&type=${type}`;
                  } else {
                    imageUrl = `${server}/view?filename=${filename}&type=${type}`;
                  }
                  clearInterval(intervalId);
                  resolve(imageUrl);
                  return;
                }
              });
            }
          }
          clearInterval(intervalId);
          reject({ staus: 'error', message: '任务失败' });
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
      //后去模型清单
      this.ckpt_names =
        this.Object_info['CheckpointLoaderSimple'].input.required.ckpt_name[0];
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
  async sendTackprompt(comfyuihttpUrl: string, data: any): Promise<string> {
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
   * 获取远程服务调用的token，暂时未启用
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
      sd3_style_preset?: SD3StylePreset; //SD3风格
      sd3_aspect_ratio?: SD3AspectRatio; //SD3比例
      sd3_model?: 'sd3' | 'sd3-turbo'; //SD3模型
    },
    options?: {
      source: 'web' | 'wechat';
      apisource?: 'default' | 'sd3';
      lifo?: boolean;
    },
  ) {
    //如果apisource是sd3则调用sd3文生图
    if (options?.apisource === 'sd3') {
      return await this.text2imgSD3({
        prompt: params.positive || '',
        style_preset: params.sd3_style_preset,
        aspect_ratio: params.sd3_aspect_ratio,
        negative_prompt: params.negative || '',
        model: params.sd3_model || 'sd3',
      });
    }
    await this.Initalize(); //初始化获取ComfyUI的节点信息
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
    const _v = await this.submitDrawTask(data);
    if (this.oss_enable) {
      // 启用OSS
      return await this.fileService.uploadFileToOSS(_v, `image`);
    } else {
      return _v;
    }
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
      positive?: string;
      nagative?: string;
      denoise?: number;
      noise_seed?: number;
      ckpt_name_id?: number;
      filename_prefix?: string | number; //文件名前缀
      upscale_by?: number;
      sd3_style_preset?: SD3StylePreset; //SD3风格
      sd3_aspect_ratio?: SD3AspectRatio; //SD3比例
      sd3_model?: 'sd3' | 'sd3-turbo'; //SD3模型
      sd3_strength?: number; //SD3强度
    },
    options?: {
      source: 'web' | 'wechat';
      apisource?: 'default' | 'sd3';
      lifo?: boolean;
    },
  ) {
    //如果apisource是sd3则调用sd3文生图

    const AB = await this.fileService.urlToArrayBuffer(params.image_path);
    const bf = Buffer.from(AB);
    //将file保存到服务上
    fs.writeFileSync('temp.png', bf);
    if (options?.apisource === 'sd3') {
      return await this.text2imgSD3({
        prompt: params.positive || '',
        seed: params.noise_seed,
        mode: 'image-to-image',
        image: fs.createReadStream('temp.png'),
        style_preset: params.sd3_style_preset,
        negative_prompt: params.nagative || '',
        strength: params.sd3_strength || 0.5,
        model: params.sd3_model || 'sd3',
      });
    }
    await this.Initalize(); //初始化获取ComfyUI的节点信息
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
    const _v = await this.submitDrawTask(data);
    if (this.oss_enable) {
      // 启用OSS
      return await this.fileService.uploadFileToOSS(_v, `image`);
    } else {
      return _v;
    }
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
    await this.Initalize(); //初始化获取ComfyUI的节点信息
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
    const _v = await this.submitDrawTask(data);
    if (this.oss_enable) {
      // 启用OSS
      return await this.fileService.uploadFileToOSS(_v, `video`);
    } else {
      return _v;
    }
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
    await this.Initalize(); //初始化获取ComfyUI的节点信息
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
    const _v = await this.submitDrawTask(data);
    if (this.oss_enable) {
      // 启用OSS
      return await this.fileService.uploadFileToOSS(_v, `image`);
    } else {
      return _v;
    }
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
    await this.Initalize(); //初始化获取ComfyUI的节点信息
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
    const _v = await this.submitDrawTask(data);
    if (this.oss_enable) {
      // 启用OSS
      return await this.fileService.uploadFileToOSS(_v, `image`);
    } else {
      return _v;
    }
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
    await this.Initalize(); //初始化获取ComfyUI的节点信息
    removebg[62].inputs.image_path = params.image_path;

    const data = {
      source: options?.source || 'web',
      prompt: removebg,
      api: '移除背景',
      client_id,
      socket_id,
      lifo: options?.lifo || false,
    } as DrawTask;
    const _v = await this.submitDrawTask(data);
    if (this.oss_enable) {
      // 启用OSS
      return await this.fileService.uploadFileToOSS(_v, `image`);
    } else {
      return _v;
    }
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
    await this.Initalize(); //初始化获取ComfyUI的节点信息
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
   * 图片反推提示词
   */
  async image2tagger(
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
    await this.Initalize(); //初始化获取ComfyUI的节点信息
    workflowApiTagger[10].inputs.image_path = params.image_path;
    const data = {
      source: options?.source || 'web',
      prompt: workflowApiTagger,
      api: '图片反推提示词',
      client_id,
      socket_id,
      lifo: options?.lifo || false,
    } as DrawTask;
    return await this.submitDrawTask(data); //统一通过这个方法提交绘画API
  }

  /**
   * 换脸
   */
  async faceSwap(
    client_id: string,
    params: {
      image_path_face: string; //人脸图片路径
      image_path_refer: string; //参考图片路径
    },
    socket_id?: string,
    options?: {
      source: 'web' | 'wechat';
      lifo?: boolean;
    },
  ) {
    await this.Initalize(); //初始化获取ComfyUI的节点信息
    FaceSwap[91].inputs.image_path = params.image_path_refer;
    FaceSwap[92].inputs.image_path = params.image_path_face;
    const data = {
      source: options?.source || 'web',
      prompt: FaceSwap,
      api: '换脸',
      client_id,
      socket_id,
      lifo: options?.lifo || false,
    } as DrawTask;
    const _v = await this.submitDrawTask(data);
    if (this.oss_enable) {
      // 启用OSS
      return await this.fileService.uploadFileToOSS(_v, `image`);
    } else {
      return _v;
    }
  }
  /**
   * AI模特，AI电商换装
   */
  async model(
    client_id: string,
    params: {
      image_path_model: string; //人台模特照片
      parts?: string; //需要给模特试穿的部分
      image_path_mask?: string; //自定义遮罩
      positive?: string;
      nagative?: string;
      ckpt_name_id?: number;
    },
    socket_id?: string,
    options?: {
      source: 'web' | 'wechat';
      lifo?: boolean;
    },
  ) {
    await this.Initalize(); //初始化获取ComfyUI的节点信息
    const image_path_mask =
      params.image_path_mask ||
      (await this.segmentAnything(client_id, {
        image_path: params.image_path_model,
        segmentparts: params.parts,
      }));
    workflowApiModel[177].inputs.image_path = params.image_path_model;
    workflowApiModel[170].inputs.image_path = image_path_mask;
    workflowApiModel[179].inputs.text = params.positive || '';
    workflowApiModel[171].inputs.text = params.nagative || '';
    workflowApiModel[143].inputs.ckpt_name =
      this.ckpt_names[params.ckpt_name_id || 0];
    workflowApiModel[183].inputs.seed = this.getSeed(15);
    const data = {
      source: options?.source || 'web',
      prompt: workflowApiModel,
      api: 'AI模特',
      client_id,
      socket_id,
      lifo: options?.lifo || false,
    } as DrawTask;
    const _v = await this.submitDrawTask(data);
    if (this.oss_enable) {
      // 启用OSS
      return await this.fileService.uploadFileToOSS(_v, `image`);
    } else {
      return _v;
    }
  }

  /**
   * SD3 官方官方文生图
   */
  async text2imgSD3(params: {
    prompt: string;
    mode?: 'text-to-image' | 'image-to-image';
    aspect_ratio?: SD3AspectRatio;
    negative_prompt?: string;
    model?: 'sd3' | 'sd3-turbo';
    image?: any; //image-to-image 必须
    strength?: number; //image-to-image 必须
    seed?: number;
    style_preset?: SD3StylePreset;
  }) {
    const sd3url = 'https://api.stability.ai/v2beta/stable-image/generate/sd3';
    // const formData = new FormData();
    // formData.append('prompt', params.prompt);
    // formData.append('mode', params.mode || 'text-to-image');
    // formData.append('negative_prompt', params.negative_prompt || '');
    // formData.append('model', params.model || 'sd3');
    // formData.append('image', params.image);
    // formData.append('strength', params.strength || 0.5);
    // formData.append('seed', this.getSeed(9));
    // formData.append('style_preset', params.style_preset || '');
    // formData.append('output_format', 'png');
    // if (params.mode === 'text-to-image') {
    //   formData.append('aspect_ratio', params.aspect_ratio || '1:1');
    // }
    const formData = {
      prompt: params.prompt,
      mode: params.mode || 'text-to-image',
      negative_prompt: params.negative_prompt || '',
      model: params.model || 'sd3',
      seed: this.getSeed(9),
      style_preset: params.style_preset || '',
      output_format: 'png',
    };
    if (!params.mode || params.mode === 'text-to-image') {
      Object.assign(formData, {
        aspect_ratio: params.aspect_ratio || '1:1',
      });
    }
    if (params.mode === 'image-to-image') {
      Object.assign(formData, {
        strength: params.strength || 0.5,
        image: params.image,
      });
    }
    this.logger.log('提交SD的绘画数据', formData);
    const response = await this.comfyuiAxios.postForm(
      sd3url,
      axios.toFormData(formData, new FormData()),
      {
        validateStatus: undefined,
        responseType: 'arraybuffer',
        headers: {
          Authorization: `Bearer ${this.configService.get('CONFIG_SD3_APIKEY')}`,
          Accept: 'image/*',
          ContentType: 'multipart/form-data',
        },
      },
    );
    //将获取的Buffer转换为图片文件
    if (response.status === 200) {
      // console.log('data', response.data);
      const buffer = Buffer.from(response.data);
      //将Buffer上传到阿里云
      return await this.fileService.uploadBufferToOSS(buffer, `image`);
    } else {
      console.log(response.request);
      throw new Error(`${response.status}: ${response.data.toString()}`);
    }
  }
  /**
   * 初始化节点数据
   *
   */
  async Initalize() {
    // 初始化获取ComfyUI的节点信息
    this.logger.log(
      'ComfyUI服务器地址',
      this.configService.get('CONFIG_COMFYUI_SERVER_URL'),
    );
    if (!this.Object_info) {
      await this.getObject_info();
      if (!this.Object_info) {
        this.logger.error('获取ComfyUI的节点信息失败');
        return;
      } else {
        this.ckpt_names =
          this.Object_info[
            'CheckpointLoaderSimple'
          ].input.required.ckpt_name[0];
      }
    }
    //如果启用远程绘画服务
    if (this.remote_comfyui) {
      // await this.getAccessToken();
    }
  }

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
