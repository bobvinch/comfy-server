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

//定时任务

import { WechatAuthModule } from './wechat-auth/wechat-auth.module';
import { XMLMiddleware } from './middleware/XML.middleware';
import { DrawModule } from './draw/draw.module';

//'mongodb://username:password@localhost:27017/nest'
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [`.env.${process.env.NODE_ENV}`],
    }),

    WechatAuthModule,
    DrawModule,
  ],
  controllers: [AppController],
  providers: [AppService, WsGateway, DrawConsumer],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(XMLMiddleware).forRoutes({
      path: 'wechatauth/handleMessage',
      method: RequestMethod.POST,
    });
  }
}
