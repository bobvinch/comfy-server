import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WsGateway } from './ws/ws.gateway';
import { DrawConsumer } from './draw/DrawCosumer';
import { ConfigModule } from '@nestjs/config';

//链接mongodb
import { MongooseModule } from '@nestjs/mongoose';

//链接mysql
// import { TypeOrmModule } from '@nestjs/typeorm';
// import { OneAPIUsersModule } from 'src/oneapi/users/users.module';
// import { TokensModule } from './oneapi/tokens/tokens.module';
import { ConfigService } from '@nestjs/config/dist';

//定时任务

import { WechatAuthModule } from './wechat-auth/wechat-auth.module';
import { XMLMiddleware } from './middleware/XML.middleware';
import { DrawModule } from './draw/draw.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CacheModule } from './cache/cache.module';

//'mongodb://username:password@localhost:27017/nest'
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`],
    }),
    //OneAPI数据库,如果不启动ONEAPI的大模型，删除此处的模块引入和oneapi模块
    // TypeOrmModule.forRootAsync({
    //   useFactory: (config: ConfigService) => ({
    //     type: 'mysql',
    //     host: config.get('ONEAPI_MYSQL_HOST'),
    //     port: 3306,
    //     username: config.get('ONEAPI_MYSQL_USERNAME'),
    //     password: config.get('ONEAPI_MYSQL_PASSWORD'),
    //     database: config.get('ONEAPI_MYSQL_DATABASE'),
    //     // entities: [User],
    //     autoLoadEntities: true,
    //     synchronize: false, //是否同步，正式环境设置为false
    //   }),
    //   inject: [ConfigService],
    // }),
    MongooseModule.forRootAsync({
      useFactory: (config: ConfigService) => ({
        uri: config.get('CONFIG_DB_MONGO_URI'),
        user: config.get('CONFIG_DB_MONGO_USERNAME'),
        pass: config.get('CONFIG_DB_MONGO_PASSWORD'),
        dbName: 'aidraw',
      }),
      inject: [ConfigService],
    }),
    WechatAuthModule,
    // OneAPIUsersModule,
    // TokensModule,
    DrawModule,
    ConfigModule,
    UsersModule,
    AuthModule,
    CacheModule,
  ],
  controllers: [AppController],
  providers: [AppService, WsGateway, DrawConsumer],
})
/**
 * 注册中间件,微信消息处理中间件
 */
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(XMLMiddleware).forRoutes({
      path: 'wechatauth/handleMessage',
      method: RequestMethod.POST,
    });
  }
}
