import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';
import { DrawService } from '../draw/draw.service';
import { DrawTask } from '../draw/data/DrawConfig';
@WebSocketGateway(3002, {
  // 解决跨域
  allowEIO3: true,
  cors: {
    origin: '*',
  },
})
export class WsGateway implements OnGatewayInit, OnGatewayConnection {
  constructor(
    private readonly drawService: DrawService, //绘画任务队列
  ) {}

  private readonly logger = new Logger(WsGateway.name);

  afterInit(server: any) {
    this.logger.log(`WebSocket server started on port ${server}`);
    WsGateway.server = server;
  }

  public static server;

  @SubscribeMessage('connection')
  handleConnection(client: Socket) {
    this.logger.log(client.id, '@连接到了服务器');
  }

  @SubscribeMessage('message')
  handleMessage(client: any, payload: any): string {
    this.logger.log('来自客户端：' + client.id + '@@@@@@@的消息：' + payload);
    return 'Hello world1!';
  }

  @SubscribeMessage('draw')
  async handleDrawMessage(client: any, payload: any): Promise<string> {
    this.logger.log('来自客户端' + client.id + '发来绘画指令');

    const { client_id, prompt, api } = payload;
    //黑名单，如果满足条件发送系统消息给客户端
    const userList = ['65dab231189f86e370b2967a'];
    if (client_id && userList.includes(client_id)) {
      //返送警告信息
      this.sendSystemMessage(
        client.id,
        '您已被加入黑名单，请勿再次发送绘画指令',
      );
      return;
    }
    // AI推文不限制加入队列
    if ((await this.drawService.isInQueue(client_id)) && api != 'AI推文') {
      const message = {
        type: 'reject',
        queue_remaining: await this.drawService.getQueueLength(),
      };
      client.emit('message', JSON.stringify(message));
    } else {
      //加入队列
      const data = {
        source: 'web',
        client_id,
        prompt,
        api,
        socket_id: client.id,
      } as DrawTask;
      await this.drawService.sendToQueue(data);
      //回复消息给客户端
      const message = {
        type: 'receive',
        queue_remaining: await this.drawService.getQueueLength(),
      };
      client.emit('message', JSON.stringify(message));
    }
    return 'Hello world1!';
  }

  /**
   * 发送系统消息
   */
  sendSystemMessage(socketid: string, message: string) {
    const sysinfo = {
      message: message,
      type: 'warning',
      timeout: -1,
    };
    const client = WsGateway.server.sockets.connected[socketid];
    if (client) {
      client.emit('sysinfo', sysinfo);
    }
  }
}
