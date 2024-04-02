import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  // 是否启用保存绘画历史记录
  public Draw_SaveHistory = false;
  getHello(): string {
    return 'Welcome to my comfyui server'.toUpperCase();
  }
}
