import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { parseString } from 'xml2js';

/**
 * XML 中间件,微信消息前置处理为json
 *
 */
@Injectable()
export class XMLMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    console.log('XML middlewarem excting');
    const buffer: any[] = []; // 创建一个空数组，用于存储请求的数据
    // 监听 req 的 data 事件，每当有数据到达时，就将数据推入 buffer 数组中
    req.on('data', (chunk) => {
      buffer.push(chunk);
    });
    // 监听 req 的 end 事件，表示请求数据已经接收完毕时，执行以下操作：
    req.on('end', () => {
      // 将 buffer 数组中的数据拼接成一个字符串，并以 utf-8 编码转换为 msgXml 变量
      const msgXml = Buffer.concat(buffer).toString('utf-8');

      // 调用 parseString 函数，将 msgXml 变量中的 xml 格式的数据解析为 JavaScript 对象，并赋值给 result 变量。
      // 如果解析过程出现错误，则抛出异常并拒绝 promise。
      parseString(msgXml, (err, result) => {
        if (err) {
          throw err;
        }

        // 将 result 变量赋值给 req.body 属性，表示将请求体转换为 JavaScript 对象。
        req.body = result;

        // 调用 next 函数，表示继续执行下一个中间件函数。
        next();
      });
    });
  }
}
