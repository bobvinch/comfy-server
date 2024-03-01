import WebSocket = require('ws'); // 导入WebSocket模块

export default class websocketClient {
  private socket: WebSocket;
  private onMessage!: (data: any) => void;
  private onOpen!: () => void;
  private onClose!: () => void;
  private onError!: (error: any) => void;
  private initializewebsocket(url: string) {
    this.socket = new WebSocket(url);
    this.socket.onopen = this.onOpen;
    this.socket.onclose = this.onClose;
    this.socket.onerror = this.onError;
    this.socket.onmessage = this.onMessage;
  }
  public connect(url: string) {
    this.initializewebsocket(url);
  }
  public close() {
    this.socket.close();
    console.log('链接关闭');
  }

  public async message() {
    return new Promise((resolve) => {
      this.socket.onmessage = async (e) => {
        // console.log("封装摸块@@@e", e.data);
        resolve(e.data);
      };
    });
  }
}
