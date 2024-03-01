import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  OnGatewayConnection,
} from '@nestjs/websockets';
import { DrawhistoryService } from 'src/drawhistory/drawhistory.service';
import { DrawService } from 'src/draw/DrawService';
import { Logger } from '@nestjs/common';
import { Socket } from 'socket.io';

interface UserTasK {
  uid: string;
  socket_id: string;
  prompt_id?: string;
  task_id?: string; //mongdb数据库里的id
  // status: 'waiting' | 'processing' | 'finished';
}
/*
*记录任务信息
*@uid:用户id
@socket_id:socketid
@prompt_id:任务id，提交之后获取
*/
@WebSocketGateway(3002, {
  // 解决跨域
  allowEIO3: true,
  cors: {
    origin: '*',
  },
})
export class WsGateway implements OnGatewayInit, OnGatewayConnection {
  constructor(
    private readonly drawService: DrawService,//绘画任务队列
  ) {}
  private readonly logger = new Logger(WsGateway.name);
  afterInit(server: any) {
    WsGateway.server = server;
    // this.websocketInit();
    // console.log('@@server');
    // console.log(server);
  }

  // private static imageCount = 0;
  public static userTasks = [] as UserTasK[];
  private currentTask: UserTasK;
  private static target_socket_id = '';
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
    this.logger.log(
      '来自客户端' + client.id + '发来绘画指令' + JSON.stringify(payload),
    );

    const { client_id } = payload;
    //黑名单，如果满足条件发送系统消息给客户端
    const userList = ['65dab231189f86e370b2967a'];
    if (client_id && userList.includes(client_id)) {
      this.sendSystemMessage(client);
      return;
    }
    //加入队列
    this.drawService.sendToQueue(payload);
    // // const res = await sendTackprompt(params);

    // //将任务信息保存到数据库中
    // const saveRes = await this.drawHistory.create({
    //   user_id: client_id,
    //   prompt_id: res.data.prompt_id,
    //   draw_api: prompt,
    // });
    const newTask: UserTasK = {
      socket_id: client.id,
      uid: client_id,
      // prompt_id: res.data.prompt_id,
      // task_id: saveRes._id,
    };
    //更新useTask前检查uid是否存在是否存在
    const findindex = WsGateway.userTasks.findIndex(
      (item) => item.uid === client_id,
    );

    if (findindex != -1) {
      //存在更新
      WsGateway.userTasks[findindex] = newTask;
    } else {
      //不存在添加
      WsGateway.userTasks.push(newTask);
    }
    this.logger.debug('UserTack', WsGateway.userTasks);
    // // 回复消息给客户端
    // if (saveRes) {
    //   const { prompt_id } = saveRes;
    //   const message = { type: 'received', data: { prompt_id } };
    //   client.emit('message', message);
    // }

    // 当与服务器成功建立连接时的事件处理程序
    // console.log('当前的任务队列' + JSON.stringify(WsGateway.userTasks));
    return 'Hello world1!';
  }
  /**
   * 发送系统消息
   */
  sendSystemMessage(client: Socket) {
    const sysinfo = {
      message: '使用AI服务请遵守相关法律规定！',
      type: 'warning',
      timeout: -1,
    };
    client.emit('sysinfo', sysinfo);
  }
}
