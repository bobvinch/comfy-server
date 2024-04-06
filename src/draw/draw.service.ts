import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { ConfigService } from '@nestjs/config/dist';
import axios from 'axios';
// 普通文生图
import text2img_1 from './data/workflow_api_text2img.json';
const text2img = require('./data/workflow_api_text2img.json');
// 图生图
import image2img_1 from './data/workflow_api_image2img.json';
const image2img = require('./data/workflow_api_image2img.json');
// 图生视频
import img2video_1 from './data/workflow_api_img2video.json';
const img2video = require('./data/workflow_api_img2video.json');
// 绘画参数
import objectInfo_1 from './data/objectInfo.json';
const objectInfo = require('./data/objectInfo.json');
// 抠图
import matting_1 from './data/workflow_api_matting.json';
const matting = require('./data/workflow_api_matting.json');
// 局部重绘
import inpainting_1 from './data/workflow_api_inpainting.json';
const inpainting = require('./data/workflow_api_inpainting.json');
// 移除背景
import removebg_1 from './data/workflow_api_removebg.json';
const removebg = require('./data/workflow_api_removebg.json');

export interface DrawTask {
  source: 'wechat' | 'web';
  client_id: string;
  prompt: any;
  api: string;
  socket_id?: string;
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
    timeout: 10,
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
  constructor(
    @InjectQueue('draw') private drawQueue: Queue,
    private readonly configService: ConfigService,
  ) {
    this.Initalize();
  }

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

  /**
   * 讲绘画任务加入到任务队列
   * @param data
   */
  async sendToQueue(data: DrawTask) {
    return await this.drawQueue.add('text2img', data, {
      timeout:
        APIS.find((item) => item.type === data.api)?.timeout * 1000 ||
        60 * 1000,
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
   * 返送任务到ComfyUI服务器
   * @param data
   */
  async sendTackprompt(data: any): Promise<string | undefined | any> {
    try {
      const {
        data: { prompt_id },
      } = await this.comfyuiAxios.post('/prompt', data);
      return prompt_id;
      // console.log('res', res);
    } catch (error) {
      return '';
    }
  }

  /**
   * 微信端文生图
   * @param positive
   * @param client_id 用户id openid,微信用户唯一标识
   */
  async wechatText2img(positive: string, client_id: string) {
    const APIdata = require('./data/text2imgapi.json');
    APIdata[24].inputs.text = positive;
    APIdata[32].inputs.noise_seed = this.getSeed(15);
    APIdata[47].inputs.ckpt_name = this.ckpt_names[0]; //随机重绘幅度
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
    APIdata[85].inputs.noise_seed = this.getSeed(15);
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
  ) {
    //正向提示词
    text2img[55].inputs.text = params.positive || '一个女孩';
    //负向提示词
    text2img[58].inputs.text += params.negative || '';
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
      source: 'web',
      prompt: text2img,
      api: '文生图',
      client_id,
      socket_id,
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
  ) {
    //图片路径
    image2img[70].inputs.image_path = params.image_path;
    image2img[85].inputs.denoise = params.denoise || 0.5;
    image2img[85].inputs.noise_seed = params.noise_seed || this.getSeed(15);
    if (params.upscale_by) {
      image2img[74].inputs.scale_by = params.upscale_by;
    }

    image2img[92].inputs.ckpt_name = this.ckpt_names[params.ckpt_name_id || 0];
    image2img[51].inputs.filename_prefix =
      params.filename_prefix + '_image2img_output_final_';
    const data = {
      source: 'web',
      prompt: image2img,
      api: '图生图',
      client_id,
      socket_id,
    } as DrawTask;
    return await this.submitDrawTask(data);
  }

  /**
   * 图生视频
   * @param client_id
   * @param socket_id
   * @param params
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
      min_cfg?: 1;
    },
  ) {
    //图片路径
    img2video[37].inputs.image_path = params.image_path;
    img2video[8].inputs.video_frames = params.video_frames || 14;
    img2video[8].inputs.fps = params.fps || 8;
    img2video[8].inputs.motion_bucket_id = params.motion_bucket_id || 127;
    img2video[8].inputs.augmentation_level = params.augmentation_level || 0;

    img2video[19].inputs.cfg = params.cfg;
    img2video[19].inputs.steps = params.steps;

    img2video[23].inputs.filename_prefix =
      params.filename_prefix + '_image2video_output_final_';
    img2video[23].inputs.frame_rate = params.fps || 8;
    img2video[18].inputs.min_cfg = params.min_cfg || 1;
    const data = {
      source: 'web',
      prompt: img2video,
      api: '图生视频',
      client_id,
      socket_id,
    } as DrawTask;
    return await this.submitDrawTask(data);
  }

  /**
   * 抠图
   * @param client_id
   * @param params
   * @param socket_id
   */
  async segmentAnything(
    client_id: string,
    params: {
      image_path: string;
      segmentparts: string;
    },
    socket_id?: string,
  ) {
    matting[67].inputs.text = params.segmentparts;
    matting[62].inputs.image_path = params.image_path;
    const data = {
      source: 'web',
      prompt: matting,
      api: '抠图',
      client_id,
      socket_id,
    } as DrawTask;
    return await this.submitDrawTask(data);
  }

  /**
   *局部重绘
   * @param client_id
   * @param params
   * @param socket_id
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
  ) {
    inpainting[70].inputs.image_path = params.image_path;
    inpainting[87].inputs.image_path = params.image_path_mask;
    inpainting[98].inputs.ckpt_name = this.ckpt_names[params.ckpt_name_id];
    inpainting[85].inputs.denoise = params.denoise || 0.5;
    inpainting[95].inputs.text = params.positive || '';
    inpainting[95].inputs.text = params.nagative || '';
    const data = {
      source: 'web',
      prompt: inpainting,
      api: '局部重绘',
      client_id,
      socket_id,
    } as DrawTask;
    return await this.submitDrawTask(data);
  }

  /**
   * 移除背景
   * @param client_id
   * @param params
   * @param socket_id
   */
  async removebg(
    client_id: string,
    params: {
      image_path: string;
    },
    socket_id?: string,
  ) {
    removebg[62].inputs.image_path = params.image_path;

    const data = {
      source: 'web',
      prompt: removebg,
      api: '移除背景',
      client_id,
      socket_id,
    } as DrawTask;
    return await this.submitDrawTask(data);
  }

  /**
   * 初始化节点数据
   *
   */
  Initalize = async () => {
    //初始化获取ComfyUI的节点信息
    if (!this.Object_info) {
      console.log('@ComfyUI 初始化获取ComfyUI的节点信息');
      // ComfyUI.Object_info = await ComfyUI.getObject_info()
      this.ckpt_names =
        objectInfo['CheckpointLoaderSimple'].input.required.ckpt_name[0];
    }
  };
}
