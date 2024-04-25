import {
  Process,
  Processor,
  OnQueueActive,
  OnQueueCompleted,
} from '@nestjs/bull';
import { Job } from 'bull';
import { WsGateway } from 'src/ws/ws.gateway';
import { Logger } from '@nestjs/common';
import { DrawService } from './draw.service';
import { WechatAuthService } from '../wechat-auth/wechat-auth.service';
import { AppService } from '../app.service';
import Websocket = require('ws');

@Processor('draw')
export class DrawConsumer {
  constructor(
    private readonly drawService: DrawService,
    private readonly wechatauthService: WechatAuthService,
    private readonly appSevice: AppService,
  ) {}

  private readonly logger = new Logger(DrawConsumer.name);
  private readonly clientId = 'admin9527'; //id可以随意
  public ws_client: Websocket;

  @Process('drawtask')
  async drawtask(job: Job): Promise<string> {
    // const output = await this.testTask(); //测试
    // 绘画任务
    const output = await this.drawTaskExcu(job, this.drawService.local_comfyui);
    // this.logger.debug(`任务完成，${job.id}`);
    //广播给所有人排队情况
    const message = {
      type: 'receive',
      queue_remaining: await this.drawService.getQueueLength(),
    };
    WsGateway.server.emit('message', JSON.stringify(message));
    return output + '';
  }

  /**
   *
   * @param job
   * @param server_url
   */
  async drawTaskExcu(job: Job, server_url: string) {
    return new Promise(async (resolve, reject) => {
      //client_id为用户id
      // this.logger.debug(
      //   `初始化websocket链接的结构${await this.websocketInit()}`,
      // );
      if (!(await this.websocketInit(server_url))) {
        reject({ status: 'error', data: job.data });
        return;
      }
      const {
        data: { source, client_id, prompt, socket_id, api },
      } = job;
      const params = {
        client_id: this.clientId, //固定值
        prompt: prompt,
      };
      const response = await this.drawService.sendTackprompt(
        server_url,
        params,
      );
      this.logger.debug(`发送绘画任务后的响应${response}`);
      if (response) {
        //将获取到的任务id保存到data中 方便后续在websocket失效的情况下也能取回绘画结果
        job.data.prompt_id = response;
        //将数据重新存给job
        await job.update(job.data);
        //监听服务器消息
        this.logger.debug(`发送绘画任务成功`);
        this.ws_client.onmessage = async (event: any) => {
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
            const { type, data } = JSON.parse(event.data + '');
            if (type === 'execution_error') {
              reject({ status: 'error', data: job.data });
            }
            if (type === 'executed') {
              //如果API是反推提示词输出文本结果
              if (api === '图片反推提示词') {
                const {
                  output: { tags },
                } = data;
                resolve(tags[0]);
              }
              // 解析视频
              const {
                data: {
                  output: { gifs },
                },
              } = JSON.parse(event.data + '');
              if (gifs && gifs[0]?.filename.includes('final')) {
                let videoUrl = '';
                //如果是微信消息
                const { filename, subfolder, type } = gifs[0];
                if (subfolder) {
                  videoUrl = `${server_url}/view?subfolder=${subfolder}&filename=${filename}&type=${type}`;
                } else {
                  videoUrl = `${server_url}/view?filename=${filename}&type=${type}`;
                }
                // 微信公众号回复
                if (source === 'wechat') {
                  const mediaId =
                    await this.wechatauthService.getMediaId(videoUrl);
                  await this.wechatauthService.sendServiceImageMessge(
                    mediaId,
                    client_id,
                  );
                }
                resolve(videoUrl);
              }

              // 解析图片
              const {
                data: {
                  output: { images },
                },
              } = JSON.parse(event.data + '');
              if (images && images[0]?.filename.includes('final')) {
                let imageUrl = '';
                //如果是微信消息
                const { filename, subfolder, type } = images[0];

                if (subfolder) {
                  imageUrl = `${server_url}/view?subfolder=${subfolder}&filename=${filename}&type=${type}`;
                } else {
                  imageUrl = `${server_url}/view?filename=${filename}&type=${type}`;
                }
                // 微信公众号回复
                // if (source === 'wechat') {
                //   const mediaId =
                //     await this.wechatauthService.getMediaId(imageUrl);
                //   await this.wechatauthService.sendServiceImageMessge(
                //     mediaId,
                //     client_id,
                //   );
                // }
                resolve(imageUrl);
              }
              //保存到数据库
              if (this.appSevice.Draw_SaveHistory) {
                //   todo 保存到数据库
              }
            }
          } catch (e) {
            this.logger.error(e);
          }
        };
      } else {
        reject({ status: 'error', data: job.data });
      }
    });
  }

  /**
   * 初始化与绘画服务端的链接
   */
  async websocketInit(server_url: string): Promise<boolean> {
    return new Promise(async (resolve) => {
      if (!this.validateWsconnect()) {
        const url = server_url.split('//')[1];
        this.ws_client = new Websocket(
          `${server_url.includes('https') ? 'wss' : 'ws'}://${url}/ws?clientId=${this.clientId}`,
        );
        this.ws_client.onopen = () => {
          this.logger.debug(
            '链接绘画服务器成功,链接状态：',
            this.ws_client.readyState,
          );
          resolve(true);
        };
        this.ws_client.onerror = () => {
          this.logger.error('链接绘画服务器失败');
          resolve(false);
        };
        setTimeout(() => {
          if (this.ws_client.readyState !== 1) {
            this.logger.error('链接绘画服务器超时');
            resolve(false);
          }
        }, 500);
      } else {
        resolve(true);
      }
    });
  }

  /**
   * 验证链接状态
   */
  validateWsconnect() {
    if (this.ws_client === undefined || this.ws_client.readyState !== 1) {
      this.logger.error('链接不存在,尝试重新连接');
      return false;
    } else {
      return true;
    }
  }

  @OnQueueActive()
  async onActive(job: Job) {
    const remain = await this.drawService.getQueueLength();
    //广播队列任务信息
    WsGateway.server.sockets?.emit('remain', {
      remain,
    });
    this.logger.debug(
      `onActive job ${job.id} of type ${job.name} with data ${job.data}...队列：：`,
      remain,
    );
  }

  @OnQueueCompleted()
  OnQueueCompleted(job: Job) {
    console.log(
      `Processing job ${job.id} of type ${job.name} with data ${job.returnvalue}...finished`,
    );
  }

  private async testTask() {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve('ok');
      }, 10000);
    });
  }
}
