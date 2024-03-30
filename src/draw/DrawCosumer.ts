import {
  Process,
  Processor,
  OnQueueActive,
  OnQueueProgress,
} from '@nestjs/bull';
import { Job } from 'bull';
import { WsGateway } from 'src/ws/ws.gateway';
import WebSocket = require('ws'); // 导入WebSocket模块
import { Logger } from '@nestjs/common';
import { DrawhistoryService } from 'src/drawhistory/drawhistory.service';
import { ConfigService } from '@nestjs/config/dist';
import { DrawService, DrawTask } from './draw.service';
import { WechatAuthService } from '../wechat-auth/wechat-auth.service';

interface ComfyAPIType {
  type: '文生图' | '图生图' | 'AI模特' | 'AI写真' | '放大1' | '放大2';
  timeout: number;
}
const APIS = [
  {
    type: '文生图',
    timeout: 30,
  },
  {
    type: '图生图',
    timeout: 30,
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

@Processor('draw')
export class DrawConsumer {
  constructor(
    private readonly drawHistory: DrawhistoryService,
    private readonly drawService: DrawService,
    private readonly wsGateway: WsGateway,
    private readonly configService: ConfigService,
    private readonly wechatauthService: WechatAuthService,
  ) {}

  private readonly logger = new Logger(DrawConsumer.name);
  private readonly clientId = 'admin9527'; //id可以随意
  public static ws_client: WebSocket;

  @Process('text2img')
  async text2img(job: Job) {
    this.logger.debug('Processing', job.id, 'for', 'seconds');
    const { api } = job.data;
    const defaultimeout = APIS.find((item) => item.type === api)?.timeout || 60;
    this.logger.error(defaultimeout);
    await this.drawTaskExcu(job.data, defaultimeout);

    //广播给所有人排队情况
    const message = {
      type: 'receive',
      queue_remaining: await this.drawService.getQueueLength(),
    };
    WsGateway.server.emit('message', JSON.stringify(message));
    this.logger.debug('Processing done', job.id);
  }

  /**
   *
   * @param data
   * @param timeout 超时时间，秒
   */
  async drawTaskExcu(data: DrawTask, timeout: number) {
    let socket = '';
    const p1 = new Promise((resolve) => {
      //client_id为用户id
      this.websocketInit();
      const { source, client_id, prompt, socket_id } = data;
      socket = socket_id;
      const params = {
        client_id: 'admin9527', //固定值
        prompt: prompt,
      };
      this.logger.debug(`发生绘画任务成功`);

      this.drawService.sendTackprompt(params).then((sendres: any) => {
        //监听服务器消息
        DrawConsumer.ws_client.onmessage = async (event: any) => {
          //转发
          this.logger.debug(event.data);

          //如果存在并且socket处于连接状态
          const target_socket =
            WsGateway.server.sockets?.sockets?.get(socket_id);
          if (target_socket) {
            this.logger.debug(`发送给${socket_id},${event.data}`);
            target_socket.emit('message', event.data);
          }
          try {
            const { type } = JSON.parse(event.data + '');
            if (type === 'executed') {
              const {
                data: {
                  output: { images },
                },
              } = JSON.parse(event.data + '');
              if (images && images[0]?.filename.includes('final')) {
                if (source === 'wechat') {
                  //如果是微信消息
                  const { filename, subfolder, type } = images[0];
                  let imageUrl = '';
                  if (subfolder) {
                    imageUrl =
                      this.drawService.webSocketSeverUrl +
                      '/view?subfolder=' +
                      subfolder +
                      '&filename=' +
                      filename +
                      '&type=' +
                      type;
                  } else {
                    imageUrl =
                      this.drawService.webSocketSeverUrl +
                      '/view?filename=' +
                      filename +
                      '&type=' +
                      type;
                  }
                  const mediaId =
                    await this.wechatauthService.getMediaId(imageUrl);
                  await this.wechatauthService.sendServiceImageMessge(
                    mediaId,
                    client_id,
                  );
                }
                const drawhistory = {
                  user_id: client_id,
                  prompt_id: sendres.prompt_id,
                  draw_api: prompt,
                  filename: images[0]?.filename,
                  status: true,
                };
                //保存到数据库
                this.drawHistory
                  .create(drawhistory)
                  .catch((err) => {
                    this.logger.error(err);
                  })
                  .finally(() => {
                    this.logger.log('保存到数据成功了');
                    resolve('绘画任务最终完成');
                  });
              }
            }
          } catch (e) {
            this.wsGateway.sendSystemMessage(
              socket,
              '绘画任务执行异常，请重试',
            );
            this.logger.error(e);
          }
        };
      });
    });
    const p2 = new Promise((resolve, reject) => {
      setTimeout(() => {
        reject('Error.timeout……');
      }, timeout * 1000);
    });

    return Promise.race([p1, p2])
      .then(() => {
        this.logger.debug('绘图任务执行完成');
      })
      .catch(() => {
        this.wsGateway.sendSystemMessage(socket, '绘画任务执行异常，请重试');
        this.logger.error('绘图任务执行异常');
      });
  }

  /**
   * 初始化与绘画服务端的链接
   */
  async websocketInit() {
    if (!this.validateWsconnect()) {
      DrawConsumer.ws_client = new WebSocket(
        `${this.configService.get('CONFIG_COMFYUI_WS_SERVER_URL')}/ws?clientId=` +
          this.clientId,
      );
    }
  }

  /**
   * 验证链接状态
   */
  validateWsconnect() {
    if (
      DrawConsumer.ws_client === undefined ||
      DrawConsumer.ws_client.readyState != 1
    ) {
      return false;
    } else {
      DrawConsumer.ws_client.ping('', true, (e: any) => {
        this.logger.debug('当前的链接状态是否存在错误：', e);
        return !e;
      });
    }
  }

  @OnQueueActive()
  async onActive(job: Job) {
    const remain = await this.drawService.getQueueLength();
    //广播队列任务信息
    WsGateway.server.sockets?.emit('remain', { remain });
    this.logger.debug(
      `onActive job ${job.id} of type ${job.name} with data ${job.data}...队长：`,
      remain,
    );
  }

  @OnQueueProgress()
  onProgress(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.data}...starting`,
    );
  }
}
