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
import { DrawService } from './DrawService';
import { ConfigService } from '@nestjs/config/dist';

@Processor('draw')
export class DrawConsumer {
  constructor(
    private readonly drawService: DrawService,
    private readonly wsGateway: WsGateway,
    private readonly configService: ConfigService,
  ) {}

  private readonly logger = new Logger(DrawConsumer.name);
  private readonly clientId = 'admin9527';
  public static ws_client: WebSocket;

  @Process('text2img')
  async text2img(job: Job) {
    this.logger.debug('Processing', job.id, 'for', 'seconds');
    let defaultimeout = 60;
    const { api } = job.data;
    switch (api) {
      case '文生图':
        defaultimeout = 30;
        break;
      case '图生图':
        defaultimeout = 30;
        break;
      case 'AI模特':
        defaultimeout = 120;
        break;
      case 'AI写真':
        defaultimeout = 240;
        break;
      case '放大1':
        defaultimeout = 120;
        break;
      case '放大2':
        defaultimeout = 180;
        break;
    }
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
  async drawTaskExcu(data: any, timeout: number) {
    let socket = '';
    const p1 = new Promise((resolve, reject) => {
      //client_id为用户id
      this.websocketInit();
      const { client_id, prompt, socket_id } = data;
      socket = socket_id;
      const params = {
        client_id: 'admin9527', //固定值
        prompt: prompt,
      };
      this.logger.debug(`发生绘画任务成功`);

      this.drawService.sendTackprompt(params).then((sendres: any) => {
        //监听服务器消息
        DrawConsumer.ws_client.onmessage = (event: any) => {
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
                const drawhistory = {
                  user_id: client_id,
                  prompt_id: sendres.prompt_id,
                  draw_api: prompt,
                  filename: images[0]?.filename,
                  status: true,
                };
                //保存到数据库
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
