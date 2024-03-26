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
    return await this.drawQueue.getJobCounts();
  }
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
}
