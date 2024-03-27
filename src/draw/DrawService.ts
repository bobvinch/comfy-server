import { Global, Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { ConfigService } from '@nestjs/config/dist';
import axios from 'axios';

@Global()
@Injectable()
export class DrawService {
  constructor(
    @InjectQueue('draw') private drawQueue: Queue,
    private readonly configService: ConfigService,
  ) {}
  private readonly logger = new Logger(DrawService.name);
  private readonly webSocketSeverUrl = this.configService.get(
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

  async sendToQueue(data: any) {
    console.log('发送队列触发了');
    const job = await this.drawQueue.add('text2img', data, {
      removeOnComplete: true,
    });
    // console.log('@@@@@@job result:');
    // console.log(job);
    return job;
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
  sendTackprompt(data: any) {
    this.logger.debug(
      '配置为',
      this.configService.get('CONFIG_COMFYUI_HTTP_SERVER_URL'),
    );
    return this.comfyuiAxios.post('/prompt', data);
  }
}
