<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description
<p align="center">
  <img src="https://wangbo0808.oss-cn-shanghai.aliyuncs.com/assets/hear.png" width="100%" alt="function description" />
</p>
<p align="center">
  <img src="https://wangbo0808.oss-cn-shanghai.aliyuncs.com/assets/api%20descrption.png" width="100%" alt="function description" />
</p>
<p align="center">
  <img src="https://wangbo0808.oss-cn-shanghai.aliyuncs.com/assets/response.png" width="100%" alt="function description" />
</p>

## 开始使用前必读！！！！
开始使用前请先安装redis，并配置.env .end.development .env.production环境变量中密码，如果有的话，没有密码则将密码配置删除
然后检查环境变量中ComfyUI的http路径和websocket路径
## 功能介绍
<p>最新0411更新，重大更新，增加大量商业化能力，运营AI绘画商业网站必备后台服务器</p>
<p>核心功能1：ComfyUI的绘画API服务和websocket转发，客户端必须使用socketIO链接，WS无法连接，注意版本</p>
<p>核心功能2：方便将任意comfyui工作转换为在线API，向外提供AI能力</p>
<p>ComfyUI server之间可以共享AI绘画能力</p>
<p>天然支持利用nginx直接实现负载均衡</p>
<p>增加注册，登录，微信登录，鉴权，黑名单等常用运营功能</p>
<p>支持任务队列，支持API提交任务的时候指定队列</p>
<p>支持黑名单管理</p>
<p>一键接入微信公众号，并且支持利用别人的API接入微信绘画，支持多轮指令记忆，能够区分绘画指令和提示词</p>

## 如何使用
<p>1.先按照如下如下方式启动服务器</p>
<p>2.客户端通过socketIO链接服务器，默认为3002端口，如果冲突在src/ws/ws.gateway.ts中修改</p>
<p>3.以websocket消息形式提交，提交绘画任务,事件名称为draw,消息格式：{client_id:"userid", prompt:"comfyui API", api:"define a API name" }</p>
<p>4、使用微信公众号绘画功能需要配置APPID和Secret</p>
教程地址：https://www.bilibili.com/video/BV1AE42137Gn?t=40.6
## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
