import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WsGateway } from './ws/ws.gateway';
import { DrawService } from './draw/DrawService';
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

//'mongodb://username:password@localhost:27017/nest'
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    //OneAPI数据库
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: '127.0.0.1',
      port: 3306,
      username: 'root',
      password: 'wangbo123',
      database: 'oneapi',
      // entities: [User],
      autoLoadEntities: true,
      synchronize: false,
    }),
    MongooseModule.forRoot('mongodb://127.0.0.1:27017/test', {
      authSource: 'admin',
      user: 'username',
      pass: 'password',
    }),
    BullModule.registerQueueAsync({
      name: 'draw',
      useFactory: () => ({
        redis: {
          host: '127.0.0.1',
          port: 6379,
          password: '000415',
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
  providers: [
    AppService,
    WsGateway,
    DrawService,
    DrawConsumer,
    DrawhistoryModule,
  ],
})
export class AppModule {}
