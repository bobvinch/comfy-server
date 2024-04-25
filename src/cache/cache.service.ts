import { Injectable } from '@nestjs/common';
import Redis from 'ioredis';
import { ConfigService } from '@nestjs/config';
import { InjectRedis } from '@nestjs-modules/ioredis';
@Injectable()
export class CacheService {
  // private redisClient: Redis;
  constructor(
    private readonly configService: ConfigService,
    @InjectRedis() private readonly redis: Redis,
    // private readonly redisService: RedisService,
  ) {
    console.log('环境变量', this.configService);
    // this.redisClient = this.redisService.getClient();
  }
  async root(): Promise<boolean> {
    // this.redisClient = await this.redisService.getClient();
    return true;
  }
  //获取值
  async get(key: string): Promise<any> {
    let value = await this.redis.get(key);
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
    return this.redis.set(key, value);
  }
  //删除值
  async del(key: string) {
    return this.redis.del(key);
  }
  //清除缓存
  async flushall() {
    return this.redis.flushall();
  }
}
