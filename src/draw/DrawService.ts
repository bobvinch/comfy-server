import { Global, Injectable } from '@nestjs/common';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';

@Global()
@Injectable()
export class DrawService {
  constructor(@InjectQueue('draw') private drawQueue: Queue) {}
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
    return await this.drawQueue.count();
  }
}
