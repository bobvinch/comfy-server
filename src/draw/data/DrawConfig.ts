/**
 * 绘画模块配置参数
 */

export const drawConfig={
  defaultTimeOut: 60, //默认任务超时时间
};

export const ApiTimeOut = [
  {
    type: '文生图',
    timeout: 60,
  },
  {
    type: '图生图',
    timeout: 60,
  },
  {
    type: '图生视频',
    timeout: 120,
  },
  {
    type: 'AI模特',
    timeout: 120,
  },
  {
    type: 'AI写真',
    timeout: 240,
  },
  {
    type: '放大1',
    timeout: 120,
  },
  {
    type: '放大2',
    timeout: 180,
  },
  {
    type: '图片反推提示词',
    timeout: 20,
  },
] as ComfyAPIType[];

export interface ComfyAPIType {
  type:
    | '文生图'
    | '图生图'
    | '图生视频'
    | 'AI模特'
    | 'AI写真'
    | '放大1'
    | '放大2'
    | 'AI推文'
    | '换脸'
    | '图片反推提示词';
  timeout: number;
}

export interface DrawTask {
  source: 'wechat' | 'web';
  client_id: string;
  prompt: any;
  api: string;
  socket_id?: string;
  lifo?: boolean;
  prompt_id?: string;
}
