import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WsGateway } from './ws/ws.gateway';
import { DrawService } from './draw/DrawService';
import { DrawModule } from './draw/DrawModule';
import { DrawConsumer } from './draw/DrawCosumer';
import { ConfigModule } from '@nestjs/config';

//链接mongodb
import { MongooseModule } from '@nestjs/mongoose';
import { DrawhistoryModule } from './drawhistory/drawhistory.module';
import { AimodelsModule } from './aimodels/aimodels.module';

//链接mysql
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/oneapi/users/users.module';
import { TokensModule } from './oneapi/tokens/tokens.module';
import { ConfigService } from '@nestjs/config/dist';
import { BullModule } from '@nestjs/bull';
//定时任务
import { ScheduleModule } from '@nestjs/schedule';
import { WechatAuthModule } from './wechat-auth/wechat-auth.module';
import { XMLMiddleware } from './middleware/XML.middleware';

//'mongodb://username:password@localhost:27017/nest'
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`],
    }),
    //OneAPI数据库,如果不启动ONEAPI的大模型，删除此处的模块引入和oneapi模块
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      username: new ConfigService().get('ONEAPI_MYSQL_USERNAME'),
      password: new ConfigService().get('ONEAPI_MYSQL_PASSWORD'),
      database: new ConfigService().get('ONEAPI_MYSQL_DATABASE'),
      // entities: [User],
      autoLoadEntities: true,
      synchronize: false,
    }),
    //绘画记录保存,默认是需要开启的，新建
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/test', {
      authSource: 'admin',
      user: new ConfigService().get('CONFIG_COMFYUI_HISTORY_MONGO_USERNAME'),
      pass: new ConfigService().get('CONFIG_COMFYUI_HISTORY_MONGO_PASSWORD'),
    }),
    BullModule.registerQueueAsync({
      name: 'draw',
      useFactory: (configService: ConfigService) => ({
        redis: {
          host: '127.0.0.1',
          port: 6379,
          password: "000415",
        },
      }),
    }),
    ScheduleModule.forRoot(),
    DrawhistoryModule,
    AimodelsModule,
    UsersModule,
    TokensModule,
    WechatAuthModule,
  ],
  controllers: [AppController],
  providers: [AppService, WsGateway, DrawService, DrawhistoryModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(XMLMiddleware).forRoutes({
      path: 'wechatauth/handleMessage',
      method: RequestMethod.POST,
    });
  }
}
