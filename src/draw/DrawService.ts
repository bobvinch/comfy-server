import { Injectable } from "@nestjs/common";
import { Queue } from "bull";
import { InjectQueue } from "@nestjs/bull";
import { ConfigService } from "@nestjs/config/dist";
import axios from "axios";
import comfyAPI_qicktext2img from "./comfyAPI_qicktext2img.json";

@Injectable()
export class DrawService {
  constructor(
    @InjectQueue('draw') private drawQueue: Queue,
    private readonly configService: ConfigService,
  ) {}

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
    console.log(this.webSocketSeverUrl);
    const res = await this.comfyuiAxios.post('/prompt', data);
    const { prompt_id } = res.data;
    return prompt_id;
  }
  async quckText2img(positive: string, client_id: string) {
    comfyAPI_qicktext2img[24].inputs.text = positive;
    comfyAPI_qicktext2img[32].inputs.noise_seed = this.generateRandomNumber(15);
    const data = { prompt: comfyAPI_qicktext2img, client_id };
    return await this.sendTackprompt(data);
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

  /**
   * 轮询方式取回图片
   * @param prompt_id
   */
  async getOutputImage(prompt_id: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        setInterval(() => {
          this.comfyuiAxios.post('/history', prompt_id).then((res) => {
            const { outputs } = res.data;
            if (outputs) {
              const { filename, subfolder, type } = outputs[0];
              if (subfolder) {
                resolve(
                  this.webSocketSeverUrl +
                    '/view?subfolder' +
                    subfolder +
                    '&filename=' +
                    filename +
                    '&type=' +
                    type,
                );
              } else {
                resolve(
                  this.webSocketSeverUrl +
                    '/view?filename=' +
                    filename +
                    '&type=' +
                    type,
                );
              }
            }
          });
        }, 200);
      }, 2000);
    });
  }
}
