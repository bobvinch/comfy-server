import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
@Injectable()
export class CacheService {
  private redisClient: Redis;
  constructor() {
    // 在构造函数中初始化 Redis 客户端
    this.redisClient = new Redis({
      host: '127.0.0.1',
      port: 6379,
    });
  }
  //获取值
  async get(key): Promise<any> {
    let value = await this.redisClient.get(key);
    try {
      value = JSON.parse(value);
    } catch (error) {}
    return value;
  }
  /**
   * 设置值
   * @param key {string} key
   * @param value 值
   * @param second 过期时间 秒
   * @returns Promise<any>
   */
  async set(key: string, value: any, second?: number) {
    value = JSON.stringify(value);
    return this.redisClient.set(key, value);
  }
  //删除值
  async del(key: string) {
    return this.redisClient.del(key);
  }
  //清除缓存
  async flushall() {
    return this.redisClient.flushall();
  }
}
