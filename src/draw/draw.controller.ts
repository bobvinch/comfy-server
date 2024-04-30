import { Get, Query, Body, Controller, Post } from '@nestjs/common';
import { DrawService } from './draw.service';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DrawTask } from './data/DrawConfig';

@ApiTags('AI绘画')
@Controller('draw')
export class DrawController {
  constructor(private readonly drawService: DrawService) {}

  @ApiOperation({
    summary: '获取comfyui节点信息',
    description: '获取comfyui节点信息',
  })
  @Get('getObjectinfo')
  async getObjectinfo() {
    return await this.drawService.getObject_info();
  }
  @ApiOperation({
    summary: '通用接口，',
    description:
      'AI绘画接口，可提交任意绘图的comfyui工作流API任务，直接返回绘图成功的结果：图片或者视频的url',
    operationId: 'submitDrawTask',
    tags: ['AI绘画'],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              source: {
                type: 'string',
                description:
                  'web or wechat,来源识别，区分web端任务和微信端任务，默认web',
                example: 'web',
              },
              prompt: {
                type: 'object',
                description: 'comfyui绘画API',
                example: { prompt: 'your comfyui prompt' },
              },
              client_id: {
                type: 'string',
                description: 'client_id，客户端唯一标识',
                example: 'your client id',
              },
              socket_id: {
                type: 'string',
                description:
                  'socket_id，websocket唯一标识,web端调用的时候必须，否则无法接受到websocket实时消息',
                example: 'your socket id',
              },
              api: {
                type: 'string',
                description: 'api名称具体，文生图，图生图，决定任务的超时时间',
                example: '文生图',
              },
              lifo: {
                type: 'boolean',
                description: '是否使用lifo队列，默认false',
              },
            },
          },
        },
      },
    },
  })
  @Post('submitTask')
  async submitDrawTask(@Body() data: DrawTask) {
    const { source, socket_id, client_id, prompt, api } = data;
    return await this.drawService.submitDrawTask(data);
  }

  @ApiOperation({
    summary: '文生图',
    description: '文生图:图片或者视频的url',
    operationId: 'text2img',
    tags: ['AI绘画'],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              client_id: {
                type: 'string',
                description: 'client_id，客户端唯一标识',
                example: 'your client id',
              },
              socket_id: {
                type: 'string',
                description:
                  'socket_id，websocket唯一标识,web端调用的时候必须，否则无法接受到websocket实时消息',
                example: 'your socket id',
              },
              params: {
                type: 'object',
                description: 'comfyui绘画API关键参数',
                example: {
                  positive: 'a asia girl',
                  negative: '丑陋的',
                  seed: 12345678912345,
                  width: 512,
                  height: 768,
                  ckpt_name_id: 0,
                  filename_prefix: 'iamgename', //文件名前缀
                  upscale_by: 1,
                },
              },
              options: {
                type: 'object',
                description: '其他可选控制任务分发和队列参数等',
                example: {
                  source: 'web', //web or wechat,来源识别，区分web端任务和微信端任务，默认web
                  apisource: 'default',
                  lifo: false, //是否使用lifo队列，默认false
                },
              },
            },
          },
        },
      },
    },
  })
  @Post('text2img')
  async text2img(
    @Body('params') params: any,
    @Body('client_id') client_id: string,
    @Body('socket_id') socket_id: string,
    @Body('options') options: any,
  ) {
    console.log('收到的绘画参数', params);
    return await this.drawService.text2img(
      client_id,
      socket_id,
      params,
      options,
    );
  }

  /**
   * 图生图
   * @param params
   * @param client_id
   * @param socket_id
   * @param options
   */
  @ApiOperation({
    summary: '图生图',
    description: '图生图，直接返回绘图成功的结果:图片或者视频的url',
    operationId: 'image2img',
    tags: ['AI绘画'],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              client_id: {
                type: 'string',
                description: 'client_id，客户端唯一标识',
                example: 'your client id',
              },
              socket_id: {
                type: 'string',
                description:
                  'socket_id，websocket唯一标识,web端调用的时候必须，否则无法接受到websocket实时消息',
                example: 'your socket id',
              },
              params: {
                type: 'object',
                description: 'comfyui绘画API关键参数',
                example: {
                  image_path:
                    'https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/t2i_1.jpg',
                  positive: '',
                  nagative: '',
                  denoise: 0.5,
                  noise_seed: 1212121212121212,
                  ckpt_name_id: 0,
                  filename_prefix: 'your imagename here', //文件名前缀
                  upscale_by: 1,
                  sd3_style_preset: '', //SD3风格
                  sd3_aspect_ratio: '', //SD3比例
                  sd3_model: 'sd3', //SD3模型
                  sd3_strength: 0.5, //SD3强度
                },
              },
              options: {
                type: 'object',
                description: '其他可选控制任务分发和队列参数等',
                example: {
                  source: 'web', //web or wechat,来源识别，区分web端任务和微信端任务，默认web
                  apisource: 'default',
                  lifo: false, //是否使用lifo队列，默认false
                },
              },
            },
          },
        },
      },
    },
  })
  @Post('img2img')
  async img2img(
    @Body('params') params: any,
    @Body('client_id') client_id: string,
    @Body('socket_id') socket_id: string,
    @Body('options') options: any,
  ) {
    console.log(socket_id);
    return await this.drawService.image2img(
      client_id,
      socket_id,
      params,
      options,
    );
  }
  @ApiOperation({
    summary: '图生视频',
    description: '图生视频，直接返回绘图成功的结果:图片或者视频的url',
    operationId: 'image2video',
    tags: ['AI绘画'],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              client_id: {
                type: 'string',
                description: 'client_id，客户端唯一标识',
                example: 'your client id',
              },
              socket_id: {
                type: 'string',
                description:
                  'socket_id，websocket唯一标识,web端调用的时候必须，否则无法接受到websocket实时消息',
                example: 'your socket id',
              },
              params: {
                type: 'object',
                description: 'comfyui绘画API关键参数',
                example: {
                  image_path:
                    'https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/u%3D1090338134%2C2696420997%26fm%3D253%26fmt%3Dauto%26app%3D138%26f%3DJPEG.webp',
                  video_frames: 25,
                  fps: 8,
                  motion_bucket_id: 127, //运动幅度，默认127
                  augmentation_level: 0, //增强，默认为0
                  filename_prefix: '文生视频',
                  cfg: 3,
                  steps: 20,
                  min_cfg: 1,
                },
              },
              options: {
                type: 'object',
                description: '其他可选控制任务分发和队列参数等',
                example: {
                  source: 'web', //web or wechat,来源识别，区分web端任务和微信端任务，默认web
                  lifo: false, //是否使用lifo队列，默认false
                },
              },
            },
          },
        },
      },
    },
  })
  @Post('img2video')
  async img2video(
    @Body('params') params: any,
    @Body('client_id') client_id: string,
    @Body('socket_id') socket_id: string,
  ) {
    console.log(socket_id);
    return await this.drawService.image2video(client_id, socket_id, params);
  }
  @ApiOperation({
    summary: '抠图',
    description:
      '抠图，万物皆可扣，目前最强大的抠图，任意文本抠图，不需要任何复杂操作，直接返回绘图成功的结果:图片或者视频的url',
    operationId: 'segmentAnything',
    tags: ['AI绘画'],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              client_id: {
                type: 'string',
                description: 'client_id，客户端唯一标识',
                example: 'your client id',
              },
              socket_id: {
                type: 'string',
                description:
                  'socket_id，websocket唯一标识,web端调用的时候必须，否则无法接受到websocket实时消息',
                example: 'your socket id',
              },
              params: {
                type: 'object',
                description: 'comfyui绘画API关键参数',
                example: {
                  image_path:
                    'https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/4c226c64d37f410c857f98ebb3ecb5ef.jpeg',
                  segmentparts: '西瓜',
                },
              },
              options: {
                type: 'object',
                description: '其他可选控制任务分发和队列参数等',
                example: {
                  source: 'web', //web or wechat,来源识别，区分web端任务和微信端任务，默认web
                  lifo: false, //是否使用lifo队列，默认false
                },
              },
            },
          },
        },
      },
    },
  })
  @Post('segmentAnything')
  async segmentAnything(
    @Body('params') params: any,
    @Body('client_id') client_id: string,
    @Body('socket_id') socket_id: string,
  ) {
    // console.log(socket_id, params);
    return await this.drawService.segmentAnything(client_id, params, socket_id);
  }
  @ApiOperation({
    summary: '局部重绘',
    description:
      '局部重绘，上传原图及遮罩，将遮罩部分进行重绘，直接返回绘图成功的结果图片',
    operationId: 'inpainting',
    tags: ['AI绘画'],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              client_id: {
                type: 'string',
                description: 'client_id，客户端唯一标识',
                example: 'your client id',
              },
              socket_id: {
                type: 'string',
                description:
                  'socket_id，websocket唯一标识,web端调用的时候必须，否则无法接受到websocket实时消息',
                example: 'your socket id',
              },
              params: {
                type: 'object',
                description: 'comfyui绘画API关键参数',
                example: {
                  image_path:
                    'https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/R-C.jpg',
                  image_path_mask:
                    'https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/R-C__segment_output_final__0001.png',
                  ckpt_name_id: 0,
                  denoise: 0.5,
                  positive: '一个女孩',
                  nagative: '',
                },
              },
              options: {
                type: 'object',
                description: '其他可选控制任务分发和队列参数等',
                example: {
                  source: 'web', //web or wechat,来源识别，区分web端任务和微信端任务，默认web
                  lifo: false, //是否使用lifo队列，默认false
                },
              },
            },
          },
        },
      },
    },
  })
  @Post('inpainting')
  async inpainting(
    @Body('params') params: any,
    @Body('client_id') client_id: string,
    @Body('socket_id') socket_id: string,
  ) {
    return await this.drawService.inpainting(client_id, params, socket_id);
  }
  @ApiOperation({
    summary: '背景擦除',
    description:
      '背景擦除，仅仅需要去除背景的时候，建议使用这个接口，速度比抠图segmentanything快，直接返回去除背景之后的透明背景图片',
    operationId: 'removebg',
    tags: ['AI绘画'],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              client_id: {
                type: 'string',
                description: 'client_id，客户端唯一标识',
                example: 'your client id',
              },
              socket_id: {
                type: 'string',
                description:
                  'socket_id，websocket唯一标识,web端调用的时候必须，否则无法接受到websocket实时消息',
                example: 'your socket id',
              },
              params: {
                type: 'object',
                description: 'comfyui绘画API关键参数',
                example: {
                  image_path:
                    'https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/R-C.jpg',
                },
              },
              options: {
                type: 'object',
                description: '其他可选控制任务分发和队列参数等',
                example: {
                  source: 'web', //web or wechat,来源识别，区分web端任务和微信端任务，默认web
                  lifo: false, //是否使用lifo队列，默认false
                },
              },
            },
          },
        },
      },
    },
  })
  @Post('removebg')
  async removebg(
    @Body('params') params: any,
    @Body('client_id') client_id: string,
    @Body('socket_id') socket_id: string,
  ) {
    return await this.drawService.removebg(client_id, params, socket_id);
  }
  @ApiOperation({
    summary: 'HD修复',
    description:
      'HD修复，上传原图，将原图进行HD修复，直接返回绘图成功的结果图片',
    operationId: 'hdfix',
    tags: ['AI绘画'],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              client_id: {
                type: 'string',
                description: 'client_id，客户端唯一标识',
                example: 'your client id',
              },
              socket_id: {
                type: 'string',
                description:
                  'socket_id，websocket唯一标识,web端调用的时候必须，否则无法接受到websocket实时消息',
                example: 'your socket id',
              },
              params: {
                type: 'object',
                description: 'comfyui绘画API关键参数',
                example: {
                  image_path:
                    'https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/ComfyUI_00001_.png',
                },
              },
              options: {
                type: 'object',
                description: '其他可选控制任务分发和队列参数等',
                example: {
                  source: 'web', //web or wechat,来源识别，区分web端任务和微信端任务，默认web
                  lifo: false, //是否使用lifo队列，默认false
                },
              },
            },
          },
        },
      },
    },
  })
  @Post('hdfix')
  async hdfix(
    @Body('params') params: any,
    @Body('client_id') client_id: string,
    @Body('socket_id') socket_id: string,
    @Body('options') options: any,
  ) {
    return await this.drawService.workflowApiHdfix4(
      client_id,
      params,
      socket_id,
      options,
    );
  }
  @ApiOperation({
    summary: '人脸融合-换脸',
    description: '人脸融合（换脸），将人物脸部转移参考图，实现AI艺术照的效果',
    operationId: 'faceswap',
    tags: ['AI绘画'],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              client_id: {
                type: 'string',
                description: 'client_id，客户端唯一标识',
                example: 'your client id',
              },
              socket_id: {
                type: 'string',
                description:
                  'socket_id，websocket唯一标识,web端调用的时候必须，否则无法接受到websocket实时消息',
                example: 'your socket id',
              },
              params: {
                type: 'object',
                description: 'comfyui绘画API关键参数',
                example: {
                  image_path_face:
                    'https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/R-C.jpg',
                  image_path_refer:
                    'https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/t2i_1.jpg',
                },
              },
              options: {
                type: 'object',
                description: '其他可选控制任务分发和队列参数等',
                example: {
                  source: 'web', //web or wechat,来源识别，区分web端任务和微信端任务，默认web
                  lifo: false, //是否使用lifo队列，默认false
                },
              },
            },
          },
        },
      },
    },
  })
  @Post('faceswap')
  async faceswap(
    @Body('params') params: any,
    @Body('client_id') client_id: string,
    @Body('socket_id') socket_id: string,
    @Body('options') options: any,
  ) {
    return await this.drawService.faceSwap(
      client_id,
      params,
      socket_id,
      options,
    );
  }
  @ApiOperation({
    summary: 'AI模特-电商换装',
    description:
      '讲人台模特照或者商拍中指定部分保留，其余地方重绘，可以拍摄商品，服装，鞋子，包包均可',
    operationId: 'aimodel',
    tags: ['AI绘画'],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              client_id: {
                type: 'string',
                description: 'client_id，客户端唯一标识',
                example: 'your client id',
              },
              socket_id: {
                type: 'string',
                description:
                  'socket_id，websocket唯一标识,web端调用的时候必须，否则无法接受到websocket实时消息',
                example: 'your socket id',
              },
              params: {
                type: 'object',
                description: 'comfyui绘画API关键参数',
                example: {
                  parts: '裙子',
                  image_path_model:
                    'https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/AI%E5%81%87%E4%BA%BA%E6%A8%A1%E7%89%B9.png',
                  image_path_mask:
                    'https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/AI%25E5%2581%2587%25E4%25BA%25BA%25E6%25A8%25A1%25E7%2589%25B9__segment_output_final__0001.png',
                  positives: '一个女孩，淡蓝色背景，摄影效果，超精细，氛围',
                  negatives: '丑陋的,吊带，遮挡皮肤',
                  ckpt_name_id: 0,
                },
              },
              options: {
                type: 'object',
                description: '其他可选控制任务分发和队列参数等',
                example: {
                  source: 'web', //web or wechat,来源识别，区分web端任务和微信端任务，默认web
                  lifo: false, //是否使用lifo队列，默认false
                },
              },
            },
          },
        },
      },
    },
  })
  @Post('model')
  async model(
    @Body('params') params: any,
    @Body('client_id') client_id: string,
    @Body('socket_id') socket_id: string,
    @Body('options') options: any,
  ) {
    console.log(params);
    return await this.drawService.model(client_id, params, socket_id, options);
  }
  @ApiOperation({
    summary: '提示词反推',
    description: 'AI标签-图片标签，将图片进行标签识别，返回标签结果',
    operationId: 'image2tagger',
    tags: ['AI绘画'],
    requestBody: {
      content: {
        'application/json': {
          schema: {
            type: 'object',
            properties: {
              client_id: {
                type: 'string',
                description: 'client_id，客户端唯一标识',
                example: 'your client id',
              },
              socket_id: {
                type: 'string',
                description:
                  'socket_id，websocket唯一标识,web端调用的时候必须，否则无法接受到websocket实时消息',
                example: 'your socket id',
              },
              params: {
                type: 'object',
                description: 'comfyui绘画API关键参数',
                example: {
                  image_path:
                    'https://wangbo0808.oss-cn-shanghai.aliyuncs.com/aidraw/R-C.jpg',
                },
              },
              options: {
                type: 'object',
                description: '其他可选控制任务分发和队列参数等',
                example: {
                  source: 'web', //web or wechat,来源识别，区分web端任务和微信端任务，默认web
                  lifo: false, //是否使用lifo队列，默认false
                },
              },
            },
          },
        },
      },
    },
  })
  @Post('image2tagger')
  async image2tagger(
    @Body('params') params: any,
    @Body('client_id') client_id: string,
    @Body('socket_id') socket_id: string,
    @Body('options') options: any,
  ) {
    return await this.drawService.image2tagger(
      client_id,
      params,
      socket_id,
      options,
    );
  }

  @ApiOperation({
    summary: '加入绘画黑名单',
    description: '加入绘画黑名单',
    operationId: 'addBlackList',
    tags: ['用户管理'],
    parameters: [
      {
        name: 'client_id',
        in: 'query',
        description: 'client_id，客户端唯一标识',
        required: true,
        schema: {
          type: 'string',
          example: 'your client id',
        },
      },
    ],
  })
  @Get('addBlackList')
  async addBlackList(@Query('client_id') client_id: string) {
    console.log(client_id);
    return await this.drawService.addBlackList(client_id);
  }

  @ApiOperation({
    summary: '获取绘画黑名单',
    description: '获取绘画黑名单',
  })
  @Get('getBlackList')
  async getBlackList() {
    return await this.drawService.getBlackList();
  }

  @ApiOperation({
    summary: '移除绘画黑名单',
    description: '移除绘画黑名单',
    parameters: [
      {
        name: 'client_id',
        in: 'query',
        description: 'client_id，客户端唯一标识',
        required: true,
        schema: {
          type: 'string',
          example: 'your client id',
        },
      },
    ],
  })
  @Get('removeBlackList')
  async removeBlackList(@Query('client_id') uid: string) {
    return await this.drawService.removeBlackList(uid);
  }
}
